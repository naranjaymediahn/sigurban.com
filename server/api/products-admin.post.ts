import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { requireAdminSession } from '../utils/adminSession'
import {
  createFallbackProduct,
  deleteFallbackProduct,
  listFallbackProducts,
  updateFallbackProduct,
} from '../utils/fallbackStore'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { action, product } = body

  try {
    await ensureContentSchema()
    const session = await requireAdminSession(event, ['superadmin'])

    if (session.fallbackMode) {
      if (action === 'list') return { ok: true, data: await listFallbackProducts(true), fallbackMode: true }
      if (action === 'create') {
        await createFallbackProduct({
          ...product,
          slug: product.slug || slugify(product.name_es || product.name_en || String(Date.now())),
        })
        return { ok: true, fallbackMode: true }
      }
      if (action === 'update') {
        await updateFallbackProduct({
          ...product,
          slug: product.slug || slugify(product.name_es || product.name_en || String(product.id)),
        })
        return { ok: true, fallbackMode: true }
      }
      if (action === 'delete') {
        await deleteFallbackProduct(product.id)
        return { ok: true, fallbackMode: true }
      }
    }

    if (action === 'list') {
      const rows = await query('SELECT * FROM products ORDER BY sort_order ASC, id ASC')
      return { ok: true, data: rows }
    }

    if (action === 'create') {
      const slug = product.slug || slugify(product.name_es || product.name_en || String(Date.now()))
      await query(
        `INSERT INTO products (slug, name_es, name_en, image, sort_order, is_active, location_es, description_es, description_long_es, badge_es, maps_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slug, product.name_es, product.name_en, product.image, Number(product.sort_order) || 0, product.is_active ? 1 : 0,
          product.location_es || null, product.description_es || null, product.description_long_es || null, product.badge_es || 'Disponible',
          product.maps_url || null,
        ]
      )
      return { ok: true }
    }

    if (action === 'update') {
      const slug = product.slug || slugify(product.name_es || product.name_en || String(product.id))
      await query(
        `UPDATE products
         SET slug = ?, name_es = ?, name_en = ?, image = ?, sort_order = ?, is_active = ?,
             location_es = ?, description_es = ?, description_long_es = ?, badge_es = ?, maps_url = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          slug, product.name_es, product.name_en, product.image, Number(product.sort_order) || 0, product.is_active ? 1 : 0,
          product.location_es || null, product.description_es || null, product.description_long_es || null, product.badge_es || 'Disponible',
          product.maps_url || null,
          product.id,
        ]
      )
      return { ok: true }
    }

    if (action === 'delete') {
      await query('UPDATE blog_posts SET product_id = NULL WHERE product_id = ?', [product.id])
      await query('DELETE FROM products WHERE id = ?', [product.id])
      return { ok: true }
    }

    return { ok: false, error: 'Unknown action' }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
})
