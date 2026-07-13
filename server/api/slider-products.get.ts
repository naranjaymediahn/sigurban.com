import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { listFallbackSliderProducts } from '../utils/fallbackStore'

export default defineEventHandler(async () => {
  try {
    await ensureContentSchema()
    const rows = await query<any>(
      `SELECT id, slug, name_es, name_en, image, sort_order, is_active,
              category, category_es, category_en, subtitle, subtitle_es, subtitle_en,
              tagline_es, tagline_en, description_es, description_en,
              format, format_es, shelf_life, shelf_life_es, store_temp, units_per_case, logistics, logistics_es,
              gallery_json
       FROM slider_products
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    )
    const data = rows.map((row) => {
      let gallery: string[] = []
      try { gallery = row.gallery_json ? JSON.parse(row.gallery_json) : [] } catch { gallery = [] }
      return { ...row, gallery }
    })
    return { ok: true, data }
  } catch (err: any) {
    return { ok: true, fallback: true, error: err.message, data: await listFallbackSliderProducts(false) }
  }
})
