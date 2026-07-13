// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      title: 'Sig-Urban | Proyectos residenciales en Siguatepeque',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content: 'Sig-Urban: proyectos residenciales urbanizados en Siguatepeque, Honduras. Encuentra tu hogar ideal con financiamiento y acompañamiento personalizado.'
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'icon', type: 'image/svg+xml', href: '/images/sigurban-2.svg' },
        { rel: 'stylesheet', href: '/css/normalize.css' },
        { rel: 'stylesheet', href: '/css/sigurban.css' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap'
        },
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css'
        }
      ]
    }
  },

  devtools: { enabled: false },

  nitro: {
    preset: 'vercel',
    externals: {
      external: ['sharp'],
    },
  },

  runtimeConfig: {
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_PORT: process.env.MYSQL_PORT || '3306',
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASS: process.env.MYSQL_PASS,
    MYSQL_DB:   process.env.MYSQL_DB,
    SMTP_HOST:      process.env.SMTP_HOST,
    SMTP_PORT:      process.env.SMTP_PORT || '465',
    SMTP_USER:      process.env.SMTP_USER,
    SMTP_PASS:      process.env.SMTP_PASS,
    SMTP_TO:        process.env.SMTP_TO,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'Sig-Urban Web',
    STORAGE_API_URL:  process.env.STORAGE_API_URL  || '',
    STORAGE_API_KEY:  process.env.STORAGE_API_KEY  || '',
    STORAGE_BASE_URL: process.env.STORAGE_BASE_URL || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL:   process.env.OPENAI_MODEL || 'gpt-4o-mini',
    CRM_LEAD_ENDPOINT: process.env.CRM_LEAD_ENDPOINT || 'https://api.crm.sigurban.com/api/leads/chatbot',
    CRM_LEAD_TOKEN:    process.env.CRM_LEAD_TOKEN || '',
    N8N_LEAD_WEBHOOK_URL: process.env.N8N_LEAD_WEBHOOK_URL || '',
    public: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || '',
    },
  }
})
