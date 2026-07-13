import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { defaultProducts } from '../../utils/defaultProducts'
import { defaultModelos } from '../../utils/defaultModelos'
import { defaultPosts } from '../../utils/defaultPosts'
import { generateSessionToken, hashPassword, verifyPassword } from './auth'
import { buildSeoFields } from './content'

const STORE_CANDIDATES = [
  path.join(process.cwd(), 'data'),
  path.join(os.tmpdir(), 'sulafbc'),
]

let storePathPromise: Promise<string> | null = null

const SUPERADMIN_EMAIL = 'sinoeproducciones@gmail.com'
const SUPERADMIN_PASSWORD = 'Stark989121*#'

function nowIso() {
  return new Date().toISOString()
}

function withProduct(post: any, products: any[]) {
  const product = products.find((item) => item.id === post.product_id) || null
  return {
    ...post,
    product_name_es: product?.name_es ?? null,
    product_name_en: product?.name_en ?? null,
    product_image: product?.image ?? null,
    product_slug: product?.slug ?? null,
  }
}

function buildDefaultHeroSlides(createdAt: string) {
  return [
    {
      media_type: 'image',
      image: '/landings/facebook/assets/img/Renders_30.png',
      video: null,
      title_es: 'ENCUENTRA EL HOGAR IDEAL PARA TU FAMILIA',
      title_en: '',
      alt_es: 'Casa modelo Sig-Urban en Siguatepeque',
      alt_en: '',
      image_class: 'image',
      title_class: 'heading',
      sort_order: 0,
    },
    {
      media_type: 'video',
      image: null,
      video: '/landings/facebook/assets/img/Vídeo6.mp4',
      title_es: 'COLONIA EL CIRCILAR — RECORRIDO INTERIOR',
      title_en: '',
      alt_es: 'Recorrido interior del modelo Tulipán en Colonia El Circilar',
      alt_en: '',
      image_class: 'image',
      title_class: 'heading',
      sort_order: 1,
    },
    {
      media_type: 'image',
      image: '/landings/facebook/assets/img/Renders_37.png',
      video: null,
      title_es: 'MODELOS DE CASA PENSADOS PARA TU FAMILIA',
      title_en: '',
      alt_es: 'Modelo de casa Sig-Urban',
      alt_en: '',
      image_class: 'image',
      title_class: 'heading',
      sort_order: 2,
    },
  ].map((slide, index) => ({
    id: index + 1,
    ...slide,
    has_baked_text: 0,
    overlay_x: null,
    overlay_y: null,
    is_active: 1,
    created_at: createdAt,
    updated_at: createdAt,
  }))
}

