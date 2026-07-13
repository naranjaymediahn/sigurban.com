import { getSiteSettings } from '../utils/siteSettings'

export default defineEventHandler(async () => {
  const settings = await getSiteSettings()
  return {
    ok: true,
    data: {
      whatsapp_number: settings.whatsapp_number,
      promo_code: settings.promo_code,
      ga_measurement_id: settings.ga_measurement_id,
      blog_permalink_mode: settings.blog_permalink_mode,
      cta_quotes: (() => {
        try { return JSON.parse(settings.cta_quotes_json) } catch { return [] }
      })(),
    },
  }
})
