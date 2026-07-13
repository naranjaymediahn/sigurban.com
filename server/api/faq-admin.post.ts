import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { requireAdminSession } from '../utils/adminSession'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { action, faq } = body

  await requireAdminSession(event, ['superadmin'])

  try {
    await ensureContentSchema()

    if (action === 'list') {
      const rows = await query('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC')
      return { ok: true, data: rows }
    }

    if (action === 'create') {
      await query(
        `INSERT INTO faqs (q, a, sort_order, is_active) VALUES (?, ?, ?, ?)`,
        [faq.q, faq.a, Number(faq.sort_order) || 0, faq.is_active ? 1 : 0]
      )
      return { ok: true }
    }

    if (action === 'update') {
      await query(
        `UPDATE faqs SET q = ?, a = ?, sort_order = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
        [faq.q, faq.a, Number(faq.sort_order) || 0, faq.is_active ? 1 : 0, faq.id]
      )
      return { ok: true }
    }

    if (action === 'delete') {
      await query('DELETE FROM faqs WHERE id = ?', [faq.id])
      return { ok: true }
    }

    return { ok: false, error: 'Unknown action' }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
})
