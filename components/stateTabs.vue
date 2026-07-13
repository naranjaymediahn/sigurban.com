<template>
  <div class="custom-tabs">
    <el-tabs v-model="activeTab" type="card" @tab-change="handleChange">
      <el-tab-pane
        v-for="state in states"
        :key="state.name"
        :label="state.name"
        :name="state.name"
      />
    </el-tabs>

    <Transition name="tab-flash" mode="out-in">
      <div :key="activeTab" class="tab-content">
        <div class="logo-scroll-container">
          <div class="logo-scroll">
            <div v-for="logo in activeLogos" :key="logo.id" class="logo-item">
              <img :src="logo.src" :alt="logo.name" class="logo-image">
              <p class="logo-name">{{ logo.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('FLORIDA')

const flLogos = [
  { id: 1,  name: 'Agave Foods',           src: '/images/stores/fl/Agave-foods.png' },
  { id: 2,  name: 'Bodegón Supermarket',   src: '/images/stores/fl/bodegon-supermarket.png' },
  { id: 3,  name: 'Bravo',                 src: '/images/stores/fl/bravo.png' },
  { id: 4,  name: 'C-Town Supermarket',    src: '/images/stores/fl/c-town-supermarket.png' },
  { id: 5,  name: 'Compare Foods',         src: '/images/stores/fl/compare-foods.png' },
  { id: 6,  name: 'Festival Supermarket',  src: '/images/stores/fl/festival-supermarkey.png' },
  { id: 7,  name: 'Fine Fare Supermarket', src: '/images/stores/fl/fine-fare-supermarlet.png' },
  { id: 8,  name: 'Food Bazar',            src: '/images/stores/fl/food-bazar.png' },
  { id: 9,  name: 'Food Town',             src: '/images/stores/fl/food-town.png' },
  { id: 10, name: 'Gala Fresh',            src: '/images/stores/fl/gala-fresh.png' },
  { id: 11, name: 'Green Valley',          src: '/images/stores/fl/Green-valley.png' },
  { id: 12, name: 'Key Food',              src: '/images/stores/fl/key-food.png' },
  { id: 13, name: 'Market Fresh',          src: '/images/stores/fl/market-fresh.png' },
  { id: 14, name: 'Maxx Food',             src: '/images/stores/fl/maxx-food-supermarket.png' },
  { id: 15, name: 'Presidente',            src: '/images/stores/fl/presidente-supermarket.png' },
  { id: 16, name: 'Price Choice',          src: '/images/stores/fl/pricechoice-supermarket.png' },
  { id: 17, name: "Sedano's",              src: '/images/stores/fl/sedanos.png' },
  { id: 18, name: 'Taparia Supermarket',   src: '/images/stores/fl/taparia-supermarket.png' },
]

const nyLogos = [
  { id: 1,  name: 'Agave Foods',           src: '/images/stores/ny/Agave-foods.png' },
  { id: 2,  name: 'Bodegón Supermarket',   src: '/images/stores/ny/bodegon-supermarket.png' },
  { id: 3,  name: 'Bravo',                 src: '/images/stores/ny/bravo.png' },
  { id: 4,  name: 'C-Town Supermarket',    src: '/images/stores/ny/c-town-supermarket.png' },
  { id: 5,  name: 'Compare Foods',         src: '/images/stores/ny/compare-foods.png' },
  { id: 6,  name: 'Festival Supermarket',  src: '/images/stores/ny/festival-supermarkey.png' },
  { id: 7,  name: 'Fine Fare Supermarket', src: '/images/stores/ny/fine-fare-supermarlet.png' },
  { id: 8,  name: 'Food Bazar',            src: '/images/stores/ny/food-bazar.png' },
  { id: 9,  name: 'Food Town',             src: '/images/stores/ny/food-town.png' },
  { id: 10, name: 'Gala Fresh',            src: '/images/stores/ny/gala-fresh.png' },
  { id: 11, name: 'Green Valley',          src: '/images/stores/ny/Green-valley.png' },
  { id: 12, name: 'Key Food',              src: '/images/stores/ny/key-food.png' },
  { id: 13, name: 'Market Fresh',          src: '/images/stores/ny/market-fresh.png' },
  { id: 14, name: 'Maxx Food',             src: '/images/stores/ny/maxx-food-supermarket.png' },
  { id: 15, name: 'Presidente',            src: '/images/stores/ny/presidente-supermarket.png' },
  { id: 16, name: 'Price Choice',          src: '/images/stores/ny/pricechoice-supermarket.png' },
  { id: 17, name: "Sedano's",              src: '/images/stores/ny/sedanos.png' },
  { id: 18, name: 'Taparia Supermarket',   src: '/images/stores/ny/taparia-supermarket.png' },
]

const georgiaLogos = [
  { id: 1, name: 'Talpa', src: '/images/stores/georgia/Sula-USA-georgia-POS-talpa.png' },
]

const houstonLogos = [
  { id: 1, name: 'El Rancho',        src: '/images/stores/houston/Sula-USA-houston-POS-el-rancho.png' },
  { id: 2, name: 'HEB',              src: '/images/stores/houston/Sula-USA-houston-POS-HEB.png' },
  { id: 3, name: 'La Michoacana',    src: '/images/stores/houston/Sula-USA-houston-POS-la-michoacana.png' },
]

const marylandLogos = [
  { id: 1, name: 'Megamart',  src: '/images/stores/maryland/Sula-USA-maryland-POS-megamart.png' },
  { id: 2, name: 'Savemart',  src: '/images/stores/maryland/Sula-USA-maryland-POS-savemart.png' },
]

const northCarolinaLogos = [
  { id: 1, name: 'Compare Foods', src: '/images/stores/north-carolina/Sula-USA-NCarolina-POS-compare-foods.png' },
  { id: 2, name: 'Wow Super',     src: '/images/stores/north-carolina/Sula-USA-NCarolina-POS-wow-super.png' },
]

const states = [
  { name: 'FLORIDA',     logos: flLogos },
  { name: 'NEW YORK',    logos: nyLogos },
  { name: 'GEORGIA',     logos: georgiaLogos },
  { name: 'HOUSTON',     logos: houstonLogos },
  { name: 'MARYLAND',    logos: marylandLogos },
  { name: 'N. CAROLINA', logos: northCarolinaLogos },

  // Próximamente — pendiente de información:
  // { name: 'TENNESSE', logos: [] },
  // { name: 'TEXAS', logos: [] },
  // { name: 'LOUSIANA', logos: [] },
]

const activeLogos = computed(() => {
  const state = states.find(s => s.name === activeTab.value)
  return (state?.logos ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, 'es'))
})

const handleChange = (name) => {
  activeTab.value = name
}
</script>

<style scoped>
.custom-tabs :deep(.el-tabs__item) {
  color: #999;
  background-color: #f5f5f5;
  border: none;
  margin-right: 5px;
  padding: 10px 20px;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  color: #fff;
  background-color: #78af2b;
  font-weight: 900;
}

.custom-tabs :deep(.el-tabs__nav-wrap) {
  padding-left: 20px;
  font-weight: 900;
}

.custom-tabs :deep(.el-tabs__header) {
  border-bottom: none;
  font-weight: 900;
}

.custom-tabs :deep(.el-tabs__nav) {
  border: none;
  font-weight: 900;
}

.tab-content {
  padding: 20px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 0 4px 4px 4px;
  font-weight: 900;
}

/* ── Transición al cambiar de tab ────────────────────────────── */
.tab-flash-enter-active {
  animation: flashIn 0.35s ease;
}
.tab-flash-leave-active {
  animation: flashOut 0.18s ease;
}

@keyframes flashIn {
  0%   { opacity: 0; transform: translateY(6px); background-color: #d4edaa; }
  40%  { background-color: #eaf5d3; }
  100% { opacity: 1; transform: translateY(0); background-color: #fff; }
}

@keyframes flashOut {
  0%   { opacity: 1; }
  100% { opacity: 0; transform: translateY(-4px); }
}

/* ── Scroll de logos ─────────────────────────────────────────── */
.logo-scroll-container {
  height: 300px;
  overflow: hidden;
}

.logo-scroll {
  display: flex;
  overflow-x: auto;
  padding-bottom: 20px;
  height: 100%;
}

.logo-item {
  flex: 0 0 auto;
  width: 200px;
  margin-right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo-image {
  width: auto;
  height: 150px;
  padding: 10px;
  object-fit: contain;
  margin-bottom: 10px;
}

.logo-name {
  font-size: 14px;
  color: #333;
  text-align: center;
}

.logo-scroll::-webkit-scrollbar { height: 8px; }
.logo-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
.logo-scroll::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
.logo-scroll::-webkit-scrollbar-thumb:hover { background: #555; }
</style>