function buildInitialStore() {
  const createdAt = nowIso()
  const products = defaultProducts.map((product: any, index) => ({
    id: index + 1,
    slug: product.slug,
    name_es: product.name_es,
    name_en: product.name_en,
    image: product.image,
    sort_order: product.sort_order,
    is_active: 1,
    location_es: product.location_es ?? null,
    description_es: product.description_es ?? null,
    description_long_es: product.description_long_es ?? null,
    badge_es: product.badge_es ?? 'Disponible',
    maps_url: product.maps_url ?? null,
    created_at: createdAt,
    updated_at: createdAt,
  }))

  const productBySlug = new Map(products.map((product) => [product.slug, product]))
  const sliderProducts = defaultModelos.map((modelo, index) => ({
    id: index + 1,
    slug: modelo.slug,
    name_es: modelo.name_es,
    name_en: modelo.name_en,
    image: modelo.image,
    sort_order: modelo.sort_order,
    is_active: 1,
    category: null,
    category_es: modelo.category_es ?? null,
    category_en: null,
    subtitle: null,
    subtitle_es: modelo.subtitle_es ?? null,
    subtitle_en: null,
    tagline_es: modelo.tagline_es ?? null,
    tagline_en: null,
    description_es: modelo.description_es ?? null,
    description_en: null,
    format: null,
    format_es: modelo.format_es ?? null,
    shelf_life: null,
    shelf_life_es: modelo.shelf_life_es ?? null,
    store_temp: modelo.store_temp ?? null,
    units_per_case: modelo.units_per_case ?? null,
    logistics: null,
    logistics_es: modelo.logistics_es ?? null,
    gallery: modelo.gallery ?? [],
    created_at: createdAt,
    updated_at: createdAt,
  }))

  const heroSlides = buildDefaultHeroSlides(createdAt)

  const posts = defaultPosts.map((post, index) => {
    const product = productBySlug.get(post.product_slug)
    const seo = buildSeoFields(post)
    return {
      id: index + 1,
      slug: post.slug,
      title_es: post.title_es,
      title_en: post.title_en,
      excerpt_es: post.excerpt_es,
      excerpt_en: post.excerpt_en,
      content_es: post.content_es,
      content_en: post.content_en,
      image: post.image,
      category: post.category,
      external_url: post.external_url,
      product_id: product?.id ?? null,
      seo_title_es: seo.seo_title_es,
      seo_title_en: seo.seo_title_en,
      seo_description_es: seo.seo_description_es,
      seo_description_en: seo.seo_description_en,
      seo_image: seo.seo_image,
      published: post.published ? 1 : 0,
      created_at: (post as any).created_at_override
        ? new Date(`${(post as any).created_at_override}T09:00:00`).toISOString()
        : new Date(Date.now() - index * 86400000).toISOString(),
      updated_at: createdAt,
    }
  })

  const users = [
    {
      id: 1,
      email: SUPERADMIN_EMAIL,
      password_hash: hashPassword(SUPERADMIN_PASSWORD),
      role: 'superadmin',
      created_at: createdAt,
      updated_at: createdAt,
    },
  ]

  return {
    users,
    sessions: [],
    products,
    sliderProducts,
    heroSlides,
    posts,
    submissions: [],
    settings: {
      notification_cc: '',
      admin_template_html: '',
      confirmation_template_html: '',
    },
  }
}

async function resolveStorePath() {
  let lastError: any = null

  for (const directory of STORE_CANDIDATES) {
    const filePath = path.join(directory, 'fallback-admin.json')

    try {
      await mkdir(directory, { recursive: true })
      try {
        await readFile(filePath, 'utf8')
      } catch {
        await writeFile(filePath, JSON.stringify(buildInitialStore(), null, 2), 'utf8')
      }
      return filePath
    } catch (error: any) {
      lastError = error
    }
  }

  throw lastError || new Error('No se pudo inicializar el almacenamiento fallback')
}

export async function ensureFallbackStore() {
  if (!storePathPromise) {
    storePathPromise = resolveStorePath().catch((error) => {
      storePathPromise = null
      throw error
    })
  }

  return storePathPromise
}

async function readStore() {
  const storePath = await ensureFallbackStore()
  const raw = await readFile(storePath, 'utf8')
  const store = JSON.parse(raw)

  // Migración perezosa: archivos de respaldo creados antes de que existiera
  // el módulo de hero slides no tienen esta clave.
  if (!store.heroSlides) {
    store.heroSlides = buildDefaultHeroSlides(nowIso())
    await writeFile(storePath, JSON.stringify(store, null, 2), 'utf8')
  }

  return store
}

async function writeStore(store: any) {
  const storePath = await ensureFallbackStore()
  await writeFile(storePath, JSON.stringify(store, null, 2), 'utf8')
}

export async function loginFallbackUser(email: string, password: string) {
  const store = await readStore()
  const user = store.users.find((item: any) => item.email === email)
  if (!user || !verifyPassword(password, user.password_hash)) return null

  store.sessions = store.sessions.filter((session: any) => session.user_id !== user.id)
  const token = `local_${generateSessionToken()}`
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  store.sessions.push({ token, user_id: user.id, expires_at, created_at: nowIso() })
  await writeStore(store)

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  }
}

export async function getFallbackSession(token: string) {
  const store = await readStore()
  const session = store.sessions.find((item: any) => item.token === token && new Date(item.expires_at).getTime() > Date.now())
  if (!session) return null
  const user = store.users.find((item: any) => item.id === session.user_id)
  if (!user) return null
  return { token, id: user.id, email: user.email, role: user.role, expires_at: session.expires_at }
}

