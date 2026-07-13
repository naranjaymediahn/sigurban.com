import { query } from '../utils/db'
import { buildSeoFields } from '../utils/content'
import { ensureContentSchema } from '../utils/contentSchema'
import { requireAdminSession } from '../utils/adminSession'
import {
  createFallbackPost,
  deleteFallbackPost,
  listFallbackPosts,
  updateFallbackPost,
} from '../utils/fallbackStore'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { action, post } = body

  try {
    await ensureContentSchema()
    const session = await requireAdminSession(event, ['superadmin', 'editor'])

    if (session.fallbackMode) {
      if (action === 'create') {
        await createFallbackPost({ ...post, slug: post.slug || slugify(post.title_es || post.title_en || String(Date.now())) })
        return { ok: true, fallbackMode: true }
      }
      if (action === 'update') {
        await updateFallbackPost({ ...post, slug: post.slug || slugify(post.title_es || post.title_en || String(post.id)) })
        return { ok: true, fallbackMode: true }
      }
      if (action === 'delete') {
        await deleteFallbackPost(post.id)
        return { ok: true, fallbackMode: true }
      }
      if (action === 'list') {
        return { ok: true, data: await listFallbackPosts(), fallbackMode: true }
      }
    }

    if (action === 'create') {
      const slug = post.slug || slugify(post.title_es || post.title_en || String(Date.now()))
      const seo = buildSeoFields(post)
      await query(
        `INSERT INTO blog_posts (
          slug, title_es, title_en, excerpt_es, excerpt_en, content_es, content_en,
          image, category, external_url, product_id, seo_title_es, seo_title_en, seo_description_es, seo_description_en, seo_image, published
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [slug, post.title_es, post.title_en, post.excerpt_es, post.excerpt_en,
         post.content_es, post.content_en, post.image, post.category, post.external_url || '', post.product_id || null,
         seo.seo_title_es, seo.seo_title_en, seo.seo_description_es, seo.seo_description_en, seo.seo_image, post.published ? 1 : 0]
      )
      return { ok: true }
    }

    if (action === 'update') {
      const seo = buildSeoFields(post)
      await query(
        `UPDATE blog_posts SET slug=?, title_es=?, title_en=?, excerpt_es=?, excerpt_en=?,
         content_es=?, content_en=?, image=?, category=?, external_url=?, product_id=?, seo_title_es=?, seo_title_en=?,
         seo_description_es=?, seo_description_en=?, seo_image=?, published=?, updated_at=NOW()
         WHERE id=?`,
        [post.slug || slugify(post.title_es || post.title_en || String(post.id)), post.title_es, post.title_en, post.excerpt_es, post.excerpt_en,
         post.content_es, post.content_en, post.image, post.category, post.external_url || '', post.product_id || null, seo.seo_title_es, seo.seo_title_en,
         seo.seo_description_es, seo.seo_description_en, seo.seo_image, post.published ? 1 : 0, post.id]
      )
      return { ok: true }
    }

    if (action === 'delete') {
      await query('DELETE FROM blog_posts WHERE id = ?', [post.id])
      return { ok: true }
    }

    if (action === 'list') {
      const rows = await query(`
        SELECT bp.*, p.name_es AS product_name_es, p.name_en AS product_name_en, p.image AS product_image
        FROM blog_posts bp
        LEFT JOIN products p ON p.id = bp.product_id
        ORDER BY bp.created_at DESC
      `)
      return { ok: true, data: rows }
    }

    return { ok: false, error: 'Unknown action' }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
})
