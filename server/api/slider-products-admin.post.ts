import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { requireAdminSession } from '../utils/adminSession'
import {
  createFallbackSliderProduct,
  deleteFallbackSliderProduct,
  listFallbackSliderProducts,
  updateFallbackSliderProduct,
} from '../utils/fallbackStore'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { action, product } = body

  await requireAdminSession(event, ['superadmin'])

  // El fallback es por-solicitud, no pegado a la sesión: aunque el login haya
  // ocurrido durante una caída de MySQL, cada acción reintenta la BD real primero.
  try {
    await ensureContentSchema()

    if (action === 'list') {
      const rows = await query<any>('SELECT * FROM slider_products ORDER BY sort_order ASC, id ASC')
      const data = rows.map((row) => {
        let gallery: string[] = []
        try { gallery = row.gallery_json ? JSON.parse(row.gallery_json) : [] } catch { gallery = [] }
        let videos: any[] = []
        try { videos = row.videos_json ? JSON.parse(row.videos_json) : [] } catch { videos = [] }
        return { ...row, gallery, videos }
      })
      return { ok: true, data }
    }

    if (action === 'create') {
      const slug = product.slug || slugify(product.name_es || product.name_en || String(Date.now()))
      const galleryJson = Array.isArray(product.gallery) && product.gallery.length ? JSON.stringify(product.gallery) : null
      const videosJson = Array.isArray(product.videos) && product.videos.length ? JSON.stringify(product.videos) : null
      await query(
        `INSERT INTO slider_products (slug, name_es, name_en, image, sort_order, is_active,
          category, category_es, category_en, subtitle, subtitle_es, subtitle_en,
          tagline_es, tagline_en, description_es, description_en,
          format, format_es, shelf_life, shelf_life_es, store_temp, units_per_case, logistics, logistics_es, gallery_json, videos_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slug, product.name_es, product.name_en, product.image,
          Number(product.sort_order) || 0, product.is_active ? 1 : 0,
          product.category_en || null,
          product.category_es || null, product.category_en || null,
          product.subtitle_en || null,
          product.subtitle_es || null, product.subtitle_en || null,
          product.tagline_es || null, product.tagline_en || null,
          product.description_es || null, product.description_en || null,
          product.format || null, product.format_es || null,
          product.shelf_life || null, product.shelf_life_es || null,
          product.store_temp || null, product.units_per_case || null,
          product.logistics || null, product.logistics_es || null,
          galleryJson, videosJson,
        ]
      )
      return { ok: true }
    }

    if (action === 'update') {
      const slug = product.slug || slugify(product.name_es || product.name_en || String(product.id))
      const galleryJson = Array.isArray(product.gallery) && product.gallery.length ? JSON.stringify(product.gallery) : null
      const videosJson = Array.isArray(product.videos) && product.videos.length ? JSON.stringify(product.videos) : null
      await query(
        `UPDATE slider_products
         SET slug = ?, name_es = ?, name_en = ?, image = ?, sort_order = ?, is_active = ?,
             category = ?, category_es = ?, category_en = ?,
             subtitle = ?, subtitle_es = ?, subtitle_en = ?,
             tagline_es = ?, tagline_en = ?,
             description_es = ?, description_en = ?,
             format = ?, format_es = ?,
             shelf_life = ?, shelf_life_es = ?,
             store_temp = ?, units_per_case = ?,
             logistics = ?, logistics_es = ?,
             gallery_json = ?,
             videos_json = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          slug, product.name_es, product.name_en, product.image,
          Number(product.sort_order) || 0, product.is_active ? 1 : 0,
          product.category_en || null,
          product.category_es || null, product.category_en || null,
          product.subtitle_en || null,
          product.subtitle_es || null, product.subtitle_en || null,
          product.tagline_es || null, product.tagline_en || null,
          product.description_es || null, product.description_en || null,
          product.format || null, product.format_es || null,
          product.shelf_life || null, product.shelf_life_es || null,
          product.store_temp || null, product.units_per_case || null,
          product.logistics || null, product.logistics_es || null,
          galleryJson, videosJson,
          product.id,
        ]
      )
      return { ok: true }
    }

    if (action === 'delete') {
      await query('DELETE FROM slider_products WHERE id = ?', [product.id])
      return { ok: true }
    }

    return { ok: false, error: 'Unknown action' }
  } catch (dbErr: any) {
    try {
      if (action === 'list') return { ok: true, data: await listFallbackSliderProducts(true), fallbackMode: true, warning: dbErr.message }
      if (action === 'create') {
        await createFallbackSliderProduct({
          ...product,
          slug: product.slug || slugify(product.name_es || product.name_en || String(Date.now())),
        })
        return { ok: true, fallbackMode: true }
      }
      if (action === 'update') {
        await updateFallbackSliderProduct({
          ...product,
          slug: product.slug || slugify(product.name_es || product.name_en || String(product.id)),
        })
        return { ok: true, fallbackMode: true }
      }
      if (action === 'delete') {
        await deleteFallbackSliderProduct(product.id)
        return { ok: true, fallbackMode: true }
      }
      return { ok: false, error: 'Unknown action' }
    } catch (fallbackErr: any) {
      return { ok: false, error: fallbackErr.message || dbErr.message }
    }
  }
})