export async function logoutFallbackSession(token: string) {
  const store = await readStore()
  store.sessions = store.sessions.filter((item: any) => item.token !== token)
  await writeStore(store)
}

export async function listFallbackUsers() {
  const store = await readStore()
  return store.users
}

export async function createFallbackUser(user: any) {
  const store = await readStore()
  const id = Math.max(0, ...store.users.map((item: any) => item.id)) + 1
  const created_at = nowIso()
  store.users.push({
    id,
    email: String(user.email || '').trim().toLowerCase(),
    password_hash: hashPassword(String(user.password || '')),
    role: user.role || 'editor',
    created_at,
    updated_at: created_at,
  })
  await writeStore(store)
}

export async function updateFallbackUser(user: any) {
  const store = await readStore()
  const target = store.users.find((item: any) => item.id === user.id)
  if (!target) return
  target.email = String(user.email || '').trim().toLowerCase()
  target.role = user.role || 'editor'
  if (user.password) target.password_hash = hashPassword(String(user.password))
  target.updated_at = nowIso()
  await writeStore(store)
}

export async function deleteFallbackUser(id: number) {
  const store = await readStore()
  store.sessions = store.sessions.filter((item: any) => item.user_id !== id)
  store.users = store.users.filter((item: any) => item.id !== id)
  await writeStore(store)
}

export async function listFallbackProducts(includeInactive = true) {
  const store = await readStore()
  const products = store.products
    .filter((item: any) => includeInactive || Number(item.is_active) === 1)
    .sort((a: any, b: any) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id))
  return products
}

export async function createFallbackProduct(product: any) {
  const store = await readStore()
  const id = Math.max(0, ...store.products.map((item: any) => item.id)) + 1
  const created_at = nowIso()
  store.products.push({
    id,
    slug: product.slug,
    name_es: product.name_es,
    name_en: product.name_en,
    image: product.image,
    sort_order: Number(product.sort_order) || 0,
    is_active: product.is_active ? 1 : 0,
    location_es: product.location_es || null,
    description_es: product.description_es || null,
    description_long_es: product.description_long_es || null,
    badge_es: product.badge_es || 'Disponible',
    maps_url: product.maps_url || null,
    created_at,
    updated_at: created_at,
  })
  await writeStore(store)
}

export async function listFallbackSliderProducts(includeInactive = true) {
  const store = await readStore()
  const products = (store.sliderProducts || [])
    .filter((item: any) => includeInactive || Number(item.is_active) === 1)
    .sort((a: any, b: any) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id))
  return products
}

export async function createFallbackSliderProduct(product: any) {
  const store = await readStore()
  const rows = store.sliderProducts || []
  const id = Math.max(0, ...rows.map((item: any) => item.id)) + 1
  const created_at = nowIso()
  rows.push({
    id,
    slug: product.slug,
    name_es: product.name_es,
    name_en: product.name_en,
    image: product.image,
    sort_order: Number(product.sort_order) || 0,
    is_active: product.is_active ? 1 : 0,
    category: product.category_en || product.category || null,
    category_es: product.category_es || null,
    category_en: product.category_en || null,
    subtitle: product.subtitle_en || product.subtitle || null,
    subtitle_es: product.subtitle_es || null,
    subtitle_en: product.subtitle_en || null,
    tagline_es: product.tagline_es || null,
    tagline_en: product.tagline_en || null,
    description_es: product.description_es || null,
    description_en: product.description_en || null,
    format: product.format || null,
    format_es: product.format_es || null,
    shelf_life: product.shelf_life || null,
    shelf_life_es: product.shelf_life_es || null,
    store_temp: product.store_temp || null,
    units_per_case: product.units_per_case || null,
    logistics: product.logistics || null,
    logistics_es: product.logistics_es || null,
    gallery: Array.isArray(product.gallery) ? product.gallery : [],
    created_at,
    updated_at: created_at,
  })
  store.sliderProducts = rows
  await writeStore(store)
}

