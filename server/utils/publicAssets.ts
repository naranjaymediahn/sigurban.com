import { existsSync } from 'node:fs'
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createError } from 'h3'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif', '.bmp'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov'])

function resolvePublicRoot() {
  const candidates = [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), '.output', 'public'),
    path.join(process.cwd(), '..', 'public'),
  ]
  for (const candidate of candidates) {
    try { if (existsSync(candidate)) return candidate } catch {}
  }
  return candidates[0]
}

const PUBLIC_ROOT = resolvePublicRoot()

function normalizeDir(input = '/images') {
  const trimmed = String(input || '/images').trim()
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return normalized.replace(/\/+/g, '/')
}

function isImageFile(name = '') {
  return IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase())
}

function isVideoFile(name = '') {
  return VIDEO_EXTENSIONS.has(path.extname(name).toLowerCase())
}

function isMediaFile(name = '') {
  return isImageFile(name) || isVideoFile(name)
}

function buildParentDir(currentDir: string) {
  if (currentDir === '/') return null
  const parent = path.posix.dirname(currentDir)
  return parent === '.' ? '/' : parent
}

function getStorageConfig() {
  const config = useRuntimeConfig()
  const apiUrl  = String(config.STORAGE_API_URL  || process.env.STORAGE_API_URL  || '').trim()
  const apiKey  = String(config.STORAGE_API_KEY  || process.env.STORAGE_API_KEY  || '').trim()
  const baseUrl = String(config.STORAGE_BASE_URL || process.env.STORAGE_BASE_URL || '').trim()
  return { apiUrl, apiKey, baseUrl, enabled: Boolean(apiUrl && apiKey) }
}

function resolveLocalPath(input = '/images') {
  const normalized = normalizeDir(input)
  const absolute = path.resolve(PUBLIC_ROOT, `.${normalized}`)
  if (!absolute.startsWith(PUBLIC_ROOT)) {
    throw createError({ statusCode: 400, statusMessage: 'Ruta inválida' })
  }
  return { normalized, absolute }
}

export async function listPublicAssets(dir = '/images', mediaType: 'all' | 'image' | 'video' = 'all') {
  const normalized = normalizeDir(dir)
  const storage = getStorageConfig()
  const filterByType = (files: any[]) =>
    mediaType === 'all' ? files : files.filter((f: any) => (f.type || 'image') === mediaType)

  if (storage.enabled) {
    try {
      const url = `${storage.apiUrl}?action=list&dir=${encodeURIComponent(normalized)}`
      const res = await fetch(url, {
        headers: { 'X-Api-Key': storage.apiKey },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Record<string, any>
      if (Array.isArray(data.files)) {
        data.files = filterByType(data.files).map((f: any) => ({
          ...f,
          url: storage.baseUrl ? `${storage.baseUrl}${f.path}` : f.path,
        }))
      }
      return data
    } catch (err: any) {
      console.error('[assets] Storage API error:', err.message)
    }
  }

  // Fallback: sistema de archivos local
  const target = resolveLocalPath(normalized)
  try { await mkdir(target.absolute, { recursive: true }) } catch {}

  let entries: ReturnType<typeof readdir> extends Promise<infer T> ? T : never
  try {
    entries = await readdir(target.absolute, { withFileTypes: true }) as any
  } catch {
    return {
      currentDir: normalized,
      parentDir:  buildParentDir(normalized),
      directories: [],
      files: [],
      source: 'local-empty',
    }
  }

  const directories = (entries as any[])
    .filter((e: any) => e.isDirectory())
    .map((e: any) => ({
      name: e.name,
      path: `${target.normalized}/${e.name}`.replace(/\/+/g, '/'),
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name))

  const files: any[] = []
  for (const entry of (entries as any[]).filter((e: any) => e.isFile())) {
    if (!isMediaFile(entry.name)) continue
    if (mediaType !== 'all' && (isVideoFile(entry.name) ? 'video' : 'image') !== mediaType) continue
    const filePath = `${target.normalized}/${entry.name}`.replace(/\/+/g, '/')
    let fileStat: any = null
    try { fileStat = await stat(path.join(target.absolute, entry.name)) } catch {}
    files.push({
      name:      entry.name,
      path:      filePath,
      url:       filePath,
      type:      isVideoFile(entry.name) ? 'video' : 'image',
      size:      fileStat?.size ?? 0,
      updatedAt: fileStat?.mtime.toISOString() ?? null,
    })
  }
  files.sort((a, b) => a.name.localeCompare(b.name))

  return {
    currentDir:  target.normalized,
    parentDir:   buildParentDir(target.normalized),
    directories,
    files,
    source: 'local',
  }
}

export async function deletePublicAsset(dir: string, name: string) {
  const normalized = normalizeDir(dir)
  const storage = getStorageConfig()
  const safeName = path.basename(name)

  if (storage.enabled) {
    const url = `${storage.apiUrl}?action=delete&dir=${encodeURIComponent(normalized)}&name=${encodeURIComponent(safeName)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-Api-Key': storage.apiKey },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw createError({ statusCode: 502, statusMessage: 'Delete failed' })
    return
  }

  // Fallback local
  const target = resolveLocalPath(normalized)
  const filePath = path.join(target.absolute, safeName)
  if (!filePath.startsWith(target.absolute)) throw createError({ statusCode: 400 })
  try { await (await import('node:fs/promises')).unlink(filePath) } catch {}
}

export async function savePublicAsset(dir: string, fileName: string, data: Buffer) {
  const normalized = normalizeDir(dir)
  const storage = getStorageConfig()
  const publicPath = `${normalized}/${fileName}`.replace(/\/+/g, '/')

  if (storage.enabled) {
    const blob = new Blob([data])
    const form = new FormData()
    form.append('file', blob, fileName)

    const url = `${storage.apiUrl}?action=upload&dir=${encodeURIComponent(normalized)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-Api-Key': storage.apiKey },
      body: form,
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw createError({ statusCode: 502, statusMessage: `Upload failed: ${body}` })
    }
    const result = await res.json() as any
    const resultPath = result.path ?? publicPath
    return {
      path:   resultPath,
      url:    storage.baseUrl ? `${storage.baseUrl}${resultPath}` : resultPath,
      source: 'storage',
    }
  }

  // Fallback local
  const target = resolveLocalPath(normalized)
  await mkdir(target.absolute, { recursive: true })
  await writeFile(path.join(target.absolute, fileName), data)
  return { path: publicPath, url: publicPath, source: 'local' }
}
