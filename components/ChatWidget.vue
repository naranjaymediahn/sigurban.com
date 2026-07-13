<template>
  <ClientOnly>
    <button class="chat-launcher" @click="toggle" :aria-label="open ? 'Cerrar chat' : 'Abrir chat con Julia'">
      <Icon v-if="!open" name="chat" :size="26" />
      <Icon v-else name="close" :size="24" />
    </button>

    <div v-if="open" class="chat-window">
      <div class="chat-header">
        <div class="chat-avatar">J</div>
        <div>
          <strong>Julia</strong>
          <span>Asesora digital de Sig-Urban</span>
        </div>
        <button class="chat-close" @click="toggle"><Icon name="close" :size="18" /></button>
      </div>

      <div class="chat-body" ref="bodyRef">
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="chat-msg"
          :class="m.role === 'user' ? 'user' : 'bot'"
          v-html="formatMessage(m.text)"
        />
        <div v-if="loading" class="chat-typing">Julia está escribiendo…</div>
      </div>

      <div v-if="!hasSentFirst" class="chat-quick">
        <button v-for="q in quickReplies" :key="q" @click="send(q)">{{ q }}</button>
      </div>

      <form class="chat-input" @submit.prevent="send()">
        <input v-model="draft" type="text" placeholder="Escribí tu mensaje..." :disabled="loading" />
        <button type="submit" :disabled="loading || !draft.trim()"><Icon name="send" :size="16" /></button>
      </form>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const STORAGE_KEY = 'sigurban_chat_state_v1'
const quickReplies = ['Precio y cuota', 'Requisitos', 'Ubicación', 'Quiero precalificar']

const open = ref(false)
const draft = ref('')
const loading = ref(false)
const bodyRef = ref(null)
const hasSentFirst = ref(false)

const senderId = ref('')
const session = ref({ hasGreeted: false, stage: 'info', lead: { name: '', dni: '', phone: '' }, collectingEnabled: false })
const messages = ref([])

function loadState() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    senderId.value = parsed.senderId || ''
    session.value = parsed.session || session.value
    messages.value = parsed.messages || []
    hasSentFirst.value = messages.value.length > 0
  } catch {}
}

function saveState() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    senderId: senderId.value,
    session: session.value,
    messages: messages.value,
  }))
}

function ensureSenderId() {
  if (senderId.value) return
  senderId.value = 'web_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp)(\?\S*)?$/i

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatMessage(text) {
  let safe = escapeHtml(String(text || ''))

  // Negrita **texto**
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // URLs -> imagen embebida o enlace clicable
  safe = safe.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    const clean = url.replace(/[.,;)]+$/, '')
    if (IMAGE_EXT_RE.test(clean)) {
      return `<a href="${clean}" target="_blank" rel="noopener"><img src="${clean}" alt="Imagen" class="chat-msg-image" /></a>`
    }
    return `<a href="${clean}" target="_blank" rel="noopener">${clean}</a>`
  })

  return safe.replace(/\n/g, '<br>')
}

async function scrollToBottom() {
  await nextTick()
  if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
}

function toggle() {
  open.value = !open.value
  if (open.value && messages.value.length === 0) {
    send('Hola')
  }
  scrollToBottom()
}

async function send(text) {
  const value = String(text ?? draft.value).trim()
  if (!value || loading.value) return
  ensureSenderId()
  hasSentFirst.value = true
  messages.value.push({ role: 'user', text: value })
  draft.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const res = await $fetch('/api/chat', {
      method: 'POST',
      body: {
        senderId: senderId.value,
        message: value,
        session: session.value,
        history: messages.value.slice(-12),
      },
    })
    session.value = res.session || session.value
    messages.value.push({ role: 'assistant', text: res.reply || '...' })
  } catch (err) {
    messages.value.push({ role: 'assistant', text: 'Tuve un problema de conexión 😔 Probá de nuevo en un momento.' })
  } finally {
    loading.value = false
    saveState()
    scrollToBottom()
  }
}

onMounted(() => {
  loadState()
  ensureSenderId()
})
</script>
