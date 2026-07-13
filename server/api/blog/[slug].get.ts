import { query } from '../../utils/db'
import { ensureContentSchema } from '../../utils/contentSchema'
import { defaultPosts } from '../../../utils/defaultPosts'
import { defaultProducts } from '../../../utils/defaultProducts'
import { buildSeoFields } from '../../utils/content'

function buildFallbackPost(slug: string) {
  const post = defaultPosts.find((item) => item.slug === slug)
  if (!post) return null

  const product = defaultProducts.find((item) => item.slug === post.product_slug)
  const seo = buildSeoFields(post)

  return {
    id: defaultPosts.findIndex((item) => item.slug === slug) + 1,
    ...post,
    product_id: product ? defaultProducts.findIndex((item) => item.slug === post.product_slug) + 1 : null,
    product_name_es: product?.name_es ?? null,
    product_name_en: product?.name_en ?? null,
    product_image: product?.image ?? null,
    product_slug: product?.slug ?? null,
    seo_title_es: seo.seo_title_es,
    seo_title_en: seo.seo_title_en,
    seo_description_es: seo.seo_description_es,
    seo_description_en: seo.seo_description_en,
    seo_image: seo.seo_image,
    created_at: (post as any).created_at_override
      ? new Date(`${(post as any).created_at_override}T09:00:00`).toISOString()
      : new Date().toISOString(),
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  try {
    await ensureContentSchema()
    const rows = await query(
      `SELECT
        bp.*, p.name_es AS product_name_es, p.name_en AS product_name_en, p.image AS product_image, p.slug AS product_slug
       FROM blog_posts bp
       LEFT JOIN products p ON p.id = bp.product_id
       WHERE bp.slug = ? AND bp.published = 1
       LIMIT 1`,
      [slug]
    )
    if (!rows.length) return createError({ statusCode: 404, message: 'Post not found' })
    return { ok: true, data: rows[0] }
  } catch (err: any) {
    const fallbackPost = buildFallbackPost(String(slug || ''))
    if (fallbackPost) return { ok: true, fallback: true, error: err.message, data: fallbackPost }
    return { ok: false, error: err.message }
  }
})
