import { getQuery } from 'h3'
import { requireAdminSession } from '../../utils/adminSession'
import { listPublicAssets } from '../../utils/publicAssets'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminSession(event, ['superadmin', 'editor'])
    const query = getQuery(event)
    const dir = typeof query.dir === 'string' ? query.dir : '/images'
    const mediaType = query.type === 'video' || query.type === 'image' ? query.type : 'all'
    const result = await listPublicAssets(dir, mediaType).catch(() => null)
    if (!result) {
      return {
        ok: true,
        currentDir: dir,
        parentDir: dir !== '/images' ? '/images' : null,
        directories: [],
        files: [],
        source: 'unavailable',
      }
    }
    return { ok: true, ...result }
  } catch (err: any) {
    return {
      ok: false,
      error: err.message,
      currentDir: '/images',
      parentDir: null,
      directories: [],
      files: [],
      source: 'error',
    }
  }
})
