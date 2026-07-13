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

const quote = ref(DEFAULT_CTA_QUOTES[0])

onMounted(async () => {
  try {
    const info = await $fetch('/api/site-info')
    waNumber.value = info.data?.whatsapp_number || '50431731754'
    const quotes = Array.isArray(info.data?.cta_quotes) && info.data.cta_quotes.length ? info.data.cta_quotes : DEFAULT_CTA_QUOTES
    quote.value = quotes[Math.floor(Math.random() * quotes.length)]
  } catch {
    quote.value = DEFAULT_CTA_QUOTES[Math.floor(Math.random() * DEFAULT_CTA_QUOTES.length)]
  }
})
</script>
