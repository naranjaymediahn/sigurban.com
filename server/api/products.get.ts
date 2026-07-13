import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { listFallbackProducts } from '../utils/fallbackStore'

export default defineEventHandler(async () => {
  try {
    await ensureContentSchema()
    const rows = await query(
      `SELECT id, slug, name_es, name_en, image, sort_order, is_active, location_es, description_es, description_long_es, badge_es, maps_url
       FROM products
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    )
    return { ok: true, data: rows }
  } catch (err: any) {
    return { ok: true, fallback: true, error: err.message, data: await listFallbackProducts(false) }
  }
})
