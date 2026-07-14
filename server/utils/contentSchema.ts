import { query } from './db'
import { defaultProducts } from '../../utils/defaultProducts'
import { defaultModelos } from '../../utils/defaultModelos'
import { defaultPosts } from '../../utils/defaultPosts'
import { defaultFaqs } from '../../utils/defaultFaqs'
import { buildSeoFields } from './content'
import { hashPassword } from './auth'

let schemaPromise: Promise<void> | null = null

const SUPERADMIN_EMAIL = 'sinoeproducciones@gmail.com'
const SUPERADMIN_PASSWORD = 'Stark989121*#'

async function hasColumn(table: string, column: string) {
  const rows = await query<{ Field: string }>(`SHOW COLUMNS FROM ${table}`)
  return rows.some((row) => row.Field === column)
}

async function ensureProductsSeed() {
  const rows = await query<{ total: number }>('SELECT COUNT(*) AS total FROM products')
  if ((rows[0]?.total ?? 0) > 0) return

  for (const product of defaultProducts) {
    await query(
      `INSERT INTO products (slug, name_es, name_en, image, sort_order, is_active, location_es, description_es, description_long_es, badge_es, maps_url)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
      [
        product.slug, product.name_es, product.name_en, product.image, product.sort_order,
        (product as any).location_es ?? null,
        (product as any).description_es ?? null,
        (product as any).description_long_es ?? null,
        (product as any).badge_es ?? 'Disponible',
        (product as any).maps_url ?? null,
      ]
    )
  }
}

async function ensureSliderProductsSeed() {
  const rows = await query<{ total: number }>('SELECT COUNT(*) AS total FROM slider_products')
  if ((rows[0]?.total ?? 0) > 0) return

  for (const modelo of defaultModelos) {
    await query(
      `INSERT INTO slider_products (slug, name_es, name_en, image, sort_order, is_active,
        category, category_es, category_en, subtitle, subtitle_es, subtitle_en,
        tagline_es, tagline_en, description_es, description_en,
        format, format_es, shelf_life, shelf_life_es, store_temp, units_per_case, logistics, logistics_es, gallery_json)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        modelo.slug, modelo.name_es, modelo.name_en, modelo.image, modelo.sort_order,
        null,
        modelo.category_es ?? null, null,
        null,
        modelo.subtitle_es ?? null, null,
        modelo.tagline_es ?? null, null,
        modelo.description_es ?? null, null,
        null, modelo.format_es ?? null,
        null, modelo.shelf_life_es ?? null,
        modelo.store_temp ?? null, modelo.units_per_case ?? null,
        null, modelo.logistics_es ?? null,
        (modelo as any).gallery?.length ? JSON.stringify((modelo as any).gallery) : null,
      ]
    )
  }
}

async function migrateSliderProductsDetailFields() {
  const rows = await query<{ id: number, slug: string, format_es: string | null, category_es: string | null }>(
    'SELECT id, slug, format_es, category_es FROM slider_products'
  )
  for (const row of rows) {
    if (row.format_es !== null && row.category_es !== null) continue
    const defaults = defaultModelos.find((p) => p.slug === row.slug)
    if (!defaults) continue
    await query(
      `UPDATE slider_products
       SET category_es = ?,
           subtitle_es = ?,
           tagline_es = ?,
           description_es = ?,
           format_es = ?,
           shelf_life_es = ?,
           store_temp = ?, units_per_case = ?,
           logistics_es = ?
       WHERE id = ?`,
      [
        defaults.category_es ?? null,
        defaults.subtitle_es ?? null,
        defaults.tagline_es ?? null,
        defaults.description_es ?? null,
        defaults.format_es ?? null,
        defaults.shelf_life_es ?? null,
        defaults.store_temp ?? null, defaults.units_per_case ?? null,
        defaults.logistics_es ?? null,
        row.id,
      ]
    )
  }
}

const defaultHeroSlides = [
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
]

async function ensureHeroSlidesSeed() {
  const rows = await query<{ total: number }>('SELECT COUNT(*) AS total FROM hero_slides')
  if ((rows[0]?.total ?? 0) > 0) return

  for (const slide of defaultHeroSlides) {
    await query(
      `INSERT INTO hero_slides (media_type, image, video, title_es, title_en, alt_es, alt_en,
        image_class, title_class, has_baked_text, overlay_x, overlay_y, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, 1)`,
      [
        slide.media_type, slide.image, slide.video, slide.title_es, slide.title_en,
        slide.alt_es, slide.alt_en, slide.image_class, slide.title_class, slide.sort_order,
      ]
    )
  }
}

