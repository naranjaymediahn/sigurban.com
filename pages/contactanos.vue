<template>
  <div>
    <Menu />

    <section class="page-hero">
      <div class="container">
        <div class="breadcrumb"><NuxtLink to="/">Inicio</NuxtLink> / Contáctanos</div>
        <h1>Contáctanos</h1>
        <p>Escribinos y una asesora te contacta para ayudarte con tu precalificación o resolver tu consulta.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="detail-grid">
          <div>
            <h2 style="color:var(--azul);font-size:24px;">Hablemos</h2>
            <p style="margin-top:10px;color:var(--muted);line-height:1.7;">
              Contanos qué necesitás y te ayudamos. También podés usar el chat de Julia, nuestra asesora digital,
              en la esquina inferior de la pantalla.
            </p>

            <form class="contact-form" @submit.prevent="submit">
              <div class="calc-row">
                <label>¿En qué te podemos ayudar?</label>
                <div class="check-group">
                  <label class="check-item"><input type="radio" name="reason" value="Quiero aplicar a una casa" v-model="form.reason" /> Quiero aplicar a una casa</label>
                  <label class="check-item"><input type="radio" name="reason" value="Tengo una consulta general" v-model="form.reason" /> Tengo una consulta general</label>
                  <label class="check-item"><input type="radio" name="reason" value="Prefiero que me contacten por WhatsApp" v-model="form.reason" /> Prefiero que me contacten por WhatsApp</label>
                </div>
              </div>

              <div class="calc-row">
                <label class="check-item" style="font-weight:600;">
                  <input type="checkbox" v-model="form.livesAbroad" /> Vivo en el extranjero 🌎
                </label>
              </div>

              <div v-if="form.livesAbroad" class="calc-row">
                <label>¿Desde dónde nos escribís?</label>
                <select v-model="form.country" class="country-select">
                  <option value="usa">🇺🇸 Estados Unidos</option>
                  <option value="espana">🇪🇸 España</option>
                  <option value="otro">🌎 Otro país</option>
                </select>
              </div>

              <div v-if="form.livesAbroad" class="abroad-note">
                <p v-if="form.country === 'usa'">
                  🇺🇸 Si vivís en USA y soñás con tu casa propia en Siguatepeque: si tenés <strong>TPS, residencia permanente o ciudadanía</strong>, podés aplicar directamente
                  (tus ingresos deben ser demostrables y se evalúan caso por caso). Si tu estatus es distinto, existe una alternativa: un familiar o persona de
                  confianza en Honduras puede tramitar el crédito y coordinar el pago con vos.
                </p>
                <p v-else-if="form.country === 'espana'">
                  🇪🇸 Si vivís en España y soñás con tu casa propia en Siguatepeque, es importante que sepas cómo funciona el proceso desde el exterior: por
                  reglamento bancario y de la CNBS, nuestros proyectos aplican para personas con residencia en Honduras. Existe una alternativa: un familiar o
                  persona de confianza acá puede tramitar el crédito y coordinar el pago con vos — una opción que usan varios de nuestros clientes en el exterior.
                </p>
                <p v-else>
                  🌎 Por reglamento bancario y de la CNBS, nuestros proyectos aplican para personas con residencia en Honduras. Aun así podés contactarnos:
                  te contamos la alternativa de tramitarlo con un familiar o persona de confianza acá.
                </p>
                <p style="margin-top:8px;">Si aun así querés aplicar, contactanos y con gusto te explicamos con detalle, de forma clara y sin compromiso. 😊</p>
              </div>

              <div class="calc-row">
                <label>Nombre completo</label>
                <input v-model="form.name" type="text" required placeholder="Ej. María González" />
              </div>

              <div v-if="wantsToApply && !form.livesAbroad" class="calc-row">
                <label>Número de identidad (DNI)</label>
                <input v-model="form.dni" type="text" required placeholder="0801-1990-12345" />
                <span class="field-hint">Nos ayuda a precalificar tu perfil más rápido.</span>
              </div>

              <div class="calc-row">
                <label>Teléfono {{ form.livesAbroad ? '(con código de área)' : '' }}</label>
                <input v-model="form.phone" type="text" required :placeholder="form.livesAbroad ? '+1 305 555 0100' : '9999-9999'" />
              </div>

              <div class="calc-row">
                <label>Correo (opcional)</label>
                <input v-model="form.email" type="email" placeholder="tucorreo@ejemplo.com" />
              </div>

              <div class="calc-row">
                <label>Mensaje</label>
                <textarea v-model="form.message" rows="4" placeholder="Contanos qué proyecto te interesa o tu consulta..." />
              </div>

              <button class="btn btn-primary" type="submit" :disabled="sending">{{ sending ? 'Enviando...' : 'Enviar mensaje' }}</button>
              <p v-if="sent" class="form-note ok">¡Gracias! En breve una asesora te contacta.</p>
              <p v-if="errorMsg" class="form-note err">{{ errorMsg }}</p>
            </form>
          </div>

          <aside class="detail-sidebar">
            <h3 style="font-size:16px;color:var(--azul);">Datos de contacto</h3>
            <p style="font-size:13.5px;color:var(--muted);margin-top:10px;">Barrio el Centro, Edificio Baires Palomo, Siguatepeque, Comayagua</p>
            <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;" />
            <p style="font-size:13.5px;color:var(--muted);">WhatsApp: +504 3173-1754</p>
            <p style="font-size:13.5px;color:var(--muted);margin-top:6px;">Teléfono: +504 2773-5376</p>
            <p style="font-size:13.5px;color:var(--muted);margin-top:6px;">info@sigurban.com</p>
            <a class="btn btn-primary" style="width:100%;margin-top:16px;" :href="waHref" target="_blank" rel="noopener">Escribir por WhatsApp</a>
          </aside>
        </div>
      </div>
    </section>

    <section class="section section-soft" v-if="faq.length">
      <div class="container">
        <div class="section-head" style="flex-direction:column;text-align:center;">
          <span class="section-eyebrow">Ayuda</span>
          <h2>Preguntas frecuentes</h2>
        </div>
        <div class="faq-list">
          <div v-for="(item, i) in faq" :key="item.id || i" class="faq-item" :class="{ open: openFaq === i }">
            <button class="faq-question" @click="openFaq = openFaq === i ? -1 : i">
              {{ item.q }}
              <Icon :name="openFaq === i ? 'close' : 'chevronRight'" :size="16" />
            </button>
            <p v-if="openFaq === i" class="faq-answer" v-html="formatFaqAnswer(item.a)" />
          </div>
        </div>
      </div>
    </section>

    <CtaBanner />

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const waNumber = ref('50431731754')
const waHref = computed(() => `https://api.whatsapp.com/send?phone=${waNumber.value}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y quisiera información sobre Sig-Urban 😊')}`)

