<template>
  <div>
    <Menu />

    <section v-if="proyecto" class="page-hero">
      <div class="container">
        <div class="breadcrumb"><NuxtLink to="/">Inicio</NuxtLink> / <NuxtLink to="/proyectos">Proyectos</NuxtLink> / {{ proyecto.name_es }}</div>
        <h1>{{ proyecto.name_es }}</h1>
        <p><Icon name="mapPin" :size="14" /> {{ proyecto.location_es }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div v-if="!proyecto" class="empty-state">Proyecto no encontrado.</div>
        <div v-else class="detail-grid">
          <div>
            <div class="gallery-main" style="background:var(--bg-soft);"><img :src="proyecto.image" :alt="proyecto.name_es" style="object-fit:contain;" @error="onImgError" /></div>
            <p style="margin-top:20px;color:var(--muted);line-height:1.7;font-size:15px;">{{ proyecto.description_long_es || proyecto.description_es }}</p>

            <h2 style="margin-top:28px;color:var(--azul);font-size:20px;">Modelos disponibles en este proyecto</h2>
            <div class="cards-grid" style="margin-top:16px;">
              <NuxtLink v-for="m in modelos" :key="m.id" :to="`/modelos-de-casa/${m.slug}`" class="card">
                <div class="card-media"><img :src="m.image" :alt="m.name_es" @error="onImgError" /></div>
                <div class="card-body">
                  <h3>{{ m.name_es }}</h3>
                  <div class="card-specs"><span><Icon name="ruler" :size="13" /> {{ m.format_es }}</span><span><Icon name="bed" :size="13" /> {{ m.shelf_life_es }}</span></div>
                  <span class="btn-link">Ver modelo →</span>
                </div>
              </NuxtLink>
            </div>
          </div>

          <aside class="detail-sidebar">
            <span class="card-badge" :class="{ soon: proyecto.badge_es !== 'Disponible' }" style="position:static;display:inline-block;">{{ proyecto.badge_es || 'Disponible' }}</span>
            <h3 style="margin-top:12px;font-size:18px;">{{ proyecto.name_es }}</h3>
            <p style="font-size:13.5px;color:var(--muted);margin-top:6px;"><Icon name="mapPin" :size="13" /> {{ proyecto.location_es }}</p>
            <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;" />
            <a class="btn btn-primary" style="width:100%;" :href="waHref" target="_blank" rel="noopener"><Icon name="whatsapp" :size="16" /> Cotizar por WhatsApp</a>
            <a v-if="proyecto.maps_url" class="btn btn-outline" style="width:100%;margin-top:10px;" :href="proyecto.maps_url" target="_blank" rel="noopener"><Icon name="mapPin" :size="16" /> Ver en Google Maps</a>
            <NuxtLink class="btn btn-outline" style="width:100%;margin-top:10px;" to="/modelos-de-casa">Ver modelos de casa</NuxtLink>
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
const modelos = ref([])
const waNumber = ref('50431731754')

const { data: proyectoRes } = await useAsyncData(`proyecto-${route.params.slug}`, () => $fetch(`/api/products/${route.params.slug}`))
const proyecto = computed(() => proyectoRes.value?.data || null)

const waHref = computed(() => `https://api.whatsapp.com/send?phone=${waNumber.value}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y me interesa el proyecto ' + (proyecto.value?.name_es || '') + ' 😊')}`)

function onImgError(e) { e.target.src = '/images/bg_gradiente.svg' }

const seoTitle = computed(() => `${proyecto.value?.name_es || 'Proyecto'} | Sig-Urban`)
const seoDescription = computed(() => proyecto.value?.description_es || 'Conocé este proyecto residencial de Sig-Urban en Siguatepeque, Honduras.')
const seoImage = computed(() => {
  const img = proyecto.value?.image || ''
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
    const [m, info] = await Promise.all([
      $fetch('/api/slider-products'),
      $fetch('/api/site-info'),
    ])
    const all = m.data || []
    // Un modelo "pertenece" a este proyecto cuando su Proyecto/Colonia (category_es, editable
    // en /admin → Modelos de casa) coincide con el nombre del proyecto, y solo se muestra si
    // además está marcado como "Disponible para construcción" — ambos campos se administran
    // desde la ficha del modelo en /admin.
    const propios = all.filter((mo) => mo.category_es === proyecto.value?.name_es && mo.is_available !== 0 && mo.is_available !== false)
    modelos.value = propios.length ? propios : all.filter((mo) => mo.is_available !== 0 && mo.is_available !== false).slice(0, 4)
    waNumber.value = info.data?.whatsapp_number || '50431731754'
  } catch {}
})
</script>
