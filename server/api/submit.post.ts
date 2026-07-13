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

  // ── 2. Enviar correos ──────────────────────────────────────────
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_TO, SMTP_FROM_NAME } = config
  const smtpTo = settings.smtp_to || SMTP_TO

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
