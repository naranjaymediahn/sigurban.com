<template>
  <div>
    <Menu />

    <section class="page-hero">
      <div class="container">
        <div class="breadcrumb"><NuxtLink to="/">Inicio</NuxtLink> / Blog</div>
        <h1>Guías y consejos para ti</h1>
        <p>Finanzas personales, requisitos y todo lo que necesitás saber para dar el primer paso hacia tu casa propia.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div v-if="loading" class="empty-state">Cargando...</div>
        <div v-else-if="!posts.length" class="empty-state">Muy pronto tendremos contenido aquí.</div>
        <div v-else class="cards-grid">
          <NuxtLink v-for="post in posts" :key="post.id" :to="buildPostUrl(post, permalinkMode)" class="card blog-card">
            <div class="card-media">
              <img :src="post.image" :alt="post.title_es" @error="onImgError" />
              <span class="blog-tag">{{ post.category }}</span>
            </div>
            <div class="card-body">
              <span class="blog-date">{{ formatDate(post.created_at) }}</span>
              <h3>{{ post.title_es }}</h3>
              <p class="desc">{{ post.excerpt_es }}</p>
              <span class="btn-link">Leer más →</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const posts = ref([])
const loading = ref(true)
const permalinkMode = ref('date')

function onImgError(e) { e.target.src = '/images/bg_gradiente.svg' }
function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const BLOG_DESCRIPTION = 'Blog de Sig-Urban: consejos, novedades y guías sobre vivienda, financiamiento y proyectos residenciales en Siguatepeque, Honduras.'
const { data: seoInfo } = await useAsyncData('site-info-blog-index', () => $fetch('/api/site-info'))
const ogImage = computed(() => seoInfo.value?.data?.og_image || 'https://www.sigurban.com/images/sigurban-2.svg')

useHead({
  title: 'Blog | Sig-Urban',
  meta: [
    { name: 'description', content: BLOG_DESCRIPTION },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Sig-Urban' },
    { property: 'og:title', content: 'Blog | Sig-Urban' },
    { property: 'og:description', content: BLOG_DESCRIPTION },
    { property: 'og:image', content: ogImage },
    { property: 'og:url', content: 'https://www.sigurban.com/blog' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Blog | Sig-Urban' },
    { name: 'twitter:description', content: BLOG_DESCRIPTION },
    { name: 'twitter:image', content: ogImage },
  ],
})

onMounted(async () => {
  try {
    const [res, info] = await Promise.all([$fetch('/api/blog'), $fetch('/api/site-info')])
    posts.value = res.data || []
    permalinkMode.value = info.data?.blog_permalink_mode || 'date'
  } finally {
    loading.value = false
  }
})
</script>
