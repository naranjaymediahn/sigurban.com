<template>
  <div>
    <Menu />

    <section class="hero">
      <div class="container">
        <div class="hero-copy">
          <h1>Encuentra el <span class="accent">hogar ideal</span> para tu familia</h1>
          <p class="lead">Desarrollamos proyectos residenciales urbanizados con calidad, confianza y respaldo en Siguatepeque, Honduras.</p>
          <div class="hero-actions">
            <NuxtLink to="/proyectos" class="btn btn-primary">Ver proyectos <Icon name="arrowRight" :size="16" /></NuxtLink>
            <a class="btn btn-outline" style="background:transparent;border-color:#fff;color:#fff;" :href="waHref"><Icon name="chat" :size="16" /> Hablar con un asesor</a>
          </div>
          <div class="hero-badges">
            <div><Icon name="building" :size="16" /> Proyectos urbanizados</div>
            <div><Icon name="bank" :size="16" /> Financiamiento disponible</div>
            <div><Icon name="users" :size="16" /> Acompañamiento personalizado</div>
          </div>
        </div>
        <div class="hero-image">
          <img src="/landings/facebook/assets/img/Renders_30.png" alt="Casa modelo Sig-Urban" />
        </div>
      </div>
    </section>

    <div class="container">
      <div class="stats-bar">
        <div class="stat-item"><div class="icon"><Icon name="award" :size="20" /></div><div><strong>+20 años</strong><span>de experiencia</span></div></div>
        <div class="stat-item"><div class="icon"><Icon name="home" :size="20" /></div><div><strong>{{ proyectos.length || 4 }} proyectos</strong><span>residenciales</span></div></div>
        <div class="stat-item"><div class="icon"><Icon name="users" :size="20" /></div><div><strong>Atención</strong><span>personalizada</span></div></div>
        <div class="stat-item"><div class="icon"><Icon name="bank" :size="20" /></div><div><strong>Financiamiento</strong><span>con bancos aliados</span></div></div>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="section-eyebrow">Proyectos destacados</span>
            <h2>Comunidades diseñadas para tu tranquilidad y bienestar</h2>
          </div>
          <NuxtLink to="/proyectos" class="btn btn-outline btn-sm">Ver todos los proyectos</NuxtLink>
        </div>
        <div class="cards-grid">
          <NuxtLink v-for="p in proyectos" :key="p.id" :to="`/proyectos/${p.slug}`" class="card">
            <div class="card-media">
              <img :src="p.image" :alt="p.name_es" @error="onImgError" />
              <span class="card-badge" :class="{ soon: p.badge_es !== 'Disponible' }">{{ p.badge_es || 'Disponible' }}</span>
            </div>
            <div class="card-body">
              <h3>{{ p.name_es }}</h3>
              <div class="card-location"><Icon name="mapPin" :size="13" /> {{ p.location_es }}</div>
              <p class="desc">{{ p.description_es }}</p>
              <span class="btn-link">Conocer proyecto →</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="section section-soft">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="section-eyebrow">Modelos de casas</span>
            <h2>Diseños modernos pensados para tu estilo de vida</h2>
          </div>
          <NuxtLink to="/modelos-de-casa" class="btn btn-outline btn-sm">Ver todos los modelos</NuxtLink>
        </div>
        <div class="cards-grid">
          <NuxtLink v-for="m in modelos" :key="m.id" :to="`/modelos-de-casa/${m.slug}`" class="card">
            <div class="card-media">
              <img :src="m.image" :alt="m.name_es" @error="onImgError" />
            </div>
            <div class="card-body">
              <h3>{{ m.name_es }}</h3>
              <div class="card-specs">
                <span><Icon name="ruler" :size="13" /> {{ m.format_es }}</span>
                <span><Icon name="bed" :size="13" /> {{ m.shelf_life_es }}</span>
                <span><Icon name="bath" :size="13" /> {{ m.store_temp }}</span>
              </div>
              <span class="btn-link">Ver modelo →</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="finance-strip">
          <div class="finance-copy">
            <h2>Te ayudamos con tu financiamiento</h2>
            <p style="color:#dbe8f0;margin-top:8px;">Contamos con alianzas con instituciones financieras para que hacer realidad tu casa sea más fácil.</p>
            <ul>
              <li><span class="dot"><Icon name="check" :size="12" /></span> Tasas competitivas</li>
              <li><span class="dot"><Icon name="check" :size="12" /></span> Trámites sencillos</li>
              <li><span class="dot"><Icon name="check" :size="12" /></span> Asesoría gratuita</li>
            </ul>
          </div>

          <div class="calc-card">
            <div class="calc-row">
              <label>Precio de la vivienda (L)</label>
              <input v-model.number="calc.price" type="number" min="0" step="10000" />
            </div>
            <div class="calc-row">
              <label>Prima inicial (%)</label>
              <input v-model.number="calc.downPct" type="number" min="0" max="100" />
            </div>
            <div class="calc-row">
              <label>Plazo del crédito</label>
              <select v-model.number="calc.years">
                <option :value="15">15 años</option>
                <option :value="20">20 años</option>
                <option :value="25">25 años</option>
                <option :value="30">30 años</option>
              </select>
            </div>
            <div class="calc-result">
              <span>Cuota mensual estimada</span>
              <strong>L. {{ monthlyPayment.toLocaleString('es-HN', { maximumFractionDigits: 0 }) }}</strong>
              <span>*Cálculo referencial. Sujeto a evaluación.</span>
            </div>
            <a :href="waHref" target="_blank" rel="noopener" class="btn btn-primary" style="width:100%;">Agendar mi cuota <Icon name="calendar" :size="16" /></a>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-soft">
      <div class="container">
        <div class="section-head" style="justify-content:center;text-align:center;flex-direction:column;">
          <span class="section-eyebrow">¿Por qué Sig-Urban?</span>
          <h2>Vivir en un proyecto Sig-Urban es elegir calidad de vida</h2>
        </div>
        <div class="value-grid">
          <div class="value-item"><div class="icon"><Icon name="shield" :size="20" /></div><strong>Entornos seguros</strong><span>Accesos controlados y vigilancia 24/7.</span></div>
          <div class="value-item"><div class="icon"><Icon name="tree" :size="20" /></div><strong>Áreas verdes</strong><span>Espacios para disfrutar en familia.</span></div>
          <div class="value-item"><div class="icon"><Icon name="droplet" :size="20" /></div><strong>Servicios completos</strong><span>Agua, energía y calles de calidad.</span></div>
          <div class="value-item"><div class="icon"><Icon name="trendingUp" :size="20" /></div><strong>Alta plusvalía</strong><span>Inversión segura para tu futuro.</span></div>
          <div class="value-item"><div class="icon"><Icon name="users" :size="20" /></div><strong>Comunidad familiar</strong><span>Vecinos y ambiente familiar.</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head" style="flex-direction:column;text-align:center;">
          <span class="section-eyebrow">Testimonios</span>
          <h2>Lo que dicen nuestras familias</h2>
        </div>
        <div class="testi-grid">
          <div class="testi-card">
            <span class="quote-mark">&ldquo;</span>
            <p class="quote">Encontramos el hogar perfecto para nuestra familia. El proceso fue fácil y siempre nos acompañaron.</p>
            <div class="testi-person"><div class="avatar">MJ</div><div><strong>María y José</strong><span>Colonia Las Teresas</span></div></div>
          </div>
          <div class="testi-card">
            <span class="quote-mark">&ldquo;</span>
            <p class="quote">Excelente atención y proyectos de calidad. Nuestra inversión fue la mejor decisión.</p>
            <div class="testi-person"><div class="avatar">CM</div><div><strong>Carlos Martínez</strong><span>Hacienda Real</span></div></div>
          </div>
          <div class="testi-card">
            <span class="quote-mark">&ldquo;</span>
            <p class="quote">La tranquilidad y seguridad que buscábamos para nuestros hijos.</p>
            <div class="testi-person"><div class="avatar">FR</div><div><strong>Familia Ramírez</strong><span>Colonia El Circilar</span></div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-soft" v-if="posts.length">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="section-eyebrow">Blog</span>
            <h2>Guías y consejos para ti</h2>
          </div>
          <NuxtLink to="/blog" class="btn btn-outline btn-sm">Ver todas las guías</NuxtLink>
        </div>
        <div class="cards-grid">
          <NuxtLink v-for="post in posts" :key="post.id" :to="buildPostUrl(post, permalinkMode)" class="card blog-card">
            <div class="card-media">
              <img :src="post.image" :alt="post.title_es" @error="onImgError" />
              <span class="blog-tag">{{ post.category }}</span>
            </div>
            <div class="card-body">
              <span class="blog-date">{{ formatDate(post.created_at) }}</span>
              <h3>{{ post.title_es }}</h3>
              <p class="desc">{{ post.excerpt_es }}</p>
              <span class="btn-link">Leer más →</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="cta-banner">
          <div>
            <h3>Agenda tu visita hoy</h3>
            <p>Conocé nuestros proyectos y encontrá el hogar ideal para tu familia.</p>
          </div>
          <a :href="waHref" target="_blank" rel="noopener" class="btn btn-primary">Agendar visita <Icon name="calendar" :size="16" /></a>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const proyectos = ref([])
