import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { requireAdminSession } from '../utils/adminSession'
import {
  createFallbackHeroSlide,
  deleteFallbackHeroSlide,
  listFallbackHeroSlides,
  updateFallbackHeroSlide,
} from '../utils/fallbackStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { action, slide, order } = body

  const session = await requireAdminSession(event, ['superadmin']).catch((err) => { throw err })

  // El fallback es por-solicitud, no pegado a la sesión: aunque el login haya
  // ocurrido durante una caída de MySQL, cada acción reintenta la BD real primero.
  try {
    await ensureContentSchema()

    if (action === 'list') {
      const rows = await query('SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC')
      return { ok: true, data: rows }
    }

    if (action === 'create') {
      await query(
        `INSERT INTO hero_slides (media_type, image, video, video_en, title_es, title_en, alt_es, alt_en,
          image_class, title_class, has_baked_text, overlay_x, overlay_y, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slide.media_type || 'image', slide.image || null, slide.video || null, slide.video_en || null,
          slide.title_es || null, slide.title_en || null, slide.alt_es || null, slide.alt_en || null,
          slide.image_class || null, slide.title_class || null, slide.has_baked_text ? 1 : 0,
          slide.overlay_x ?? null, slide.overlay_y ?? null,
          Number(slide.sort_order) || 0, slide.is_active ? 1 : 0,
        ]
      )
      return { ok: true }
    }

    if (action === 'update') {
      await query(
        `UPDATE hero_slides
         SET media_type = ?, image = ?, video = ?, video_en = ?, title_es = ?, title_en = ?, alt_es = ?, alt_en = ?,
             image_class = ?, title_class = ?, has_baked_text = ?, overlay_x = ?, overlay_y = ?,
             sort_order = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          slide.media_type || 'image', slide.image || null, slide.video || null, slide.video_en || null,
          slide.title_es || null, slide.title_en || null, slide.alt_es || null, slide.alt_en || null,
          slide.image_class || null, slide.title_class || null, slide.has_baked_text ? 1 : 0,
          slide.overlay_x ?? null, slide.overlay_y ?? null,
          Number(slide.sort_order) || 0, slide.is_active ? 1 : 0,
          slide.id,
        ]
      )
      return { ok: true }
    }

    if (action === 'delete') {
      await query('DELETE FROM hero_slides WHERE id = ?', [slide.id])
      return { ok: true }
    }

    if (action === 'reorder') {
      for (const [index, id] of (order || []).entries()) {
        await query('UPDATE hero_slides SET sort_order = ? WHERE id = ?', [index, id])
      }
      return { ok: true }
    }

    return { ok: false, error: 'Unknown action' }
  } catch (dbErr: any) {
    try {
      if (action === 'list') return { ok: true, data: await listFallbackHeroSlides(true), fallbackMode: true, warning: dbErr.message }
      if (action === 'create') {
        await createFallbackHeroSlide(slide)
        return { ok: true, fallbackMode: true }
      }
      if (action === 'update') {
        await updateFallbackHeroSlide(slide)
        return { ok: true, fallbackMode: true }
      }
      if (action === 'delete') {
        await deleteFallbackHeroSlide(slide.id)
        return { ok: true, fallbackMode: true }
      }
      return { ok: false, error: 'Unknown action' }
    } catch (fallbackErr: any) {
      return { ok: false, error: fallbackErr.message || dbErr.message }
    }
  }
})
