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
            <div class="gallery-main"><img :src="activeImage" :alt="modelo.name_es" @error="onImgError" /></div>
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
            <p style="margin-top:20px;color:var(--muted);line-height:1.7;font-size:15px;">{{ modelo.description_es }}</p>
          </div>

          <aside class="detail-sidebar">
            <span class="card-badge" style="position:static;display:inline-block;">{{ modelo.category_es }}</span>
            <h3 style="margin-top:12px;font-size:20px;">{{ modelo.name_es }}</h3>
            <p style="font-size:13px;color:var(--muted);margin-top:4px;">{{ modelo.subtitle_es }}</p>

            <div class="spec-list">
              <div><strong>{{ modelo.format_es }}</strong><span>Construcción</span></div>
              <div><strong>{{ modelo.shelf_life_es }}</strong><span>Dormitorios</span></div>
              <div><strong>{{ modelo.store_temp }}</strong><span>Baños</span></div>
              <div><strong>{{ modelo.units_per_case }}</strong><span>Parqueos</span></div>
            </div>

            <p style="font-size:13px;color:var(--muted);">{{ modelo.logistics_es }}</p>

            <a class="btn btn-primary" style="width:100%;margin-top:14px;" :href="waHref" target="_blank" rel="noopener"><Icon name="whatsapp" :size="16" /> Cotizar por WhatsApp</a>
            <NuxtLink class="btn btn-outline" style="width:100%;margin-top:10px;" to="/proyectos">Ver proyectos</NuxtLink>
          </aside>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const modelo = ref(null)
const waNumber = ref('50431731754')
const activeImage = ref('')

const gallery = computed(() => {
  const g = Array.isArray(modelo.value?.gallery) ? modelo.value.gallery.filter(Boolean) : []
  return g.length ? g : (modelo.value?.image ? [modelo.value.image] : [])
})

const waHref = computed(() => `https://api.whatsapp.com/send?phone=${waNumber.value}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y me interesa el modelo ' + (modelo.value?.name_es || '') + ' 😊')}`)

function onImgError(e) { e.target.src = '/images/bg_gradiente.svg' }

onMounted(async () => {
  try {
    const [res, info] = await Promise.all([
      $fetch(`/api/slider-products/${route.params.slug}`),
      $fetch('/api/site-info'),
    ])
    modelo.value = res.data
    activeImage.value = modelo.value?.image || ''
    waNumber.value = info.data?.whatsapp_number || '50431731754'
    useHead({ title: `Modelo ${modelo.value?.name_es || ''} | Sig-Urban` })
  } catch {}
})
</script>