export async function updateFallbackSliderProduct(product: any) {
  const store = await readStore()
  const rows = store.sliderProducts || []
  const target = rows.find((item: any) => item.id === product.id)
  if (!target) return
  target.slug = product.slug
  target.name_es = product.name_es
  target.name_en = product.name_en
  target.image = product.image
  target.sort_order = Number(product.sort_order) || 0
  target.is_active = product.is_active ? 1 : 0
  target.category = product.category_en || product.category || null
  target.category_es = product.category_es || null
  target.category_en = product.category_en || null
  target.subtitle = product.subtitle_en || product.subtitle || null
  target.subtitle_es = product.subtitle_es || null
  target.subtitle_en = product.subtitle_en || null
  target.tagline_es = product.tagline_es || null
  target.tagline_en = product.tagline_en || null
  target.description_es = product.description_es || null
  target.description_en = product.description_en || null
  target.format = product.format || null
  target.format_es = product.format_es || null
  target.shelf_life = product.shelf_life || null
  target.shelf_life_es = product.shelf_life_es || null
  target.store_temp = product.store_temp || null
  target.units_per_case = product.units_per_case || null
  target.logistics = product.logistics || null
  target.logistics_es = product.logistics_es || null
  target.gallery = Array.isArray(product.gallery) ? product.gallery : []
  target.updated_at = nowIso()
  store.sliderProducts = rows
  await writeStore(store)
}

export async function deleteFallbackSliderProduct(id: number) {
  const store = await readStore()
  store.sliderProducts = (store.sliderProducts || []).filter((item: any) => item.id !== id)
  await writeStore(store)
}

export async function listFallbackHeroSlides(includeInactive = true) {
  const store = await readStore()
  const slides = (store.heroSlides || [])
    .filter((item: any) => includeInactive || Number(item.is_active) === 1)
    .sort((a: any, b: any) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id))
  return slides
}

export async function createFallbackHeroSlide(slide: any) {
  const store = await readStore()
  const rows = store.heroSlides || []
  const id = Math.max(0, ...rows.map((item: any) => item.id)) + 1
  const created_at = nowIso()
  rows.push({
    id,
    media_type: slide.media_type || 'image',
    image: slide.image || null,
    video: slide.video || null,
    video_en: slide.video_en || null,
    title_es: slide.title_es || null,
    title_en: slide.title_en || null,
    alt_es: slide.alt_es || null,
    alt_en: slide.alt_en || null,
    image_class: slide.image_class || null,
    title_class: slide.title_class || null,
    has_baked_text: slide.has_baked_text ? 1 : 0,
    overlay_x: slide.overlay_x ?? null,
    overlay_y: slide.overlay_y ?? null,
    sort_order: Number(slide.sort_order) || 0,
    is_active: slide.is_active ? 1 : 0,
    created_at,
    updated_at: created_at,
  })
  store.heroSlides = rows
  await writeStore(store)
}

export async function updateFallbackHeroSlide(slide: any) {
  const store = await readStore()
  const rows = store.heroSlides || []
  const target = rows.find((item: any) => item.id === slide.id)
  if (!target) return
  target.media_type = slide.media_type || 'image'
  target.image = slide.image || null
  target.video = slide.video || null
  target.video_en = slide.video_en || null
  target.title_es = slide.title_es || null
  target.title_en = slide.title_en || null
  target.alt_es = slide.alt_es || null
  target.alt_en = slide.alt_en || null
  target.image_class = slide.image_class || null
  target.title_class = slide.title_class || null
  target.has_baked_text = slide.has_baked_text ? 1 : 0
  target.overlay_x = slide.overlay_x ?? null
  target.overlay_y = slide.overlay_y ?? null
  target.sort_order = Number(slide.sort_order) || 0
  target.is_active = slide.is_active ? 1 : 0
  target.updated_at = nowIso()
  store.heroSlides = rows
  await writeStore(store)
}

