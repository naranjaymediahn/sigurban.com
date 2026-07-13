import { query } from './db'
import { getFallbackSession } from './fallbackStore'

export async function requireAdminSession(event: any, allowedRoles: string[] = []) {
  const token = getHeader(event, 'x-admin-token')
  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (token.startsWith('local_')) {
    const fallbackSession = await getFallbackSession(token)
    if (!fallbackSession) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
    if (allowedRoles.length && !allowedRoles.includes(fallbackSession.role)) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
    return { ...fallbackSession, fallbackMode: true }
  }

  const rows = await query<any>(
    `SELECT s.token, s.expires_at, u.id, u.email, u.role
     FROM admin_sessions s
     INNER JOIN admin_users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [token]
  )

  const session = rows[0]
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (allowedRoles.length && !allowedRoles.includes(session.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  return session
}
