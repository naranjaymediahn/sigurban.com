import { query } from '../../utils/db'
import { ensureContentSchema } from '../../utils/contentSchema'
import { generateSessionToken, verifyPassword } from '../../utils/auth'
import { loginFallbackUser } from '../../utils/fallbackStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!email || !password) {
    return { ok: false, error: 'Credenciales incompletas' }
  }

  let dbError = ''

  try {
    await ensureContentSchema()

    const rows = await query<any>(
      'SELECT id, email, password_hash, role FROM admin_users WHERE email = ? LIMIT 1',
      [email]
    )

    const user = rows[0]
    if (!user || !verifyPassword(password, user.password_hash)) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' }
    }

    const token = generateSessionToken()
    await query('DELETE FROM admin_sessions WHERE user_id = ?', [user.id])
    await query(
      `INSERT INTO admin_sessions (token, user_id, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [token, user.id]
    )

    return {
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  } catch (err: any) {
    dbError = err.message
    console.error('[admin/login] MySQL login fallback activado:', err.message)
  }

  try {
    const fallbackAuth = await loginFallbackUser(email, password)
    if (fallbackAuth) {
      return {
        ok: true,
        token: fallbackAuth.token,
        user: fallbackAuth.user,
        fallbackMode: true,
        warning: dbError || 'Base de datos remota no disponible. Usando almacenamiento local temporal.',
      }
    }
  } catch (fallbackError: any) {
    console.error('[admin/login] Error en almacenamiento fallback:', fallbackError.message)
    return { ok: false, error: dbError || fallbackError.message || 'No se pudo iniciar sesión' }
  }

  return { ok: false, error: dbError || 'Usuario o contraseña incorrectos' }
})
