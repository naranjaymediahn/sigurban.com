import { readBody, createError } from 'h3'
import { query } from '../../utils/db'
import { requireAdminSession } from '../../utils/adminSession'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event, ['superadmin'])
  const { ids } = await readBody(event)
  if (!Array.isArray(ids) || !ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'ids requerido' })
  }
  const safeIds = ids.map(Number).filter((n) => n > 0)
  if (!safeIds.length) throw createError({ statusCode: 400, statusMessage: 'ids inválidos' })
  const placeholders = safeIds.map(() => '?').join(',')
  const result = await query(`DELETE FROM distribution WHERE id IN (${placeholders})`, safeIds)
  return { ok: true, deleted: (result as any).affectedRows ?? safeIds.length }
})
