import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { defaultPosts } from '../../utils/defaultPosts'
import { defaultProducts } from '../../utils/defaultProducts'
import { buildSeoFields } from '../utils/content'

function buildFallbackRows(limit = 0) {
  const productBySlug = new Map(defaultProducts.map((product, index) => [
    product.slug,
    { ...product, id: index + 1 },
  ]))

  const rows = defaultPosts.map((post, index) => {
    const product = productBySlug.get(post.product_slug)
    const seo = buildSeoFields(post)
    return {
      id: index + 1,
      slug: post.slug,
      title_es: post.title_es,
      title_en: post.title_en,
      excerpt_es: post.excerpt_es,
      excerpt_en: post.excerpt_en,
      content_es: post.content_es,
      content_en: post.content_en,
      image: post.image,
      category: post.category,
      external_url: post.external_url,
      product_id: product?.id ?? null,
      seo_title_es: seo.seo_title_es,
      seo_title_en: seo.seo_title_en,
      seo_description_es: seo.seo_description_es,
      seo_description_en: seo.seo_description_en,
      seo_image: seo.seo_image,
      created_at: (post as any).created_at_override
        ? new Date(`${(post as any).created_at_override}T09:00:00`).toISOString()
        : new Date(Date.now() - index * 86400000).toISOString(),
      product_name_es: product?.name_es ?? null,
      product_name_en: product?.name_en ?? null,
      product_image: product?.image ?? null,
      product_slug: product?.slug ?? null,
    }
  })

  return limit > 0 ? rows.slice(0, Math.min(limit, 12)) : rows
}

export default defineEventHandler(async (event) => {
  const limit = Number(getQuery(event).limit || 0)
  try {
    await ensureContentSchema()
    const rows = await query(
      `SELECT
        bp.id, bp.slug, bp.title_es, bp.title_en, bp.excerpt_es, bp.excerpt_en,
        bp.content_es, bp.content_en, bp.image, bp.category, bp.external_url, bp.product_id,
        bp.seo_title_es, bp.seo_title_en, bp.seo_description_es, bp.seo_description_en, bp.seo_image, bp.created_at,
        p.name_es AS product_name_es, p.name_en AS product_name_en, p.image AS product_image, p.slug AS product_slug
       FROM blog_posts bp
       LEFT JOIN products p ON p.id = bp.product_id
       WHERE bp.published = 1
       ORDER BY bp.created_at DESC
       ${limit > 0 ? `LIMIT ${Math.min(limit, 12)}` : ''}`
    )
    return { ok: true, data: rows }
  } catch (err: any) {
    return { ok: true, fallback: true, error: err.message, data: buildFallbackRows(limit) }
  }
})
