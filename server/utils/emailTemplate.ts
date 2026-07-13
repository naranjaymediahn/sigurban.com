export type FormType = 'distributor' | 'contact' | 'email' | string

interface TemplateData {
  type: FormType
  fields: Record<string, string>
  receivedAt?: string
  customMessageHtml?: string
}

const SITE_URL    = 'https://sulafbc.com'
const LOGO_SULA   = `${SITE_URL}/images/sulalogo.svg`          // header
const LOGO_SFB    = `${SITE_URL}/images/sfblogo.svg`           // header derecha
const LOGO_SFB_PNG = `${SITE_URL}/images/SFBdistribution-p-500.png` // footer

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  distributor: { label: 'Solicitud de Distribuidor', color: '#f5c518', icon: '🤝' },
  contact:     { label: 'Mensaje de Contacto',       color: '#78af2b', icon: '✉️' },
  email:       { label: 'Suscripción de Email',      color: '#2358a8', icon: '📧' },
}

// ── Correo INTERNO al admin ──────────────────────────────────────────
export function buildAdminTemplate({ type, fields, receivedAt, customMessageHtml }: TemplateData): string {
  const cfg  = typeConfig[type] ?? { label: 'Formulario Web', color: '#1a3a5c', icon: '📋' }
  const date = receivedAt ?? new Date().toLocaleString('es-HN', { dateStyle: 'full', timeStyle: 'short' })

  const rows = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `
      <tr>
        <td style="padding:10px 16px;font-weight:700;color:#555;background:#f8f9fb;width:36%;border-bottom:1px solid #e8ecf0;font-size:13px;vertical-align:top;">${k}</td>
        <td style="padding:10px 16px;color:#1e293b;border-bottom:1px solid #e8ecf0;font-size:13px;white-space:pre-wrap;line-height:1.6;">${v}</td>
      </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${cfg.label} — SULAFBC</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:36px 0;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:18px;overflow:hidden;box-shadow:0 6px 32px rgba(0,0,0,0.10);">

    <!-- ── HEADER: logo Sula izquierda + logo SFB derecha ── -->
    <tr><td style="background:#1a3a5c;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:18px 28px;vertical-align:middle;">
            <img src="${LOGO_SULA}" alt="Sula" height="46" style="display:block;height:46px;width:auto;">
          </td>
          <td style="padding:14px 28px 14px 0;text-align:right;vertical-align:middle;">
            <img src="${LOGO_SFB}" alt="SFB Distribution" height="40" style="display:block;height:40px;width:auto;margin-left:auto;max-width:140px;">
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- ── Tipo de formulario (color-coded) ── -->
    <tr><td style="background:${cfg.color};padding:14px 28px;">
      <p style="margin:0;font-size:16px;font-weight:800;color:#fff;letter-spacing:0.5px;">${cfg.icon}&nbsp;&nbsp;${cfg.label} — Nuevo mensaje</p>
    </td></tr>

    <!-- ── Fecha ── -->
    <tr><td style="background:#fff;padding:20px 28px 8px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;letter-spacing:0.5px;">Recibido el <strong style="color:#64748b;">${date}</strong></p>
    </td></tr>

    <!-- ── Mensaje personalizado ── -->
    ${customMessageHtml ? `
    <tr><td style="background:#fff;padding:8px 28px 16px;">
      <div style="background:#f8fafc;border-left:4px solid ${cfg.color};border-radius:0 8px 8px 0;padding:14px 18px;font-size:14px;color:#334155;line-height:1.7;">
        ${customMessageHtml}
      </div>
    </td></tr>` : ''}

    <!-- ── Tabla de datos ── -->
    <tr><td style="background:#fff;padding:8px 28px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
        ${rows}
      </table>
    </td></tr>

    <!-- ── CTA ir al panel ── -->
    <tr><td style="background:#fff;padding:0 28px 28px;">
      <a href="${SITE_URL}/admin"
         style="display:inline-block;background:#1a3a5c;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:0.3px;">
        Ver en panel admin →
      </a>
    </td></tr>

    <!-- ── Footer ── -->
    <tr><td style="background:#f1f5f9;padding:18px 28px;border-top:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-size:11px;color:#94a3b8;">Correo automático · <a href="${SITE_URL}" style="color:#78af2b;text-decoration:none;">sulafbc.com</a> · © ${new Date().getFullYear()} Sula</p>
          </td>
          <td style="text-align:right;">
            <img src="${LOGO_SFB_PNG}" alt="SFB Distribution" height="28" style="height:28px;width:auto;opacity:0.6;">
          </td>
        </tr>
      </table>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>`
}