async function ensureAdminUsersSeed() {
  const rows = await query<{ total: number }>('SELECT COUNT(*) AS total FROM admin_users')
  if ((rows[0]?.total ?? 0) > 0) return

  await query(
    `INSERT INTO admin_users (email, password_hash, role)
     VALUES (?, ?, 'superadmin')`,
    [SUPERADMIN_EMAIL, hashPassword(SUPERADMIN_PASSWORD)]
  )
}

async function ensureFaqsSeed() {
  const rows = await query<{ total: number }>('SELECT COUNT(*) AS total FROM faqs')
  if ((rows[0]?.total ?? 0) > 0) return

  for (const faq of defaultFaqs) {
    await query(
      `INSERT INTO faqs (q, a, sort_order, is_active) VALUES (?, ?, ?, 1)`,
      [faq.q, faq.a, faq.sort_order]
    )
  }
}

async function ensureSamplePostsSeed() {
  const rows = await query<{ total: number }>('SELECT COUNT(*) AS total FROM blog_posts')
  if ((rows[0]?.total ?? 0) > 0) return

  const products = await query<{ id: number, slug: string }>('SELECT id, slug FROM products')
  const productIdBySlug = new Map(products.map((product) => [product.slug, product.id]))

  for (const post of defaultPosts) {
    const seo = buildSeoFields(post)
    await query(
      `INSERT INTO blog_posts (
        slug, title_es, title_en, excerpt_es, excerpt_en, content_es, content_en,
        image, category, external_url, product_id, seo_title_es, seo_title_en,
        seo_description_es, seo_description_en, seo_image, published, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post.slug,
        post.title_es,
        post.title_en,
        post.excerpt_es,
        post.excerpt_en,
        post.content_es,
        post.content_en,
        post.image,
        post.category,
        post.external_url,
        productIdBySlug.get(post.product_slug) ?? null,
        seo.seo_title_es,
        seo.seo_title_en,
        seo.seo_description_es,
        seo.seo_description_en,
        seo.seo_image,
        post.published,
        (post as any).created_at_override ? `${(post as any).created_at_override} 09:00:00` : new Date(),
      ]
    )
  }
}

async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(160) NOT NULL UNIQUE,
      name_es VARCHAR(180) NOT NULL,
      name_en VARCHAR(180) NULL,
      image VARCHAR(255) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(180) NOT NULL UNIQUE,
      title_es VARCHAR(255) NULL,
      title_en VARCHAR(255) NULL,
      excerpt_es TEXT NULL,
      excerpt_en TEXT NULL,
      content_es LONGTEXT NULL,
      content_en LONGTEXT NULL,
      image VARCHAR(255) NULL,
      category VARCHAR(120) NULL,
      external_url VARCHAR(255) NULL,
      product_id INT NULL,
      seo_title_es VARCHAR(255) NULL,
      seo_title_en VARCHAR(255) NULL,
      seo_description_es TEXT NULL,
      seo_description_en TEXT NULL,
      seo_image VARCHAR(255) NULL,
      published TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS slider_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(160) NOT NULL UNIQUE,
      name_es VARCHAR(180) NOT NULL,
      name_en VARCHAR(180) NULL,
      image VARCHAR(255) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      category VARCHAR(120) NULL,
      category_es VARCHAR(120) NULL,
      category_en VARCHAR(120) NULL,
      subtitle VARCHAR(255) NULL,
      subtitle_es VARCHAR(255) NULL,
      subtitle_en VARCHAR(255) NULL,
      tagline_es VARCHAR(255) NULL,
      tagline_en VARCHAR(255) NULL,
      description_es TEXT NULL,
      description_en TEXT NULL,
      format VARCHAR(120) NULL,
      format_es VARCHAR(120) NULL,
      shelf_life VARCHAR(120) NULL,
      shelf_life_es VARCHAR(120) NULL,
      store_temp VARCHAR(60) NULL,
      units_per_case VARCHAR(30) NULL,
      logistics VARCHAR(255) NULL,
      logistics_es VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      media_type VARCHAR(10) NOT NULL DEFAULT 'image',
      image VARCHAR(255) NULL,
      video VARCHAR(255) NULL,
      video_en VARCHAR(255) NULL,
      title_es VARCHAR(255) NULL,
      title_en VARCHAR(255) NULL,
      alt_es VARCHAR(255) NULL,
      alt_en VARCHAR(255) NULL,
      image_class VARCHAR(60) NULL,
      title_class VARCHAR(60) NULL,
      has_baked_text TINYINT(1) NOT NULL DEFAULT 0,
      overlay_x DECIMAL(5,2) NULL,
      overlay_y DECIMAL(5,2) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'editor',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token VARCHAR(128) PRIMARY KEY,
      user_id INT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(120) PRIMARY KEY,
      setting_value LONGTEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      q VARCHAR(255) NOT NULL,
      a TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS sigurban_chat_sessions (
      sender_id VARCHAR(190) PRIMARY KEY,
      has_greeted TINYINT(1) NOT NULL DEFAULT 0,
      stage VARCHAR(30) NOT NULL DEFAULT 'info',
      lead_name VARCHAR(180) NULL,
      lead_dni VARCHAR(20) NULL,
      lead_phone VARCHAR(20) NULL,
      last_seen_ms BIGINT NOT NULL DEFAULT 0,
      last_user_text TEXT NULL,
      last_message_id VARCHAR(190) NULL,
      last_bot_reply TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS sigurban_chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id VARCHAR(190) NOT NULL,
      role VARCHAR(20) NOT NULL,
      text TEXT NULL,
      message_id VARCHAR(190) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sender (sender_id)
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS sigurban_lead_requests (
      sender_id VARCHAR(190) PRIMARY KEY,
      lead_name VARCHAR(180) NULL,
      lead_dni VARCHAR(20) NULL,
      lead_phone VARCHAR(20) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      requested_count INT NOT NULL DEFAULT 0,
      first_requested_at DATETIME NULL,
      last_requested_at DATETIME NULL,
      last_reason VARCHAR(190) NULL,
      last_api_response TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  const productAlterStatements = []
  if (!(await hasColumn('products', 'name_en'))) productAlterStatements.push('ADD COLUMN name_en VARCHAR(180) NULL AFTER name_es')
  if (!(await hasColumn('products', 'sort_order'))) productAlterStatements.push('ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER image')
  if (!(await hasColumn('products', 'is_active'))) productAlterStatements.push('ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER sort_order')
  if (!(await hasColumn('products', 'location_es'))) productAlterStatements.push('ADD COLUMN location_es VARCHAR(255) NULL')
  if (!(await hasColumn('products', 'description_es'))) productAlterStatements.push('ADD COLUMN description_es TEXT NULL')
  if (!(await hasColumn('products', 'description_long_es'))) productAlterStatements.push('ADD COLUMN description_long_es TEXT NULL')
  if (!(await hasColumn('products', 'maps_url'))) productAlterStatements.push('ADD COLUMN maps_url VARCHAR(500) NULL')
  if (!(await hasColumn('products', 'badge_es'))) productAlterStatements.push("ADD COLUMN badge_es VARCHAR(60) NULL DEFAULT 'Disponible'")
  for (const statement of productAlterStatements) {
    await query(`ALTER TABLE products ${statement}`)
  }

  const heroAlterStatements = []
  if (!(await hasColumn('hero_slides', 'video_en'))) heroAlterStatements.push('ADD COLUMN video_en VARCHAR(255) NULL AFTER video')
  for (const statement of heroAlterStatements) {
    await query(`ALTER TABLE hero_slides ${statement}`)
  }

  const sliderAlterStatements = []
  if (!(await hasColumn('slider_products', 'category'))) sliderAlterStatements.push('ADD COLUMN category VARCHAR(120) NULL')
  if (!(await hasColumn('slider_products', 'category_es'))) sliderAlterStatements.push('ADD COLUMN category_es VARCHAR(120) NULL')
  if (!(await hasColumn('slider_products', 'category_en'))) sliderAlterStatements.push('ADD COLUMN category_en VARCHAR(120) NULL')
  if (!(await hasColumn('slider_products', 'subtitle'))) sliderAlterStatements.push('ADD COLUMN subtitle VARCHAR(255) NULL')
  if (!(await hasColumn('slider_products', 'subtitle_es'))) sliderAlterStatements.push('ADD COLUMN subtitle_es VARCHAR(255) NULL')
  if (!(await hasColumn('slider_products', 'subtitle_en'))) sliderAlterStatements.push('ADD COLUMN subtitle_en VARCHAR(255) NULL')
  if (!(await hasColumn('slider_products', 'tagline_es'))) sliderAlterStatements.push('ADD COLUMN tagline_es VARCHAR(255) NULL')
  if (!(await hasColumn('slider_products', 'tagline_en'))) sliderAlterStatements.push('ADD COLUMN tagline_en VARCHAR(255) NULL')
  if (!(await hasColumn('slider_products', 'description_es'))) sliderAlterStatements.push('ADD COLUMN description_es TEXT NULL')
  if (!(await hasColumn('slider_products', 'description_en'))) sliderAlterStatements.push('ADD COLUMN description_en TEXT NULL')
  if (!(await hasColumn('slider_products', 'format'))) sliderAlterStatements.push('ADD COLUMN format VARCHAR(120) NULL')
  if (!(await hasColumn('slider_products', 'format_es'))) sliderAlterStatements.push('ADD COLUMN format_es VARCHAR(120) NULL')
  if (!(await hasColumn('slider_products', 'shelf_life'))) sliderAlterStatements.push('ADD COLUMN shelf_life VARCHAR(120) NULL')
  if (!(await hasColumn('slider_products', 'shelf_life_es'))) sliderAlterStatements.push('ADD COLUMN shelf_life_es VARCHAR(120) NULL')
  if (!(await hasColumn('slider_products', 'store_temp'))) sliderAlterStatements.push('ADD COLUMN store_temp VARCHAR(60) NULL')
  if (!(await hasColumn('slider_products', 'units_per_case'))) sliderAlterStatements.push('ADD COLUMN units_per_case VARCHAR(30) NULL')
  if (!(await hasColumn('slider_products', 'logistics'))) sliderAlterStatements.push('ADD COLUMN logistics VARCHAR(255) NULL')
  if (!(await hasColumn('slider_products', 'logistics_es'))) sliderAlterStatements.push('ADD COLUMN logistics_es VARCHAR(255) NULL')
  if (!(await hasColumn('slider_products', 'gallery_json'))) sliderAlterStatements.push('ADD COLUMN gallery_json TEXT NULL')
  if (!(await hasColumn('slider_products', 'videos_json'))) sliderAlterStatements.push('ADD COLUMN videos_json TEXT NULL')
  for (const statement of sliderAlterStatements) {
    await query(`ALTER TABLE slider_products ${statement}`)
  }

  const blogAlterStatements = []
  if (!(await hasColumn('blog_posts', 'external_url'))) blogAlterStatements.push('ADD COLUMN external_url VARCHAR(255) NULL AFTER category')
  if (!(await hasColumn('blog_posts', 'product_id'))) blogAlterStatements.push('ADD COLUMN product_id INT NULL AFTER category')
  if (!(await hasColumn('blog_posts', 'seo_title_es'))) blogAlterStatements.push('ADD COLUMN seo_title_es VARCHAR(255) NULL AFTER product_id')
  if (!(await hasColumn('blog_posts', 'seo_title_en'))) blogAlterStatements.push('ADD COLUMN seo_title_en VARCHAR(255) NULL AFTER seo_title_es')
  if (!(await hasColumn('blog_posts', 'seo_description_es'))) blogAlterStatements.push('ADD COLUMN seo_description_es TEXT NULL AFTER seo_title_en')
  if (!(await hasColumn('blog_posts', 'seo_description_en'))) blogAlterStatements.push('ADD COLUMN seo_description_en TEXT NULL AFTER seo_description_es')
  if (!(await hasColumn('blog_posts', 'seo_image'))) blogAlterStatements.push('ADD COLUMN seo_image VARCHAR(255) NULL AFTER seo_description_en')
  for (const statement of blogAlterStatements) {
    await query(`ALTER TABLE blog_posts ${statement}`)
  }

  await ensureProductsSeed()
  await ensureSliderProductsSeed()
  await migrateSliderProductsDetailFields()
  await ensureHeroSlidesSeed()
  await ensureAdminUsersSeed()
  await ensureSamplePostsSeed()
  await ensureFaqsSeed()
}

export async function ensureContentSchema() {
  if (!schemaPromise) {
    schemaPromise = initSchema().catch((error) => {
      schemaPromise = null
      throw error
    })
  }

  return schemaPromise
}
