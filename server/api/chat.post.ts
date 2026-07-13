import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { query } from '../utils/db'
import { getSiteSettings } from '../utils/siteSettings'
import {
  extractDni, extractPhone, extractName, detectCountryFlags, detectTimeOfDay,
  wantsPrequalify, stopPrequalify, consentYes, consentNo, wantsHandoff, maskDni,
  type ChatSession,
} from '../utils/chatEngine'

let kbCache: { data: any, loadedAt: number } | null = null

async function loadKnowledgeBase() {
  if (kbCache && Date.now() - kbCache.loadedAt < 5 * 60 * 1000) return kbCache.data
  try {
    const filePath = path.join(process.cwd(), 'public', 'landings', 'facebook', 'sigurban-data.json')
    const raw = await readFile(filePath, 'utf8')
    const data = JSON.parse(raw)
    kbCache = { data, loadedAt: Date.now() }
    return data
  } catch {
    return {}
  }
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userContent: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.6,
    }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 300)}`)
  }
  const json = await res.json()
  return String(json?.choices?.[0]?.message?.content || '').trim()
}

async function sendLeadToCrm(settings: any, lead: { name: string, dni: string, phone: string }) {
  const config = useRuntimeConfig()
  const url = settings.n8n_lead_webhook_url || settings.crm_lead_endpoint || config.CRM_LEAD_ENDPOINT
  if (!url) return { ok: false, message: 'No hay endpoint configurado para enviar el lead.' }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!settings.n8n_lead_webhook_url && config.CRM_LEAD_TOKEN) {
    headers.Authorization = `Bearer ${config.CRM_LEAD_TOKEN}`
  }

  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(lead) })
    const text = await res.text().catch(() => '')
    let body: any = null
    try { body = JSON.parse(text) } catch { body = null }

    const message = String(body?.message || '').toLowerCase()
    const duplicate = message.includes('ya existe un prospecto') || message.includes('duplicad') ||
      (message.includes('dni') && message.includes('existe'))

    if (res.ok || duplicate) {
      return { ok: true, duplicate, status: res.status }
    }
    return { ok: false, status: res.status, message: body?.message || `HTTP ${res.status}` }
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error de conexión con el CRM' }
  }
}

async function persistBestEffort(senderId: string, session: ChatSession, userText: string, botReply: string) {
  try {
    await query(
      `INSERT INTO sigurban_chat_sessions
        (sender_id, has_greeted, stage, lead_name, lead_dni, lead_phone, last_seen_ms, last_user_text, last_bot_reply)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE has_greeted=VALUES(has_greeted), stage=VALUES(stage), lead_name=VALUES(lead_name),
        lead_dni=VALUES(lead_dni), lead_phone=VALUES(lead_phone), last_seen_ms=VALUES(last_seen_ms),
        last_user_text=VALUES(last_user_text), last_bot_reply=VALUES(last_bot_reply)`,
      [senderId, session.hasGreeted ? 1 : 0, session.stage, session.lead.name, session.lead.dni, session.lead.phone, Date.now(), userText, botReply]
    )
    await query(
      `INSERT INTO sigurban_chat_messages (sender_id, role, text) VALUES (?, 'user', ?), (?, 'assistant', ?)`,
      [senderId, userText, senderId, botReply]
    )
  } catch {
    // best-effort only — el estado real viaja con el cliente
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const senderId = String(body?.senderId || '').trim() || 'web_' + Math.random().toString(36).slice(2)
  const text = String(body?.message || '').trim()
  const history: { role: string, text: string }[] = Array.isArray(body?.history) ? body.history.slice(-12) : []

  const session: ChatSession = {
    hasGreeted: !!body?.session?.hasGreeted,
    stage: body?.session?.stage || 'info',
    lead: {
      name: String(body?.session?.lead?.name || ''),
      dni: String(body?.session?.lead?.dni || ''),
      phone: String(body?.session?.lead?.phone || ''),
    },
    collectingEnabled: !!body?.session?.collectingEnabled,
  }

  if (!text) {
    throw createError({ statusCode: 400, message: 'Mensaje vacío' })
  }

  const settings = await getSiteSettings()

  if (settings.chatbot_enabled === '0') {
    return { ok: true, reply: 'El chat no está disponible en este momento. Escribinos por WhatsApp 📲', session, leadSent: false }
  }

  const config = useRuntimeConfig()
  if (!config.OPENAI_API_KEY) {
    return {
      ok: true,
      reply: 'El chat aún no está configurado (falta la clave de OpenAI). Escribinos por WhatsApp y con gusto te ayudamos 📲 https://api.whatsapp.com/send?phone=' + (settings.whatsapp_number || '50431731754'),
      session,
      leadSent: false,
    }
  }

  // ── Parseo determinístico (DNI, teléfono, nombre) ──────────────
  const dni = extractDni(text)
  const phone = extractPhone(text)
  if (dni.digits.length === 13) session.lead.dni = dni.digits
  if (phone.digits.length === 8) session.lead.phone = phone.digits

  if (!session.lead.name) {
    const name = extractName(text)
    if (name) session.lead.name = name
  }

  const wantsPq = wantsPrequalify(text)
  const stopPq = stopPrequalify(text)
  if (wantsPq) session.collectingEnabled = true
  if (stopPq) session.collectingEnabled = false

  const missing: string[] = []
  if (!session.lead.name) missing.push('name')
  if (!session.lead.dni) missing.push('dni')
  if (!session.lead.phone) missing.push('phone')

  const hasAnyLead = !!(session.lead.name || session.lead.dni || session.lead.phone)
  const handoff = wantsHandoff(text)

  if (handoff) {
    session.stage = 'handoff'
  } else if (session.collectingEnabled) {
    session.stage = missing.length === 0 ? 'awaiting_consent' : 'collecting'
  } else if (hasAnyLead) {
    session.stage = 'info'
  }

  const yes = consentYes(text)
  const no = consentNo(text)
  const flags = detectCountryFlags(text)
  const timeOfDay = detectTimeOfDay()

  const leadReady = session.collectingEnabled && missing.length === 0 &&
    ['awaiting_consent', 'collecting'].includes(session.stage) && yes

  const sigurban = await loadKnowledgeBase()

  const userContent = JSON.stringify({
    consulta: text,
    SESSION: session,
    HISTORY: history,
    LEAD_STATUS: { leadSent: session.stage === 'submitted' },
    timeOfDay,
    isSpain: flags.isSpain,
    isUSALegal: flags.isUSALegal,
    isUSAUnknown: flags.isUSAUnknown,
    needsReferido: flags.needsReferido,
    NAME_VALIDATION: { isValidForCrm: !!session.lead.name, candidate: session.lead.name },
    missingFields: missing,
    consentYes: yes,
    consentNo: no,
    SIGURBAN_DATA: sigurban,
  })

  let reply = ''
  try {
    reply = await callOpenAI(config.OPENAI_API_KEY, config.OPENAI_MODEL, settings.chatbot_system_prompt, userContent)
  } catch (err: any) {
    reply = 'Tuve un problema técnico respondiendo tu mensaje 😔 Probá de nuevo en un momento o escribinos por WhatsApp con el código ' + (settings.promo_code || '#FBSIGURBAN') + ' 📲'
  }

  session.hasGreeted = true

  // ── Guardrail: nunca confiamos en que el modelo diga "ya lo envié" ──
  if (handoff) {
    reply = `Perfecto 😊 Para atención prioritaria, escribinos por WhatsApp con el código ${settings.promo_code || '#FBSIGURBAN'} 📲 https://api.whatsapp.com/send?phone=${settings.whatsapp_number || '50431731754'}`
  } else if (leadReady) {
    const result = await sendLeadToCrm(settings, session.lead)
    if (result.ok) {
      session.stage = 'submitted'
      reply = result.duplicate
        ? '¡Ya recibimos tu solicitud de precalificación! 😊 Para seguimiento, escribinos por WhatsApp con ' + (settings.promo_code || '#FBSIGURBAN') + ' 📲'
        : '¡Listo! 🎉🏡 Ya registré tus datos para precalificación. En breve una asesora te contacta 📲 Si querés seguimiento inmediato: ' + (settings.promo_code || '#FBSIGURBAN')
    } else {
      session.stage = 'awaiting_consent'
      reply = 'No pude confirmar el envío al CRM en este momento 😔 ¿Me respondés "Sí" para reintentar, o preferís WhatsApp con ' + (settings.promo_code || '#FBSIGURBAN') + '? 📲'
    }
  } else if (missing.length === 0 && session.stage === 'awaiting_consent' && !yes && !no) {
    reply = `Perfecto 😊 Antes de enviarlos, confirmame que estos datos están correctos:\n• Nombre: ${session.lead.name}\n• DNI: ${maskDni(session.lead.dni)}\n• Teléfono: ${session.lead.phone}\n\n¿Me autorizás a enviarlos para iniciar la precalificación? Respondé "Sí" para enviar o "No" para pasarte a WhatsApp 📲`
  }

  await persistBestEffort(senderId, session, text, reply)

  return { ok: true, senderId, reply, session, leadSent: session.stage === 'submitted' }
})