// ── Correo de CONFIRMACIÓN a la persona que escribió ────────────────
export function buildConfirmationTemplate(type: FormType, nombre?: string, customMessageHtml?: string): string {
  const saludo       = nombre ? `Hola, <strong>${nombre}</strong>` : 'Hola'
  const esDistribuidor = type === 'distributor'
  const esContacto   = type === 'contact'

  const mensaje = customMessageHtml || (esDistribuidor
    ? `Hemos recibido tu solicitud para convertirte en distribuidor de productos Sula.<br><br>
       Nuestro equipo revisará tu información y se pondrá en contacto contigo <strong>dentro de las próximas 48 horas</strong> para continuar el proceso.`
    : esContacto
    ? `Hemos recibido tu mensaje y nos alegra que te hayas comunicado con nosotros.<br><br>
       Un miembro de nuestro equipo te responderá <strong>a la brevedad posible</strong>.`
    : `¡Gracias por suscribirte! Estaremos enviándote novedades y actualizaciones de productos Sula.`)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>¡Mensaje recibido! — SULAFBC</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:36px 0;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:18px;overflow:hidden;box-shadow:0 6px 32px rgba(0,0,0,0.10);">

    <!-- ── Header verde con logo blanco ── -->
    <tr><td style="background:#78af2b;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:26px 28px 22px;">
            <!-- Logo blanco Sula sobre fondo verde -->
            <img src="${LOGO_SULA}" alt="Sula" height="44" style="display:block;height:44px;width:auto;">
            <p style="margin:6px 0 0;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.75);text-transform:uppercase;">sulafbc.com</p>
          </td>
          <td style="padding:20px 28px 20px 0;text-align:right;vertical-align:middle;">
            <div style="background:rgba(255,255,255,0.18);border-radius:50%;width:56px;height:56px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- ── Barra degradada decorativa ── -->
    <tr><td style="padding:0;">
      <div style="height:5px;background:linear-gradient(90deg,#78af2b 0%,#f5c518 50%,#78af2b 100%);"></div>
    </td></tr>

    <!-- ── Saludo principal ── -->
    <tr><td style="background:#fff;padding:36px 28px 24px;">
      <p style="margin:0 0 8px;font-size:24px;font-weight:900;color:#1a3a5c;line-height:1.2;">¡Mensaje recibido!</p>
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.75;">
        ${saludo},<br><br>
        ${mensaje}
      </p>
    </td></tr>

    <!-- ── Separador ── -->
    <tr><td style="background:#fff;padding:0 28px;">
      <div style="height:1px;background:#e2e8f0;"></div>
    </td></tr>

    <!-- ── Contacto directo ── -->
    <tr><td style="background:#fff;padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:11px;font-weight:800;color:#1a3a5c;text-transform:uppercase;letter-spacing:1.5px;">¿Necesitas hablar con nosotros?</p>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:5px 14px 5px 0;font-size:18px;">📧</td>
          <td style="font-size:14px;color:#475569;">
            <a href="mailto:info@sulafbc.com" style="color:#78af2b;text-decoration:none;font-weight:600;">info@sulafbc.com</a>
          </td>
        </tr>
        <tr>
          <td style="padding:5px 14px 5px 0;font-size:18px;">🌐</td>
          <td style="font-size:14px;color:#475569;">
            <a href="${SITE_URL}" style="color:#78af2b;text-decoration:none;font-weight:600;">sulafbc.com</a>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- ── CTA ── -->
    <tr><td style="background:#fff;padding:0 28px 36px;">
      <a href="${SITE_URL}"
         style="display:inline-block;background:#78af2b;color:#fff;text-decoration:none;padding:15px 36px;border-radius:9px;font-size:14px;font-weight:800;letter-spacing:0.5px;">
        Visitar sulafbc.com →
      </a>
    </td></tr>

    <!-- ── Footer con logo SFB ── -->
    <tr><td style="background:#1a3a5c;padding:22px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <p style="margin:0 0 3px;font-size:12px;color:rgba(255,255,255,0.85);font-weight:700;">SULAFBC — Productos Sula en Estados Unidos</p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);">© ${new Date().getFullYear()} Sula · Todos los derechos reservados</p>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <img src="${LOGO_SFB_PNG}" alt="SFB Distribution" height="32" style="height:32px;width:auto;max-width:120px;object-fit:contain;opacity:0.9;">
          </td>
        </tr>
      </table>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>`
}
