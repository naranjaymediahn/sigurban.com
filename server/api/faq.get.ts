import { query } from '../utils/db'
import { ensureContentSchema } from '../utils/contentSchema'
import { defaultFaqs } from '../../utils/defaultFaqs'

export default defineEventHandler(async () => {
  try {
    await ensureContentSchema()
    const rows = await query(
      `SELECT id, q, a, sort_order FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`
    )
    return { ok: true, data: rows }
  } catch (err: any) {
    return {
      ok: true,
      fallback: true,
      error: err.message,
      data: defaultFaqs.map((f, i) => ({ id: i + 1, ...f })),
    }
  }
})
