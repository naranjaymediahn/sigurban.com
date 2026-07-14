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
import { DEFAULT_CTA_QUOTES } from '../utils/defaultCtaQuotes'

const waNumber = ref('50431731754')
const waHref = computed(() => `https://api.whatsapp.com/send?phone=${waNumber.value}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y quisiera información sobre Sig-Urban 😊')}`)

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

// Aleatorio desde el arranque (no fijo al índice 0) para que ya varíe en el primer render,
// y se vuelve a sortear en onMounted una vez tenemos las citas reales configuradas en /admin.
const quote = ref(pickRandom(DEFAULT_CTA_QUOTES))

onMounted(async () => {
  try {
    const info = await $fetch('/api/site-info')
    waNumber.value = info.data?.whatsapp_number || '50431731754'
    const quotes = Array.isArray(info.data?.cta_quotes) && info.data.cta_quotes.length ? info.data.cta_quotes : DEFAULT_CTA_QUOTES
    quote.value = pickRandom(quotes)
  } catch {
    quote.value = pickRandom(DEFAULT_CTA_QUOTES)
  }
})
</script>
