import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { createError, readMultipartFormData } from 'h3'
import { requireAdminSession } from '../../utils/adminSession'
import { savePublicAsset } from '../../utils/publicAssets'

const MAX_OUTPUT_BYTES = 2 * 1024 * 1024
const MAX_INPUT_BYTES  = 4 * 1024 * 1024
const MAX_VIDEO_BYTES  = 120 * 1024 * 1024
const SKIP_COMPRESS    = new Set(['.svg', '.gif'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov'])

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function optimizeImage(buffer: Buffer, ext: string): Promise<{ data: Buffer, ext: string }> {
  if (SKIP_COMPRESS.has(ext) || buffer.length <= MAX_OUTPUT_BYTES) {
    return { data: buffer, ext }
  }

  let sharp: any
  try {
    sharp = (await import('sharp')).default
  } catch (e) {
    console.error('[upload] sharp no disponible, subiendo sin comprimir:', e)
    return { data: buffer, ext }
  }

  try {
    const inst = sharp(buffer)
    const meta = await inst.metadata()
    const base = meta.width && meta.width > 2000
      ? inst.resize(2000, null, { withoutEnlargement: true })
      : inst

    const isJpeg = ext === '.jpg' || ext === '.jpeg'
    const outExt = isJpeg ? ext : '.webp'

    for (const quality of [85, 75, 65, 55, 40]) {
      const out = isJpeg
        ? await base.clone().jpeg({ quality, mozjpeg: true }).toBuffer()
        : await base.clone().webp({ quality }).toBuffer()
      if (out.length <= MAX_OUTPUT_BYTES) return { data: out, ext: outExt }
    }

    const out = await sharp(buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 35 })
      .toBuffer()
    return { data: out, ext: '.webp' }
  } catch (e) {
    console.error('[upload] Error en compresión, subiendo original:', e)
    return { data: buffer, ext }
  }
}

export default defineEventHandler(async (event) => {
  await requireAdminSession(event, ['superadmin', 'editor'])

  let parts: Awaited<ReturnType<typeof readMultipartFormData>>
  try {
    parts = await readMultipartFormData(event)
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: `Error al leer el archivo: ${e?.message ?? e}` })
  }

  if (!parts?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Archivo no recibido' })
  }

  const filePart      = parts.find((p) => p.name === 'file' && p.filename)
  const targetDirPart = parts.find((p) => p.name === 'targetDir')

  if (!filePart?.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Archivo no válido' })
  }

  const rawBuffer = Buffer.from(filePart.data)
  const origExt = path.extname(filePart.filename).toLowerCase() || '.jpg'
  const isVideo = VIDEO_EXTENSIONS.has(origExt)

  if (isVideo) {
    if (rawBuffer.length > MAX_VIDEO_BYTES) {
      throw createError({
        statusCode: 413,
        statusMessage: `El video pesa ${(rawBuffer.length / 1024 / 1024).toFixed(1)} MB. El límite de carga es 120 MB.`,
      })
    }
  } else if (rawBuffer.length > MAX_INPUT_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: `La imagen pesa ${(rawBuffer.length / 1024 / 1024).toFixed(1)} MB. El límite de carga es 4 MB.`,
    })
  }

  const targetDir = typeof targetDirPart?.data === 'string'
    ? targetDirPart.data
    : targetDirPart?.data
      ? Buffer.from(targetDirPart.data).toString('utf8')
      : '/images'

  const safeDir = targetDir.startsWith('/images') || targetDir.startsWith('/uploads') ? targetDir : '/images'

  // Subcarpeta año/mes si no tiene ya un patrón de fecha
  const now   = new Date()
  const year  = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const hasDateFolder = /\/\d{4}\/\d{2}/.test(safeDir)
  const finalDir = hasDateFolder ? safeDir : `${safeDir}/${year}/${month}`

  const { data, ext } = isVideo
    ? { data: rawBuffer, ext: origExt }
    : await optimizeImage(rawBuffer, origExt)
  const baseName = slugify(path.basename(filePart.filename, origExt)) || (isVideo ? 'video' : 'imagen')
  const fileName = `${baseName}-${randomUUID().slice(0, 8)}${ext}`

  const uploaded = await savePublicAsset(finalDir, fileName, data)

  const originalKb   = Math.round(rawBuffer.length / 1024)
  const optimizedKb  = Math.round(data.length / 1024)
  const compressed   = data.length < rawBuffer.length

  return {
    ok:     true,
    path:   uploaded.path,
    url:    uploaded.url,
    source: uploaded.source,
    type:   isVideo ? 'video' : 'image',
    size:   { original: originalKb, optimized: optimizedKb, compressed },
  }
})
