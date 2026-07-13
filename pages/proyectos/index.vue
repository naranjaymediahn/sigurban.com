<template>
  <div>
    <Menu />

    <section class="page-hero">
      <div class="container">
        <div class="breadcrumb"><NuxtLink to="/">Inicio</NuxtLink> / Proyectos</div>
        <h1>Nuestros proyectos</h1>
        <p>Comunidades planificadas y urbanizadas para tu bienestar en Siguatepeque, Comayagua.</p>
      </div>
    </section>

    <section class="section" style="padding-bottom:0;">
      <div class="container">
        <p style="max-width:760px;color:var(--muted);line-height:1.7;font-size:15px;">
          En Sig-Urban desarrollamos comunidades residenciales urbanizadas en Siguatepeque, pensadas para el bienestar de tu familia:
          calles vehiculares, agua potable, energía eléctrica, áreas verdes y seguridad. Conocé cada uno de nuestros proyectos y
          encontrá el que mejor se ajuste a lo que buscás.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div v-if="loading" class="empty-state">Cargando...</div>
        <div v-else class="cards-grid">
          <NuxtLink v-for="p in proyectos" :key="p.id" :to="`/proyectos/${p.slug}`" class="card">
            <div class="card-media">
              <img :src="p.image" :alt="p.name_es" @error="onImgError" />
              <span class="card-badge" :class="{ soon: p.badge_es !== 'Disponible' }">{{ p.badge_es || 'Disponible' }}</span>
            </div>
            <div class="card-body">
              <h3>{{ p.name_es }}</h3>
              <div class="card-location"><Icon name="mapPin" :size="13" /> {{ p.location_es }}</div>
              <p class="desc">{{ p.description_es }}</p>
              <span class="btn-link">Conocer proyecto →</span>
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

const proyectos = ref([])
const loading = ref(true)

function onImgError(e) { e.target.src = '/images/bg_gradiente.svg' }

useHead({ title: 'Proyectos | Sig-Urban' })

onMounted(async () => {
  try {
    const res = await $fetch('/api/products')
    proyectos.value = res.data || []
  } finally {
    loading.value = false
  }
})
</script>
