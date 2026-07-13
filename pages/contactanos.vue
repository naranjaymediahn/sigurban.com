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
                <label>¿En qué te podemos ayudar? (podés marcar varias)</label>
                <div class="check-group">
                  <label class="check-item"><input type="checkbox" value="Quiero aplicar a una casa" v-model="form.reasons" /> Quiero aplicar a una casa</label>
                  <label class="check-item"><input type="checkbox" value="Tengo una consulta general" v-model="form.reasons" /> Tengo una consulta general</label>
                  <label class="check-item"><input type="checkbox" value="Prefiero que me contacten por WhatsApp" v-model="form.reasons" /> Prefiero que me contacten por WhatsApp</label>
                </div>
              </div>
              <div class="calc-row">
                <label>Nombre completo</label>
                <input v-model="form.name" type="text" required placeholder="Ej. María González" />
              </div>
              <div class="calc-row">
                <label>Teléfono</label>
                <input v-model="form.phone" type="text" required placeholder="9999-9999" />
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
            <p v-if="openFaq === i" class="faq-answer">{{ item.a }}</p>
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

const form = ref({ reasons: [], name: '', phone: '', email: '', message: '' })
const sending = ref(false)
const sent = ref(false)
const errorMsg = ref('')
const faq = ref([])
const openFaq = ref(-1)

async function submit() {
  sending.value = true
  errorMsg.value = ''
  try {
    await $fetch('/api/submit', {
      method: 'POST',
      body: {
        type: 'contactanos',
        fields: {
          Nombre: form.value.name,
          Teléfono: form.value.phone,
          Email: form.value.email,
          Asunto: form.value.reasons.join(', ') || 'Consulta general',
          Mensaje: form.value.message,
        },
      },
    })
    sent.value = true
    form.value = { reasons: [], name: '', phone: '', email: '', message: '' }
  } catch {
    errorMsg.value = 'No pudimos enviar tu mensaje. Escribinos por WhatsApp mejor.'
  } finally {
    sending.value = false
  }
}

useHead({ title: 'Contáctanos | Sig-Urban' })

onMounted(async () => {
  try {
    const [info, kb] = await Promise.all([
      $fetch('/api/site-info'),
      $fetch('/landings/facebook/sigurban-data.json'),
    ])
    waNumber.value = info.data?.whatsapp_number || '50431731754'
    faq.value = Array.isArray(kb?.faq) ? kb.faq.sort((a, b) => (b.priority || 0) - (a.priority || 0)) : []
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
.faq-list { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
.faq-item { background: #fff; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.faq-question { width: 100%; text-align: left; padding: 14px 16px; background: none; border: none; font-size: 14.5px; font-weight: 600; color: var(--text); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.faq-answer { padding: 0 16px 16px; font-size: 13.5px; color: var(--muted); line-height: 1.6; }
</style>
