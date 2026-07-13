function stripHtml(html = '') {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractFirstParagraph(html = '') {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  return stripHtml(match?.[1] ?? html)
}

function truncate(text = '', max = 160) {
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '').trim() + '...'
}

export function buildSeoFields(post: Record<string, any>) {
  const descriptionEs = truncate(
    post.excerpt_es?.trim() || extractFirstParagraph(post.content_es) || post.title_es || '',
    160
  )
  const descriptionEn = truncate(
    post.excerpt_en?.trim() || extractFirstParagraph(post.content_en) || post.title_en || post.title_es || '',
    160
  )

  return {
    seo_title_es: post.title_es?.trim() || post.title_en?.trim() || 'SULAFBC',
    seo_title_en: post.title_en?.trim() || post.title_es?.trim() || 'SULAFBC',
    seo_description_es: descriptionEs,
    seo_description_en: descriptionEn,
    seo_image: post.image?.trim() || '',
  }
}
