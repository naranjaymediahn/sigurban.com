import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { listFallbackHeroSlides } from '../utils/fallbackStore'
import { getSiteSettings } from '../utils/siteSettings'

export default defineEventHandler(async () => {
  const settings = await getSiteSettings()
  const autoplaySeconds = Number(settings.hero_autoplay_seconds) || 4.5

  try {
    await ensureContentSchema()
    const rows = await query(
      `SELECT id, media_type, image, video, video_en, title_es, title_en, alt_es, alt_en,
              image_class, title_class, has_baked_text, overlay_x, overlay_y, sort_order, is_active
       FROM hero_slides
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    )
    return { ok: true, data: rows, autoplaySeconds }
  } catch (err: any) {
    return { ok: true, fallback: true, error: err.message, data: await listFallbackHeroSlides(false), autoplaySeconds }
  }
})
