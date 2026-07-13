<template>
  <section class="section">
    <div class="container">
      <div class="cta-banner">
        <div>
          <h3>{{ quote.title }}</h3>
          <p>{{ quote.text }}</p>
        </div>
        <a :href="waHref" target="_blank" rel="noopener" class="btn btn-primary">{{ quote.cta }} <Icon name="arrowRight" :size="16" /></a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const waNumber = ref('50431731754')
const waHref = computed(() => `https://api.whatsapp.com/send?phone=${waNumber.value}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y quisiera información sobre Sig-Urban 😊')}`)

const QUOTES = [
  { title: 'Tu casa propia empieza con un mensaje', text: 'No dejes para mañana el hogar que tu familia merece hoy.', cta: 'Quiero aplicar' },
  { title: 'El mejor momento para empezar es ahora', text: 'Cada mes que pagás renta es un mes que no invertís en tu futuro.', cta: 'Precalificar ahora' },
  { title: 'Tu familia merece un hogar propio', text: 'Te acompañamos en cada paso, desde la precalificación hasta la entrega de llaves.', cta: 'Hablar con un asesor' },
  { title: 'Agenda tu visita hoy', text: 'Conocé nuestros proyectos y encontrá el hogar ideal para tu familia.', cta: 'Agendar visita' },
  { title: 'Convertí tu aguinaldo en tu nueva casa', text: 'Con acompañamiento financiero, tu casa propia está más cerca de lo que pensás.', cta: 'Quiero saber cómo' },
]

const quote = ref(QUOTES[0])

onMounted(async () => {
  quote.value = QUOTES[Math.floor(Math.random() * QUOTES.length)]
  try {
    const info = await $fetch('/api/site-info')
    waNumber.value = info.data?.whatsapp_number || '50431731754'
  } catch {}
})
</script>
