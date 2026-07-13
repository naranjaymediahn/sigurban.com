import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { requireAdminSession } from '../utils/adminSession'

export default defineEventHandler(async (event) => {
  try {
    await ensureContentSchema()
    const session = await requireAdminSession(event, ['superadmin'])
    if (session.fallbackMode) return { ok: true, fallbackMode: true, data: [] }
    const rows = await query(
      'SELECT * FROM distribution ORDER BY created_at DESC LIMIT 500'
    )
    return { ok: true, data: rows }
  } catch (err: any) {
    return { ok: false, error: err.message, data: [] }
  }
})
