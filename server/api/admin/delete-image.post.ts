import { readBody } from 'h3'
import { requireAdminSession } from '../../utils/adminSession'
import { deletePublicAsset } from '../../utils/publicAssets'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event, ['superadmin', 'editor'])
  const { dir, name } = await readBody(event)
  if (!dir || !name) {
    throw createError({ statusCode: 400, statusMessage: 'dir y name son requeridos' })
  }
  await deletePublicAsset(dir, name)
  return { ok: true }
})