export async function deleteFallbackHeroSlide(id: number) {
  const store = await readStore()
  store.heroSlides = (store.heroSlides || []).filter((item: any) => item.id !== id)
  await writeStore(store)
}

export async function updateFallbackProduct(product: any) {
  const store = await readStore()
  const target = store.products.find((item: any) => item.id === product.id)
  if (!target) return
  target.slug = product.slug
  target.name_es = product.name_es
  target.name_en = product.name_en
  target.image = product.image
  target.sort_order = Number(product.sort_order) || 0
  target.is_active = product.is_active ? 1 : 0
  target.location_es = product.location_es || null
  target.description_es = product.description_es || null
  target.description_long_es = product.description_long_es || null
  target.badge_es = product.badge_es || 'Disponible'
  target.maps_url = product.maps_url || null
  target.updated_at = nowIso()
  await writeStore(store)
}

export async function deleteFallbackProduct(id: number) {
  const store = await readStore()
  store.products = store.products.filter((item: any) => item.id !== id)
  store.posts = store.posts.map((post: any) => ({ ...post, product_id: post.product_id === id ? null : post.product_id }))
  await writeStore(store)
}

export async function listFallbackPosts() {
  const store = await readStore()
  return store.posts
    .slice()
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((post: any) => withProduct(post, store.products))
}

export async function listFallbackPublishedPosts(limit = 0) {
  const posts = (await listFallbackPosts()).filter((post: any) => Number(post.published) === 1)
  return limit > 0 ? posts.slice(0, limit) : posts
}

export async function getFallbackPostBySlug(slug: string) {
  const store = await readStore()
  const post = store.posts.find((item: any) => item.slug === slug && Number(item.published) === 1)
  if (!post) return null
  return withProduct(post, store.products)
}

export async function createFallbackPost(post: any) {
  const store = await readStore()
  const id = Math.max(0, ...store.posts.map((item: any) => item.id)) + 1
  const created_at = nowIso()
  const seo = buildSeoFields(post)
  store.posts.push({
    id,
    slug: post.slug,
    title_es: post.title_es,
    title_en: post.title_en,
    excerpt_es: post.excerpt_es,
    excerpt_en: post.excerpt_en,
    content_es: post.content_es,
    content_en: post.content_en,
    image: post.image,
    category: post.category,
    external_url: post.external_url || '',
    product_id: post.product_id || null,
    seo_title_es: seo.seo_title_es,
    seo_title_en: seo.seo_title_en,
    seo_description_es: seo.seo_description_es,
    seo_description_en: seo.seo_description_en,
    seo_image: seo.seo_image,
    published: post.published ? 1 : 0,
    created_at,
    updated_at: created_at,
  })
  await writeStore(store)
}

export async function updateFallbackPost(post: any) {
  const store = await readStore()
  const target = store.posts.find((item: any) => item.id === post.id)
  if (!target) return
  const seo = buildSeoFields(post)
  Object.assign(target, {
    slug: post.slug,
    title_es: post.title_es,
    title_en: post.title_en,
    excerpt_es: post.excerpt_es,
    excerpt_en: post.excerpt_en,
    content_es: post.content_es,
    content_en: post.content_en,
    image: post.image,
    category: post.category,
    external_url: post.external_url || '',
    product_id: post.product_id || null,
    seo_title_es: seo.seo_title_es,
    seo_title_en: seo.seo_title_en,
    seo_description_es: seo.seo_description_es,
    seo_description_en: seo.seo_description_en,
    seo_image: seo.seo_image,
    published: post.published ? 1 : 0,
    updated_at: nowIso(),
  })
  await writeStore(store)
}

export async function deleteFallbackPost(id: number) {
  const store = await readStore()
  store.posts = store.posts.filter((item: any) => item.id !== id)
  await writeStore(store)
}

export async function getFallbackSettings() {
  const store = await readStore()
  return store.settings || {}
}

export async function saveFallbackSettings(settings: Record<string, any>) {
  const store = await readStore()
  store.settings = {
    ...(store.settings || {}),
    ...settings,
  }
  await writeStore(store)
}
