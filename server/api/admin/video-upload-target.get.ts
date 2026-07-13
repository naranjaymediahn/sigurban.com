import { requireAdminSession } from '../../utils/adminSession'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event, ['superadmin', 'editor'])

  const config  = useRuntimeConfig()
  const apiUrl  = String(config.STORAGE_API_URL  || '').trim()
  const apiKey  = String(config.STORAGE_API_KEY  || '').trim()
  const baseUrl = String(config.STORAGE_BASE_URL || '').trim()

  return {
    ok: true,
    enabled: Boolean(apiUrl && apiKey),
    url: apiUrl,
    key: apiKey,
    baseUrl,
  }
})
