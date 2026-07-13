<template>
  <div>
    <NuxtPage />
    <a
      v-if="waNumber"
      class="wa-float"
      :href="`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent('Hola, necesito información sobre Sig-Urban')}`"
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp"
    ><Icon name="whatsapp" :size="28" /></a>
    <ChatWidget />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ChatWidget from './components/ChatWidget.vue'

const config = useRuntimeConfig()
const waNumber = ref('')

if (config.public.GA_MEASUREMENT_ID) {
  useHead({
    script: [
      { src: `https://www.googletagmanager.com/gtag/js?id=${config.public.GA_MEASUREMENT_ID}`, async: true },
      {
        children: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${config.public.GA_MEASUREMENT_ID}');`,
      },
    ],
  })
}

onMounted(async () => {
  try {
    const res = await $fetch('/api/site-info')
    waNumber.value = res.data?.whatsapp_number || '50431731754'
  } catch {
    waNumber.value = '50431731754'
  }
})
</script>
