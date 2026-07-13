import { query } from '../../utils/db'
import { hashPassword } from '../../utils/auth'
import { requireAdminSession } from '../../utils/adminSession'
import { ensureContentSchema } from '../../utils/contentSchema'
import { createFallbackUser, deleteFallbackUser, listFallbackUsers, updateFallbackUser } from '../../utils/fallbackStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { action, user } = body

  try {
    await ensureContentSchema()
    const session = await requireAdminSession(event, ['superadmin'])

    if (session.fallbackMode) {
      if (action === 'list') return { ok: true, data: await listFallbackUsers(), fallbackMode: true }
      if (action === 'create') {
        await createFallbackUser(user)
        return { ok: true, fallbackMode: true }
      }
      if (action === 'update') {
        await updateFallbackUser(user)
        return { ok: true, fallbackMode: true }
      }
      if (action === 'delete') {
        await deleteFallbackUser(user.id)
        return { ok: true, fallbackMode: true }
      }
    }

    if (action === 'list') {
      const rows = await query(
        'SELECT id, email, role, created_at, updated_at FROM admin_users ORDER BY created_at ASC'
      )
      return { ok: true, data: rows }
    }

    if (action === 'create') {
      await query(
        `INSERT INTO admin_users (email, password_hash, role)
         VALUES (?, ?, ?)`,
        [String(user.email || '').trim().toLowerCase(), hashPassword(String(user.password || '')), user.role || 'editor']
      )
      return { ok: true }
    }

    if (action === 'update') {
      if (user.password) {
        await query(
          `UPDATE admin_users
           SET email = ?, role = ?, password_hash = ?, updated_at = NOW()
           WHERE id = ?`,
          [String(user.email || '').trim().toLowerCase(), user.role || 'editor', hashPassword(String(user.password)), user.id]
        )
      } else {
        await query(
          `UPDATE admin_users
           SET email = ?, role = ?, updated_at = NOW()
           WHERE id = ?`,
          [String(user.email || '').trim().toLowerCase(), user.role || 'editor', user.id]
        )
      }
      return { ok: true }
    }

    if (action === 'delete') {
      await query('DELETE FROM admin_sessions WHERE user_id = ?', [user.id])
      await query('DELETE FROM admin_users WHERE id = ?', [user.id])
      return { ok: true }
    }

    return { ok: false, error: 'Unknown action' }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
})