const modelos = ref([])
const posts = ref([])
const waNumber = ref('50431731754')
const permalinkMode = ref('date')

const calc = ref({ price: 1200000, downPct: 20, years: 20 })

const waHref = computed(() =>
  `https://api.whatsapp.com/send?phone=${waNumber.value}&text=${encodeURIComponent('¡Hola! 👋🏡 Vi esto en Redes sociales y quisiera información sobre Sig-Urban 😊')}`
)

const monthlyPayment = computed(() => {
  const rate = 0.06 / 12
  const principal = calc.value.price * (1 - calc.value.downPct / 100)
  const n = calc.value.years * 12
  if (principal <= 0 || n <= 0) return 0
  const payment = (principal * rate) / (1 - Math.pow(1 + rate, -n))
  return Math.round(payment)
})

function onImgError(e) {
  e.target.src = '/images/bg_gradiente.svg'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const HOME_DESCRIPTION = 'Sig-Urban: desarrolladora inmobiliaria en Siguatepeque, Honduras. Proyectos residenciales urbanizados con financiamiento y acompañamiento personalizado para encontrar tu hogar ideal.'

useHead({
  title: 'Sig-Urban | Proyectos residenciales en Siguatepeque',
  meta: [
    { name: 'description', content: HOME_DESCRIPTION },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Sig-Urban' },
    { property: 'og:title', content: 'Sig-Urban | Proyectos residenciales en Siguatepeque' },
    { property: 'og:description', content: HOME_DESCRIPTION },
    { property: 'og:image', content: 'https://www.sigurban.com/images/sigurban-2.svg' },
    { property: 'og:url', content: 'https://www.sigurban.com/' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Sig-Urban | Proyectos residenciales en Siguatepeque' },
    { name: 'twitter:description', content: HOME_DESCRIPTION },
  ],
})

onMounted(async () => {
  try {
    const [p, m, b, info] = await Promise.all([
      $fetch('/api/products'),
      $fetch('/api/slider-products'),
      $fetch('/api/blog'),
      $fetch('/api/site-info'),
    ])
    proyectos.value = p.data || []
    modelos.value = (m.data || []).slice(0, 4)
    posts.value = (b.data || []).filter((post) => Number(post.published) === 1).slice(0, 4)
    waNumber.value = info.data?.whatsapp_number || '50431731754'
    permalinkMode.value = info.data?.blog_permalink_mode || 'date'
  } catch {}
})
</script>
