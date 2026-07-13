import { getSiteSettings } from '../utils/siteSettings'

const CACHE_TTL = 60 * 60 * 1000 // 1 hora
let cache: { posts: any[]; at: number } | null = null

export default defineEventHandler(async () => {
  // Devolver caché si es reciente
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return { ok: true, posts: cache.posts, cached: true }
  }

  const settings = await getSiteSettings()
  const token = settings.instagram_token?.trim()

  if (!token) {
    return { ok: false, posts: [], reason: 'no_token' }
  }

  try {
    const url = new URL('https://graph.instagram.com/me/media')
    url.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp')
    url.searchParams.set('limit', '6')
    url.searchParams.set('access_token', token)

    const res = await $fetch<{ data: any[]; error?: any }>(url.toString())

    if (!res?.data) {
      return { ok: false, posts: [], reason: 'empty_response' }
    }

    // Filtrar solo IMAGE y CAROUSEL_ALBUM (ignorar solo-video sin thumbnail)
    const posts = res.data
      .filter((p) => p.media_type !== 'VIDEO' || p.thumbnail_url)
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        image: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
        caption: p.caption?.slice(0, 120) ?? '',
        permalink: p.permalink,
        timestamp: p.timestamp,
      }))

    cache = { posts, at: Date.now() }
    return { ok: true, posts }
  } catch (err: any) {
    const igError = err?.data?.error
    console.error('[instagram-feed] Error:', igError ?? err?.message)
    return {
      ok: false,
      posts: [],
      reason: igError?.message ?? 'fetch_error',
    }
  }
})
