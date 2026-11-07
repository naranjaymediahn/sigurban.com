import nodemailer from 'nodemailer'
import { query } from '../utils/db'
import { buildAdminTemplate, buildConfirmationTemplate } from '../utils/emailTemplate'
import { getSiteSettings } from '../utils/siteSettings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { type, fields, cc = [] } = body
  // fields: { "Nombre": "Juan", "Email": "juan@..." ... }
  // cc: array de correos adicionales que recibirán copia

  const config = useRuntimeConfig()
  const settings = await getSiteSettings()

  // ── 1. Guardar en MySQL ─────────────────────────────────────────
  const f = fields as Record<string, string>

  // Estándar de datos (también aquí, por si el formulario se envía sin pasar por el navegador)
  if (type === 'contactanos') {
    if (f['Nombre']) f['Nombre'] = normalizeName(f['Nombre'])
    const ph = normalizePhone(f['Teléfono'])
    if (!ph.ok) {
      throw createError({ statusCode: 400, statusMessage: ph.reason || 'Teléfono inválido' })
    }
    f['Teléfono'] = ph.value
    const extra = [
      f['Lugar de trabajo'] && `Lugar de trabajo: ${f['Lugar de trabajo']}`,
      f['Posición'] && `Posición: ${f['Posición']}`,
      f['Salario'] && `Salario: L ${f['Salario']}`,
      f['Antigüedad'] && `Antigüedad: ${f['Antigüedad']}`,
    ].filter(Boolean).join(' | ')
    const otra = f['Cotiza para otra persona'] ? `Cotiza para otra persona: ${f['Cotiza para otra persona']}` : ''
    const todo = [extra, otra].filter(Boolean).join(' | ')
    if (todo) f['Mensaje'] = [f['Mensaje'], todo].filter(Boolean).join('\n')
  }
  try {
    await query(
      `INSERT INTO distribution
        (type, email, name, contact, phone, address, state, product_interest, company, subject, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type,
        f['Email'] ?? f['email'] ?? null,
        f['Negocio'] ?? f['name'] ?? null,
        f['Contacto'] ?? f['contact'] ?? null,
        f['Teléfono'] ?? f['phone'] ?? null,
        f['Dirección'] ?? f['address'] ?? null,
        f['Estado'] ?? f['state'] ?? null,
        f['Productos de interés'] ?? f['product_interest'] ?? null,
        f['Empresa'] ?? f['company'] ?? null,
        f['Asunto'] ?? f['subject'] ?? null,
        f['Mensaje'] ?? f['message'] ?? null,
      ]
    )
  } catch (dbErr: any) {
    console.error('[submit] MySQL error:', dbErr.message)
    // No detener el flujo, igual intentar enviar correo
  }

  // ── 1b. Quien quiere aplicar y trae identidad válida pasa también al CRM ──
  if (type === 'contactanos' && f['Asunto'] === 'Quiero aplicar a una casa' && f['DNI']) {
    const idStd = normalizeIdentity(f['DNI'], f['Teléfono'])
    const url = settings.crm_lead_endpoint || config.CRM_LEAD_ENDPOINT
    if (idStd.ok && url) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (config.CRM_LEAD_TOKEN) headers.Authorization = `Bearer ${config.CRM_LEAD_TOKEN}`
        const body: Record<string, string> = { name: f['Nombre'], dni: idStd.value, phone: f['Teléfono'] }
        if (f['Lugar de trabajo']) body.workAddress = f['Lugar de trabajo']
        if (f['Posición']) body.workPosition = f['Posición']
        if (f['Salario']) body.salary = String(f['Salario']).replace(/[^0-9.]/g, '')
        if (f['Antigüedad']) body.workTime = f['Antigüedad']
        const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
        if (!r.ok) console.error('[submit] CRM respondió', r.status, (await r.text().catch(() => '')).slice(0, 200))
      } catch (crmErr: any) {
        console.error('[submit] CRM error:', crmErr.message)
      }
    }
  }

  // ── 2. Enviar correos ──────────────────────────────────────────
  // Prioridad: configuración guardada en /admin → Configuración → Correo.
  // .env solo sirve como respaldo si /admin no tiene nada configurado aún.
  const SMTP_HOST = settings.smtp_host || config.SMTP_HOST
  const SMTP_USER = settings.smtp_user || config.SMTP_USER
  const SMTP_PASS = settings.smtp_pass || config.SMTP_PASS
  const SMTP_PORT = settings.smtp_port || config.SMTP_PORT
  const SMTP_FROM_NAME = settings.smtp_from_name || config.SMTP_FROM_NAME
  const smtpTo = settings.smtp_to || config.SMTP_TO

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !smtpTo) {
    return { ok: true, emailSent: false, reason: 'SMTP no configurado' }
  }

  const port = Number(SMTP_PORT) || 587
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  })

  const typeLabels: Record<string, string> = {
    distributor: 'Nueva solicitud de distribuidor',
    contact:     'Nuevo mensaje de contacto',
    email:       'Nueva suscripción de email',
  }
  const subject = typeLabels[type] ?? 'Nuevo formulario SULAFBC'
  const adminHtml = buildAdminTemplate({
    type,
    fields,
    customMessageHtml: settings.admin_template_html || '',
  })
  const mergedCc = Array.from(new Set([
    ...cc,
    ...String(settings.notification_cc || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ]))

  // Correo al admin (+ copias CC)
  try {
    await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_USER}>`,
      to:   smtpTo,
      cc:   mergedCc.length ? mergedCc.join(',') : undefined,
      subject,
      html: adminHtml,
    })
  } catch (mailErr: any) {
    console.error('[submit] Admin email error:', mailErr.message)
  }

  // Correo de confirmación a quien escribió
  const userEmail = f['Email'] ?? f['email']
  const userName  = f['Contacto'] ?? f['Nombre'] ?? f['contact'] ?? f['name'] ?? undefined

  if (userEmail) {
    const confirmHtml = buildConfirmationTemplate(type, userName, settings.confirmation_template_html || '')
    try {
      await transporter.sendMail({
        from:    `"${SMTP_FROM_NAME}" <${SMTP_USER}>`,
        to:      userEmail,
        subject: '✅ Recibimos tu mensaje — SULAFBC',
        html:    confirmHtml,
      })
    } catch (confirmErr: any) {
      console.error('[submit] Confirmation email error:', confirmErr.message)
    }
  }

  return { ok: true, emailSent: true }
})
