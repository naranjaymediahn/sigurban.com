<template>
  <i class="bi" :class="cls" :style="{ fontSize: size + 'px' }" aria-hidden="true" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
})

// Mapa de nombres semánticos usados en el sitio -> clase de Bootstrap Icons
const MAP = {
  home: 'bi-house-door',
  building: 'bi-buildings',
  houseModel: 'bi-house-heart',
  users: 'bi-people',
  target: 'bi-bullseye',
  compass: 'bi-compass',
  handshake: 'bi-hand-thumbs-up',
  newspaper: 'bi-newspaper',
  email: 'bi-envelope',
  phoneCall: 'bi-telephone',
  whatsapp: 'bi-whatsapp',
  mapPin: 'bi-geo-alt',
  check: 'bi-check-lg',
  checkCircle: 'bi-check-circle',
  search: 'bi-search',
  chevronRight: 'bi-chevron-right',
  arrowRight: 'bi-arrow-right',
  send: 'bi-send',
  bed: 'bi-moon-stars',
  bath: 'bi-droplet-half',
  car: 'bi-car-front',
  ruler: 'bi-rulers',
  shield: 'bi-shield-check',
  tree: 'bi-tree',
  droplet: 'bi-droplet',
  trendingUp: 'bi-graph-up-arrow',
  award: 'bi-award',
  bank: 'bi-bank',
  calendar: 'bi-calendar-check',
  close: 'bi-x-lg',
  menu: 'bi-list',
  chat: 'bi-chat-dots',
  instagram: 'bi-instagram',
  facebook: 'bi-facebook',
  youtube: 'bi-youtube',
  play: 'bi-play-circle-fill',
  photo: 'bi-images',
}

const cls = computed(() => MAP[props.name] || 'bi-circle')
</script>

<style scoped>
i.bi { line-height: 1; display: inline-flex; }
</style>
