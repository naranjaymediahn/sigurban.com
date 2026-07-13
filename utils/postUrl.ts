function slugifyCategory(category: string) {
  return String(category || 'general')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'general'
}

export function buildPostUrl(post: Record<string, any>, mode: string = 'date') {
  const slug = post?.slug || ''
  if (mode === 'category') {
    return `/blog/${slugifyCategory(post?.category)}/${slug}`
  }
  if (mode === 'simple') {
    return `/blog/${slug}`
  }
  // date (por defecto, igual que WordPress: /AAAA/MM/DD/slug/)
  const d = post?.created_at ? new Date(post.created_at) : new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `/${yyyy}/${mm}/${dd}/${slug}`
}
