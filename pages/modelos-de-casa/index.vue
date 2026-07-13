<template>
  <div>
    <Menu />

    <section class="page-hero">
      <div class="container">
        <div class="breadcrumb"><NuxtLink to="/">Inicio</NuxtLink> / Modelos de casas</div>
        <h1>Modelos de casas</h1>
        <p>Diseños modernos pensados para tu estilo de vida, con especificaciones claras y precios referenciales.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div v-if="loading" class="empty-state">Cargando...</div>
        <div v-else class="cards-grid">
          <NuxtLink v-for="m in modelos" :key="m.id" :to="`/modelos-de-casa/${m.slug}`" class="card">
            <div class="card-media"><img :src="m.image" :alt="m.name_es" @error="onImgError" /></div>
            <div class="card-body">
              <h3>{{ m.name_es }}</h3>
              <div class="card-specs">
                <span><Icon name="ruler" :size="13" /> {{ m.format_es }}</span>
                <span><Icon name="bed" :size="13" /> {{ m.shelf_life_es }}</span>
                <span><Icon name="bath" :size="13" /> {{ m.store_temp }}</span>
              </div>
              <span class="btn-link">Ver modelo →</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <CtaBanner />

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const modelos = ref([])
const loading = ref(true)

function onImgError(e) { e.target.src = '/images/bg_gradiente.svg' }

const MODELOS_DESCRIPTION = 'Descubrí los modelos de casa de Sig-Urban en Siguatepeque, Honduras: diseños pensados para cada familia con financiamiento disponible.'
const { data: seoModelos } = await useAsyncData('modelos-seo', () => $fetch('/api/slider-products'))
const { data: seoInfo } = await useAsyncData('site-info-modelos', () => $fetch('/api/site-info'))
const ogImage = computed(() => seoModelos.value?.data?.[0]?.image || seoInfo.value?.data?.og_image || 'https://www.sigurban.com/images/sigurban-2.svg')

useHead({
  title: 'Modelos de casas | Sig-Urban',
  meta: [
    { name: 'description', content: MODELOS_DESCRIPTION },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Sig-Urban' },
    { property: 'og:title', content: 'Modelos de casas | Sig-Urban' },
    { property: 'og:description', content: MODELOS_DESCRIPTION },
    { property: 'og:image', content: ogImage },
    { property: 'og:url', content: 'https://www.sigurban.com/modelos-de-casa' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Modelos de casas | Sig-Urban' },
    { name: 'twitter:description', content: MODELOS_DESCRIPTION },
    { name: 'twitter:image', content: ogImage },
  ],
})

onMounted(async () => {
  try {
    const res = await $fetch('/api/slider-products')
    modelos.value = res.data || []
  } finally {
    loading.value = false
  }
})
</script>
