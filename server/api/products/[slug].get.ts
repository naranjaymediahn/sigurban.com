import { query } from '../../utils/db'
import { ensureContentSchema } from '../../utils/contentSchema'
import { listFallbackProducts } from '../../utils/fallbackStore'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  try {
    await ensureContentSchema()
    const rows = await query(
      `SELECT id, slug, name_es, name_en, image, sort_order, is_active, location_es, description_es, description_long_es, badge_es, maps_url
       FROM products WHERE slug = ? AND is_active = 1 LIMIT 1`,
      [slug]
    )
    if (!rows.length) return createError({ statusCode: 404, message: 'Proyecto no encontrado' })
    return { ok: true, data: rows[0] }
  } catch (err: any) {
    const products = await listFallbackProducts(false)
    const found = products.find((p: any) => p.slug === slug)
    if (found) return { ok: true, fallback: true, data: found }
    return createError({ statusCode: 404, message: 'Proyecto no encontrado' })
  }
})
