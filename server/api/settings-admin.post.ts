import { requireAdminSession } from '../utils/adminSession'
import { getSiteSettings, saveSiteSettings } from '../utils/siteSettings'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event, ['superadmin'])
  const body = await readBody(event)
  const { action, settings } = body || {}

  if (action === 'get') {
    return { ok: true, data: await getSiteSettings() }
  }

  if (action === 'save') {
    return await saveSiteSettings(settings || {})
  }

  return { ok: false, error: 'Unknown action' }
})
