<template>
  <div>
    <Menu />

    <section class="page-hero">
      <div class="container">
        <div class="breadcrumb">
          <NuxtLink to="/">Inicio</NuxtLink> / Nosotros
        </div>
        <h1>Quiénes somos</h1>
        <p>Desarrolladora inmobiliaria en Siguatepeque, Honduras, especializada en viviendas y terrenos urbanizados con
          acompañamiento financiero.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="detail-grid">
          <div>
            <h2 style="color:var(--azul);font-size:26px;">Nuestra historia</h2>
            <p style="margin-top:12px;color:var(--muted);line-height:1.7;">
              Sig-Urban es una desarrolladora inmobiliaria con <strong style="color:var(--text);">más de 20 años de experiencia</strong> construyendo sueños de
              familias hondureñas.
              Facilitamos el acceso a un hogar digno con apoyo financiero y acompañamiento humano durante todo el
              proceso, desde la
              precalificación hasta la entrega de tu vivienda.
            </p>
            <p style="margin-top:12px;color:var(--muted);line-height:1.7;">
              Nuestra meta <strong style="color:var(--text);">2026–2027</strong> es acompañar a <strong style="color:var(--text);">290 familias</strong> con atención cercana, beneficios financieros únicos y
              la confianza
              como base de cada proyecto. Si querés conocer más, podés <NuxtLink to="/contactanos" style="color:var(--azul);font-weight:700;text-decoration:underline;text-decoration-color:var(--verde);">escribirnos por el formulario de contacto</NuxtLink> o
              <a :href="waHref" target="_blank" rel="noopener" style="color:var(--azul);font-weight:700;text-decoration:underline;text-decoration-color:var(--verde);">hablar directo por WhatsApp</a>.
            </p>

            <div class="value-grid" style="grid-template-columns:repeat(2,1fr);margin-top:32px;">
              <div class="value-item" style="text-align:left;">
                <div class="icon">
                  <Icon name="target" :size="20" />
                </div>
                <strong>Misión</strong>
                <span>Facilitar el acceso a vivienda digna con acompañamiento financiero y humano en cada etapa.</span>
              </div>
              <div class="value-item" style="text-align:left;">
                <div class="icon">
                  <Icon name="compass" :size="20" />
                </div>
                <strong>Visión</strong>
                <span>Ser la desarrolladora de referencia en Siguatepeque por calidad, confianza y cercanía con nuestros
                  clientes.</span>
              </div>
              <div class="value-item" style="text-align:left;">
                <div class="icon">
                  <Icon name="handshake" :size="20" />
                </div>
                <strong>Confianza</strong>
                <span>Acompañamos el proceso y papeleo; la construcción avanza junto con tu aprobación bancaria.</span>
              </div>
              <div class="value-item" style="text-align:left;">
                <div class="icon">
                  <Icon name="building" :size="20" />
                </div>
                <strong>Comunidad</strong>
                <span>Proyectos planificados pensando en la seguridad y el bienestar de cada familia.</span>
              </div>
            </div>
          </div>

          <aside class="detail-sidebar">
            <h3 style="font-size:16px;color:var(--azul);">Ubicación</h3>
            <p style="font-size:13.5px;color:var(--muted);margin-top:8px;">
              <Icon name="mapPin" :size="13" />
              <a href="https://maps.app.goo.gl/gmM9sghU1TiGkmMX9" target="_blank" rel="noopener" style="color:var(--azul);font-weight:700;text-decoration:underline;text-decoration-color:var(--verde);">Barrio el Centro, Edificio Baires Palomo, Siguatepeque, Comayagua, Honduras</a>
            </p>
            <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;" />
            <p style="font-size:13.5px;color:var(--muted);">
              <Icon name="whatsapp" :size="13" />
              <a :href="waHref" target="_blank" rel="noopener" style="color:var(--azul);font-weight:700;text-decoration:underline;text-decoration-color:var(--verde);">WhatsApp: +504 3173-1754</a>
            </p>
            <p style="font-size:13.5px;color:var(--muted);margin-top:6px;">
              <Icon name="phoneCall" :size="13" />
              <a href="tel:+50427735376" style="color:var(--azul);font-weight:700;text-decoration:underline;text-decoration-color:var(--verde);">Oficina: +504 2773-5376</a>
            </p>
            <a class="btn btn-primary" style="width:100%;margin-top:16px;" :href="waHref" target="_blank"
              rel="noopener">
              <Icon name="whatsapp" :size="16" /> Hablar con un asesor
            </a>
          </aside>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const waNumber = ref('50431731754')
const waHref = computed(() => `https://api.whatsapp.com/send?phone=${waNumber.value}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y quisiera información sobre Sig-Urban 😊')}`)

const QUIENES_DESCRIPTION = 'Conocé a Sig-Urban: desarrolladora inmobiliaria en Siguatepeque, Honduras, con proyectos residenciales urbanizados y acompañamiento personalizado.'
const { data: seoInfo } = await useAsyncData('site-info-quienes', () => $fetch('/api/site-info'))
const ogImage = computed(() => seoInfo.value?.data?.og_image || 'https://www.sigurban.com/images/sigurban-2.svg')

useHead({
  title: 'Quiénes somos | Sig-Urban',
  meta: [
    { name: 'description', content: QUIENES_DESCRIPTION },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Sig-Urban' },
    { property: 'og:title', content: 'Quiénes somos | Sig-Urban' },
    { property: 'og:description', content: QUIENES_DESCRIPTION },
    { property: 'og:image', content: ogImage },
    { property: 'og:url', content: 'https://www.sigurban.com/quienes-somos' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Quiénes somos | Sig-Urban' },
    { name: 'twitter:description', content: QUIENES_DESCRIPTION },
    { name: 'twitter:image', content: ogImage },
  ],
})

onMounted(async () => {
  try {
    const info = await $fetch('/api/site-info')
    waNumber.value = info.data?.whatsapp_number || '50431731754'
  } catch { }
})
</script>
