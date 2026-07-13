<template>
  <header class="site-header">
    <div class="container">
      <NuxtLink to="/" class="logo">
        <img src="/images/sigurban-2.svg" alt="Sig-Urban" />
        <span class="logo-word">
          <strong>SIG-URBAN</strong>
          <small>Innovación y certificación</small>
        </span>
      </NuxtLink>

      <nav class="site-nav" :class="{ open }">
        <NuxtLink to="/" @click="open = false">Inicio</NuxtLink>
        <NuxtLink to="/proyectos" @click="open = false">Proyectos</NuxtLink>
        <NuxtLink to="/modelos-de-casa" @click="open = false">Modelos de casas</NuxtLink>
        <NuxtLink to="/quienes-somos" @click="open = false">Nosotros</NuxtLink>
        <NuxtLink to="/blog" @click="open = false">Blog</NuxtLink>
        <NuxtLink to="/contactanos" @click="open = false">Contacto</NuxtLink>
      </nav>

      <div class="header-actions">
        <a
          class="btn btn-primary btn-sm"
          :href="`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y quisiera información sobre Sig-Urban 😊')}`"
          target="_blank" rel="noopener"
        ><Icon name="whatsapp" :size="16" /> <span>Cotizar por WhatsApp</span></a>
        <button class="nav-toggle" @click="open = !open" aria-label="Menú">
          <span /><span /><span />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const open = ref(false)
const waNumber = ref('50431731754')

onMounted(async () => {
  try {
    const res = await $fetch('/api/site-info')
    waNumber.value = res.data?.whatsapp_number || '50431731754'
  } catch {}
})
</script>
