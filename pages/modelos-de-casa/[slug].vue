<template>
  <div>
    <Menu />

    <section v-if="modelo" class="page-hero">
      <div class="container">
        <div class="breadcrumb"><NuxtLink to="/">Inicio</NuxtLink> / <NuxtLink to="/modelos-de-casa">Modelos de casas</NuxtLink> / {{ modelo.name_es }}</div>
        <h1>Modelo {{ modelo.name_es }}</h1>
        <p>{{ modelo.tagline_es }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div v-if="!modelo" class="empty-state">Modelo no encontrado.</div>
        <div v-else class="detail-grid">
          <div>
            <div class="gallery-main">
              <img :src="activeImage" :alt="modelo.name_es" @error="onImgError" />
              <span v-if="gallery.length > 1" class="gallery-count"><Icon name="photo" :size="13" /> {{ gallery.length }} fotos</span>
            </div>
            <div v-if="gallery.length > 1" class="gallery-thumbs">
              <img
                v-for="(img, i) in gallery"
                :key="i"
                :src="img"
                :class="{ active: img === activeImage }"
                :alt="`${modelo.name_es} - foto ${i + 1}`"
                @click="activeImage = img"
                @error="onImgError"
              />
            </div>

            <div v-if="modelo.description_es" class="model-intro">
              <div class="model-intro-icon"><Icon name="houseModel" :size="22" /></div>
              <div>
                <span class="model-intro-eyebrow">Conocé el modelo {{ modelo.name_es }}</span>
                <p>{{ modelo.description_es }}</p>
              </div>
            </div>

            <section v-if="videos.length" class="model-videos">
              <div class="model-videos-head">
                <h2><Icon name="youtube" :size="18" /> Videos del proyecto</h2>
                <span class="small-note">Recorridos, testimonios y detalles del modelo ({{ videos.length }} video{{ videos.length > 1 ? 's' : '' }}).</span>
              </div>
              <div class="model-videos-grid">
                <button v-for="v in videos" :key="v.youtubeId" type="button" class="video-card" @click="openVideo(v.youtubeId)">
                  <span class="video-thumb">
                    <img :src="`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`" :alt="v.title" loading="lazy" />
                    <Icon name="play" :size="40" />
                  </span>
                  <strong>{{ v.title }}</strong>
                  <span>{{ v.description }}</span>
                </button>
              </div>
            </section>
          </div>

          <aside class="detail-sidebar">
            <span class="card-badge" style="position:static;display:inline-block;">{{ modelo.category_es }}</span>
            <span v-if="!isAvailable" class="card-badge soon" style="position:static;display:inline-block;margin-left:6px;">No disponible actualmente</span>
            <h3 style="margin-top:12px;font-size:20px;">{{ modelo.name_es }}</h3>
            <p style="font-size:13px;color:var(--muted);margin-top:4px;">{{ modelo.subtitle_es }}</p>

            <div class="spec-list">
              <div v-if="modelo.format_es"><Icon name="ruler" :size="18" /><strong>{{ modelo.format_es }}</strong><span>Construcción</span></div>
              <div v-if="modelo.shelf_life_es"><Icon name="bed" :size="18" /><strong>{{ modelo.shelf_life_es }}</strong><span>Dormitorios</span></div>
              <div v-if="modelo.store_temp"><Icon name="bath" :size="18" /><strong>{{ modelo.store_temp }}</strong><span>Baños</span></div>
              <div v-if="modelo.units_per_case"><Icon name="car" :size="18" /><strong>{{ modelo.units_per_case }}</strong><span>Parqueos</span></div>
            </div>

            <p v-if="modelo.logistics_es" style="font-size:13px;color:var(--muted);">{{ modelo.logistics_es }}</p>

            <a class="btn btn-primary" style="width:100%;margin-top:14px;" :href="waHref" target="_blank" rel="noopener"><Icon name="whatsapp" :size="16" /> {{ isAvailable ? 'Cotizar por WhatsApp' : 'Consultar otras opciones' }}</a>
            <NuxtLink class="btn btn-outline" style="width:100%;margin-top:10px;" to="/proyectos">Ver proyectos</NuxtLink>
          </aside>
        </div>
      </div>
    </section>

    <CtaBanner />

    <Footer />

    <div v-if="activeVideoId" class="video-modal" @click.self="closeVideo">
      <div class="video-modal-inner">
        <button class="video-modal-close" @click="closeVideo"><Icon name="close" :size="20" /></button>
        <div class="video-modal-frame">
          <iframe
            :src="`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`"
            title="Video de Sig-Urban"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const waNumber = ref('50431731754')
const activeImage = ref('')
const activeVideoId = ref('')

const { data: modeloRes } = await useAsyncData(`modelo-${route.params.slug}`, () => $fetch(`/api/slider-products/${route.params.slug}`))
const modelo = computed(() => modeloRes.value?.data || null)
if (modelo.value?.image) activeImage.value = modelo.value.image

const gallery = computed(() => {
  const g = Array.isArray(modelo.value?.gallery) ? modelo.value.gallery.filter(Boolean) : []
  return g.length ? g : (modelo.value?.image ? [modelo.value.image] : [])
})

const videos = computed(() => Array.isArray(modelo.value?.videos) ? modelo.value.videos.filter((v) => v?.youtubeId) : [])

function openVideo(youtubeId) { activeVideoId.value = youtubeId }
function closeVideo() { activeVideoId.value = '' }

const isAvailable = computed(() => modelo.value?.is_available !== 0 && modelo.value?.is_available !== false)

const waHref = computed(() => {
  const nombre = modelo.value?.name_es || ''
  const mensaje = isAvailable.value
    ? `¡Hola! 👋🏡 Vi esto en Redes sociales y me interesa el modelo ${nombre} 😊`
    : `¡Hola! 👋🏡 Vi el modelo ${nombre} en la web, sé que no está disponible por ahora pero quisiera saber qué otras opciones tienen 😊`
  return `https://api.whatsapp.com/send?phone=${waNumber.value}&text=${encodeURIComponent(mensaje)}`
})

function onImgError(e) { e.target.src = '/images/bg_gradiente.svg' }

const seoTitle = computed(() => `Modelo ${modelo.value?.name_es || ''} | Sig-Urban`)
const seoDescription = computed(() => modelo.value?.description_es || 'Conocé este modelo de casa de Sig-Urban en Siguatepeque, Honduras.')
const seoImage = computed(() => {
  const img = modelo.value?.image || ''
  return img?.startsWith('http') ? img : `https://www.sigurban.com${img}`
})
const canonicalUrl = computed(() => `https://www.sigurban.com${route.fullPath}`)

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:type', content: 'website' },
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

onMounted(async () => {
  try {
    const info = await $fetch('/api/site-info')
    waNumber.value = info.data?.whatsapp_number || '50431731754'
  } catch {}
})
</script>