// El texto del FAQ puede traer <a href="...">...</a> escrito a mano (desde /admin) o URLs
// sueltas — las URLs sueltas se convierten en enlaces clicables automáticamente.
function formatFaqAnswer(text) {
  const raw = String(text || '')
  if (/<a\s/i.test(raw)) return raw
  return raw.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    const clean = url.replace(/[.,;)]+$/, '')
    return `<a href="${clean}" target="_blank" rel="noopener">${clean}</a>`
  })
}

const form = ref({ reason: '', livesAbroad: false, country: 'usa', name: '', dni: '', phone: '', email: '', message: '' })
const sending = ref(false)
const sent = ref(false)
const errorMsg = ref('')
const faq = ref([])
const openFaq = ref(-1)

const wantsToApply = computed(() => form.value.reason === 'Quiero aplicar a una casa')

async function submit() {
  sending.value = true
  errorMsg.value = ''
  try {
    const countryLabel = { usa: 'Estados Unidos', espana: 'España', otro: 'Otro país' }[form.value.country]
    await $fetch('/api/submit', {
      method: 'POST',
      body: {
        type: 'contactanos',
        fields: {
          Nombre: form.value.name,
          DNI: form.value.dni,
          Teléfono: form.value.phone,
          Email: form.value.email,
          Estado: form.value.livesAbroad ? `Extranjero — ${countryLabel}` : 'Honduras',
          Asunto: form.value.reason || 'Consulta general',
          Mensaje: form.value.message,
        },
      },
    })
    sent.value = true
    form.value = { reason: '', livesAbroad: false, country: 'usa', name: '', dni: '', phone: '', email: '', message: '' }
  } catch {
    errorMsg.value = 'No pudimos enviar tu mensaje. Escribinos por WhatsApp mejor.'
  } finally {
    sending.value = false
  }
}

const CONTACTO_DESCRIPTION = 'Contactá a Sig-Urban: escribinos por WhatsApp o completá el formulario y un asesor te ayuda a encontrar tu casa ideal en Siguatepeque, Honduras.'
const { data: seoInfo } = await useAsyncData('site-info-contacto', () => $fetch('/api/site-info'))
const ogImage = computed(() => seoInfo.value?.data?.og_image || 'https://www.sigurban.com/images/sigurban-2.svg')

useHead({
  title: 'Contáctanos | Sig-Urban',
  meta: [
    { name: 'description', content: CONTACTO_DESCRIPTION },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Sig-Urban' },
    { property: 'og:title', content: 'Contáctanos | Sig-Urban' },
    { property: 'og:description', content: CONTACTO_DESCRIPTION },
    { property: 'og:image', content: ogImage },
    { property: 'og:url', content: 'https://www.sigurban.com/contactanos' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Contáctanos | Sig-Urban' },
    { name: 'twitter:description', content: CONTACTO_DESCRIPTION },
    { name: 'twitter:image', content: ogImage },
  ],
})

onMounted(async () => {
  try {
    const [info, faqRes] = await Promise.all([
      $fetch('/api/site-info'),
      $fetch('/api/faq'),
    ])
    waNumber.value = info.data?.whatsapp_number || '50431731754'
    faq.value = faqRes.data || []
  } catch {}
})
</script>

<style scoped>
.contact-form { margin-top: 22px; display: flex; flex-direction: column; gap: 4px; max-width: 460px; }
.form-note { font-size: 13px; margin-top: 10px; }
.form-note.ok { color: var(--verde-dark); }
.form-note.err { color: #c0392b; }
textarea { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); font-family: inherit; font-size: 14px; background: var(--bg-soft); resize: vertical; }
.check-group { display: flex; flex-direction: column; gap: 8px; }
.check-item { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--text); font-weight: 400; }
.check-item input { width: 16px; height: 16px; accent-color: var(--azul); }
.country-select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); font-family: inherit; font-size: 14px; background: var(--bg-soft); }
.field-hint { font-size: 11.5px; color: var(--muted); margin-top: 4px; display: block; }
.abroad-note { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; font-size: 13px; color: var(--muted); line-height: 1.6; margin-bottom: 6px; }
.faq-list { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
.faq-item { background: #fff; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.faq-question { width: 100%; text-align: left; padding: 14px 16px; background: none; border: none; font-size: 14.5px; font-weight: 600; color: var(--text); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.faq-answer { padding: 0 16px 16px; font-size: 13.5px; color: var(--muted); line-height: 1.6; }
</style>
