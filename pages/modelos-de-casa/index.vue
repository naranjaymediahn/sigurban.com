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
import { ref, onMounted } from 'vue'

const modelos = ref([])
const loading = ref(true)

function onImgError(e) { e.target.src = '/images/bg_gradiente.svg' }

useHead({ title: 'Modelos de casas | Sig-Urban' })

onMounted(async () => {
  try {
    const res = await $fetch('/api/slider-products')
    modelos.value = res.data || []
  } finally {
    loading.value = false
  }
})
</script>
