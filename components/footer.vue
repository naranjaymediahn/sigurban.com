<template>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-about">
          <div class="footer-logo">
            <img src="/images/logo-sigurban-white.svg" alt="Sig-Urban" />
            <span class="logo-word">
              <strong>SIG-URBAN</strong>
              <small>Innovación y certificación</small>
            </span>
          </div>
          <p>Desarrollamos proyectos residenciales urbanizados con calidad, confianza y respaldo en Siguatepeque, Honduras.</p>
          <div class="footer-social">
            <a href="https://www.facebook.com/SigUrban/" target="_blank" rel="noopener" aria-label="Facebook"><Icon name="facebook" :size="16" /></a>
            <a href="https://www.instagram.com/sigurban/" target="_blank" rel="noopener" aria-label="Instagram"><Icon name="instagram" :size="16" /></a>
            <a :href="`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y quisiera información sobre Sig-Urban 😊')}`" target="_blank" rel="noopener" aria-label="WhatsApp"><Icon name="whatsapp" :size="16" /></a>
          </div>
        </div>

        <div>
          <h4>Proyectos</h4>
          <ul>
            <li v-for="p in proyectos" :key="p.id"><NuxtLink :to="`/proyectos/${p.slug}`">{{ p.name_es }}</NuxtLink></li>
            <li v-if="!proyectos.length"><NuxtLink to="/proyectos">Ver proyectos</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h4>Modelos de casas</h4>
          <ul>
            <li v-for="m in modelos" :key="m.id"><NuxtLink :to="`/modelos-de-casa/${m.slug}`">{{ m.name_es }}</NuxtLink></li>
            <li v-if="!modelos.length"><NuxtLink to="/modelos-de-casa">Ver modelos</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h4>Contacto</h4>
          <ul class="footer-contact">
            <li><Icon name="mapPin" :size="14" /> Barrio el Centro, Edificio Baires Palomo, Siguatepeque, Comayagua</li>
            <li><Icon name="whatsapp" :size="14" /> WhatsApp: +504 3173-1754</li>
            <li><Icon name="phoneCall" :size="14" /> Teléfono: +504 2773-5376</li>
            <li><Icon name="email" :size="14" /> info@sigurban.com</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        © {{ year }} SIG-URBAN. Todos los derechos reservados.
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const year = new Date().getFullYear()
const proyectos = ref([])
const modelos = ref([])
const waNumber = ref('50431731754')

onMounted(async () => {
  try {
    const [p, m, info] = await Promise.all([$fetch('/api/products'), $fetch('/api/slider-products'), $fetch('/api/site-info')])
    proyectos.value = (p.data || []).slice(0, 4)
    modelos.value = (m.data || []).slice(0, 4)
    waNumber.value = info.data?.whatsapp_number || '50431731754'
  } catch {}
})
</script>
