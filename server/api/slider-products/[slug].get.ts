import { query } from '../../utils/db'
import { ensureContentSchema } from '../../utils/contentSchema'
import { listFallbackSliderProducts } from '../../utils/fallbackStore'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  try {
    await ensureContentSchema()
    const rows = await query<any>(
      `SELECT id, slug, name_es, name_en, image, sort_order, is_active, is_available,
              category_es, subtitle_es, tagline_es, description_es,
              format_es, shelf_life_es, store_temp, units_per_case, logistics_es, gallery_json, videos_json
       FROM slider_products WHERE slug = ? AND is_active = 1 LIMIT 1`,
      [slug]
    )
    if (!rows.length) return createError({ statusCode: 404, message: 'Modelo no encontrado' })
    let gallery: string[] = []
    try { gallery = rows[0].gallery_json ? JSON.parse(rows[0].gallery_json) : [] } catch { gallery = [] }
    let videos: { title: string, description: string, youtubeId: string }[] = []
    try { videos = rows[0].videos_json ? JSON.parse(rows[0].videos_json) : [] } catch { videos = [] }
    return { ok: true, data: { ...rows[0], gallery, videos } }
  } catch (err: any) {
    const modelos = await listFallbackSliderProducts(false)
    const found = modelos.find((m: any) => m.slug === slug)
    if (found) return { ok: true, fallback: true, data: { ...found, gallery: found.gallery || [], videos: found.videos || [] } }
    return createError({ statusCode: 404, message: 'Modelo no encontrado' })
  }
})
