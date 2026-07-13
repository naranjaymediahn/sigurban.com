import { query } from './db'
import { ensureContentSchema } from './contentSchema'
import { getFallbackSettings, saveFallbackSettings } from './fallbackStore'
import { DEFAULT_CHATBOT_SYSTEM_PROMPT, DEFAULT_CRM_LEAD_ENDPOINT, DEFAULT_N8N_LEAD_WEBHOOK_URL } from '../../utils/chatbotDefaults'
import { DEFAULT_CTA_QUOTES } from '../../utils/defaultCtaQuotes'
import { DEFAULT_BANK_PARTNERS } from '../../utils/defaultBankPartners'

export const DEFAULT_SITE_SETTINGS = {
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  smtp_from_name: 'Sig-Urban Web',
  smtp_to: '',
  notification_cc: '',
  admin_template_html: '',
  confirmation_template_html: '',
  instagram_token: '',
  facebook_token: '',
  hero_autoplay_seconds: '4.5',
  ga_measurement_id: '',
  whatsapp_number: '50431731754',
  promo_code: '#FBSIGURBAN',
  chatbot_system_prompt: DEFAULT_CHATBOT_SYSTEM_PROMPT,
  chatbot_enabled: '1',
  n8n_lead_webhook_url: DEFAULT_N8N_LEAD_WEBHOOK_URL,
  crm_lead_endpoint: DEFAULT_CRM_LEAD_ENDPOINT,
  blog_permalink_mode: 'date',
  cta_quotes_json: JSON.stringify(DEFAULT_CTA_QUOTES),
  bank_partners_json: JSON.stringify(DEFAULT_BANK_PARTNERS),
}

function normalizeSettings(input: Record<string, any> = {}) {
  const autoplay = Number(input.hero_autoplay_seconds)
  return {
    smtp_host: String(input.smtp_host || ''),
    smtp_port: String(input.smtp_port || '587'),
    smtp_user: String(input.smtp_user || ''),
    smtp_pass: String(input.smtp_pass || ''),
    smtp_from_name: String(input.smtp_from_name || 'Sig-Urban Web'),
    smtp_to: String(input.smtp_to || ''),
    notification_cc: String(input.notification_cc || ''),
    admin_template_html: String(input.admin_template_html || ''),
    confirmation_template_html: String(input.confirmation_template_html || ''),
    instagram_token: String(input.instagram_token || ''),
    facebook_token: String(input.facebook_token || ''),
    hero_autoplay_seconds: String(autoplay > 0 ? autoplay : 4.5),
    ga_measurement_id: String(input.ga_measurement_id || ''),
    whatsapp_number: String(input.whatsapp_number || '50431731754'),
    promo_code: String(input.promo_code || '#FBSIGURBAN'),
    chatbot_system_prompt: String(input.chatbot_system_prompt || DEFAULT_CHATBOT_SYSTEM_PROMPT),
    chatbot_enabled: String(input.chatbot_enabled ?? '1'),
    n8n_lead_webhook_url: String(input.n8n_lead_webhook_url || ''),
    crm_lead_endpoint: String(input.crm_lead_endpoint || DEFAULT_CRM_LEAD_ENDPOINT),
    blog_permalink_mode: ['date', 'category', 'simple'].includes(input.blog_permalink_mode) ? input.blog_permalink_mode : 'date',
    cta_quotes_json: String(input.cta_quotes_json || JSON.stringify(DEFAULT_CTA_QUOTES)),
    bank_partners_json: String(input.bank_partners_json || JSON.stringify(DEFAULT_BANK_PARTNERS)),
  }
}

export async function getSiteSettings() {
  try {
    await ensureContentSchema()
    const rows = await query<{ setting_key: string, setting_value: string }>(
      'SELECT setting_key, setting_value FROM site_settings'
    )
    const map = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value
      return acc
    }, {} as Record<string, string>)
    return normalizeSettings({ ...DEFAULT_SITE_SETTINGS, ...map })
  } catch (dbError) {
    try {
      const fallback = await getFallbackSettings()
      return normalizeSettings({ ...DEFAULT_SITE_SETTINGS, ...fallback })
    } catch (fallbackError) {
      console.error('[siteSettings] No se pudo leer configuración ni de MySQL ni de fallback', {
        dbError: (dbError as Error)?.message,
        fallbackError: (fallbackError as Error)?.message,
      })
      return { ...DEFAULT_SITE_SETTINGS }
    }
  }
}

export async function saveSiteSettings(settings: Record<string, any>) {
  const normalized = normalizeSettings(settings)

  try {
    await ensureContentSchema()
    for (const [key, value] of Object.entries(normalized)) {
      await query(
        `INSERT INTO site_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, value]
      )
    }
    return { ok: true, fallbackMode: false }
  } catch (dbError) {
    try {
      await saveFallbackSettings(normalized)
      return { ok: true, fallbackMode: true }
    } catch (fallbackError) {
      console.error('[siteSettings] No se pudo guardar configuración ni en MySQL ni en fallback', {
        dbError: (dbError as Error)?.message,
        fallbackError: (fallbackError as Error)?.message,
      })
      return { ok: false, error: 'No se pudo guardar la configuración' }
    }
  }
}
