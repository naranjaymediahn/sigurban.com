import { query } from '../../utils/db'
import { requireAdminSession } from '../../utils/adminSession'
import { logoutFallbackSession } from '../../utils/fallbackStore'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireAdminSession(event)
    if (session.fallbackMode) {
      await logoutFallbackSession(session.token)
    } else {
      await query('DELETE FROM admin_sessions WHERE token = ?', [session.token])
    }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
})
