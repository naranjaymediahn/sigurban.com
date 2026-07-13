import nodemailer from 'nodemailer'
import { buildAdminTemplate } from '../utils/emailTemplate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { type, fields } = body

  const config = useRuntimeConfig()
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_TO, SMTP_FROM_NAME } = config

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_TO) {
    return { ok: false, error: 'SMTP no configurado' }
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

  const html = buildAdminTemplate({ type, fields })

  const typeLabels: Record<string, string> = {
    distributor: 'Nueva solicitud de distribuidor',
    contact: 'Nuevo mensaje de contacto',
    email: 'Nueva suscripción de email',
  }
  const subject = typeLabels[type] ?? 'Nuevo formulario SULAFBC'

  try {
    await transporter.sendMail({
      from: `"${SMTP_FROM_NAME || 'SULAFBC Web'}" <${SMTP_USER}>`,
      to: SMTP_TO,
      subject,
      html,
    })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
})
