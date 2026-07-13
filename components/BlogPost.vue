<template>
  <div>
    <Menu />

    <section v-if="post" class="page-hero">
      <div class="container">
        <div class="breadcrumb"><NuxtLink to="/">Inicio</NuxtLink> / <NuxtLink to="/blog">Blog</NuxtLink> / {{ post.title_es }}</div>
        <h1>{{ post.title_es }}</h1>
        <p>{{ post.excerpt_es }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div v-if="!post" class="empty-state">Artículo no encontrado.</div>
        <div v-else class="detail-grid">
          <div>
            <img :src="post.image" :alt="post.title_es" style="border-radius:14px;width:100%;max-height:520px;aspect-ratio:4/3;object-fit:contain;background:var(--bg-soft);margin-bottom:24px;" @error="onImgError" />
            <div class="post-content" v-html="post.content_es" />
          </div>
          <aside class="detail-sidebar">
            <span class="blog-tag" style="position:static;display:inline-block;">{{ post.category }}</span>
            <p style="margin-top:14px;font-size:13px;color:var(--muted);">Publicado el {{ formatDate(post.created_at) }}</p>
            <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;" />
            <p style="font-size:13.5px;color:var(--muted);">¿Tenés dudas sobre este tema?</p>
            <a class="btn btn-primary" style="width:100%;margin-top:10px;" :href="waHref" target="_blank" rel="noopener"><Icon name="whatsapp" :size="16" /> Hablar con un asesor</a>
          </aside>
        </div>
      </div>
    </section>

    <CtaBanner v-if="post" />

    <Footer />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  slug: { type: String, required: true },
})

const route = useRoute()

const { data: post } = await useAsyncData(`blog-post-${props.slug}`, async () => {
  try {
    const res = await $fetch(`/api/blog/${props.slug}`)
    return res?.data || null
  } catch {
    return null
  }
})

const { data: siteInfo } = await useAsyncData('site-info-blog', () => $fetch('/api/site-info'))
const waNumber = computed(() => siteInfo.value?.data?.whatsapp_number || '50431731754')
const waHref = computed(() => `https://api.whatsapp.com/send?phone=${waNumber.value}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y quisiera información sobre Sig-Urban 😊')}`)

function onImgError(e) { e.target.src = '/images/bg_gradiente.svg' }
function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })
}

const seoTitle = computed(() => post.value?.seo_title_es || post.value?.title_es || 'Blog')
const seoDescription = computed(() => post.value?.seo_description_es || post.value?.excerpt_es || '')
const seoImage = computed(() => {
  const img = post.value?.seo_image || post.value?.image || ''
  return img?.startsWith('http') ? img : `https://www.sigurban.com${img}`
})
const canonicalUrl = computed(() => `https://www.sigurban.com${route.fullPath}`)

useHead({
  title: () => `${seoTitle.value} | Sig-Urban`,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: 'Sig-Urban' },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:image', content: seoImage },
    { property: 'og:url', content: canonicalUrl },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription },
    { name: 'twitter:image', content: seoImage },
  ],
})
</script>
