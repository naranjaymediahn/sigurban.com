import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { query } from '../utils/db'
import { getSiteSettings } from '../utils/siteSettings'
import {
  extractDni, extractPhone, extractName, extractNameFromCorrectionPhrase, detectCountryFlags, detectTimeOfDay,
  wantsPrequalify, stopPrequalify, consentYes, consentNo, wantsHandoff, maskDni, mergeCountryFlags,
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

// Antes de guardar un candidato a nombre en la sesión, le preguntamos directamente al modelo
// si es un nombre real de persona. Evita depender solo de una lista de palabras prohibidas
// (que siempre se queda corta) para frases como "en cuantos años" o "cuánto cuesta".
async function isRealPersonName(candidate: string, apiKey: string, model: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Respondé únicamente SI o NO, sin explicación. ¿El siguiente texto es el nombre completo real de una persona (nombre y apellido)? Si es una pregunta, una frase, un tema de conversación, una ubicación o cualquier cosa que no sea claramente un nombre propio de persona, respondé NO.',
          },
          { role: 'user', content: candidate },
        ],
        temperature: 0,
        max_tokens: 3,
      }),
    })
    if (!res.ok) return false
    const json = await res.json()
    const text = String(json?.choices?.[0]?.message?.content || '').trim()
    return /^s[ií]/i.test(text)
  } catch {
    return false
  }
}

async function sendLeadToCrm(settings: any, lead: { name: string, dni: string, phone: string, phoneCountryCode?: string }) {
  const config = useRuntimeConfig()
  const url = settings.n8n_lead_webhook_url || settings.crm_lead_endpoint || config.CRM_LEAD_ENDPOINT
  if (!url) return { ok: false, message: 'No hay endpoint configurado para enviar el lead.' }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!settings.n8n_lead_webhook_url && config.CRM_LEAD_TOKEN) {
    headers.Authorization = `Bearer ${config.CRM_LEAD_TOKEN}`
  }

  // El CRM valida el body estrictamente (rechaza campos que no reconoce), así que no le
  // agregamos un campo nuevo para el código de país — lo anteponemos al mismo campo "phone"
  // que ya está probado, y solo cuando el cliente no es de Honduras (+504 es el formato ya
  // validado end-to-end, así que ese caso queda exactamente igual que antes).
  const countryCode = lead.phoneCountryCode || '+504'
  const phone = countryCode === '+504' ? lead.phone : `${countryCode}${lead.phone}`
  const payload = { name: lead.name, dni: lead.dni, phone }

  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
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
      phoneCountryCode: String(body?.session?.lead?.phoneCountryCode || '+504'),
    },
    collectingEnabled: !!body?.session?.collectingEnabled,
    countryFlags: {
      isSpain: !!body?.session?.countryFlags?.isSpain,
      isUSALegal: !!body?.session?.countryFlags?.isUSALegal,
      isUSAUnknown: !!body?.session?.countryFlags?.isUSAUnknown,
    },
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

  // ── País del cliente: se acumula en la sesión, no se recalcula solo con el mensaje actual ──
  session.countryFlags = mergeCountryFlags(session.countryFlags, detectCountryFlags(text))

  // ── Parseo determinístico (DNI, teléfono, nombre) ──────────────
  // El teléfono usa el formato del país ya identificado (EEUU: 10 dígitos + código +1,
  // España: 9 dígitos + código +34, si no, Honduras: 8 dígitos + código +504).
  const dni = extractDni(text)
  const phone = extractPhone(text, session.countryFlags)
  if (dni.digits.length === 13) session.lead.dni = dni.digits
  if (phone.digits) {
    session.lead.phone = phone.digits
    session.lead.phoneCountryCode = phone.countryCode
  }

  // Sin nombre aún: probamos cualquier candidato (frase explícita o "todo el mensaje parece un nombre").
  // Con nombre ya guardado: solo aceptamos correcciones con frase explícita ("mi nombre es...", "me llamo...",
  // "no, es...") — así lo pide la sección 13 del prompt, para no confundir un dato de corrección con
  // cualquier frase que el cliente escriba de casualidad. En ambos casos, antes de persistir el
  // candidato le preguntamos a la IA si de verdad es un nombre de persona — ese filtro es lo que evita
  // que una pregunta como "en cuantos años" quede guardada como si fuera un nombre.
  const nameCandidate = session.lead.name ? extractNameFromCorrectionPhrase(text) : extractName(text)
  if (nameCandidate && nameCandidate !== session.lead.name) {
    const isName = await isRealPersonName(nameCandidate, config.OPENAI_API_KEY, config.OPENAI_MODEL)
    if (isName) session.lead.name = nameCandidate
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
  const flags = { ...session.countryFlags, needsReferido: session.countryFlags.isSpain || session.countryFlags.isUSAUnknown }
  const timeOfDay = detectTimeOfDay()

  const leadReady = session.collectingEnabled && missing.length === 0 &&
    ['awaiting_consent', 'collecting'].includes(session.stage) && yes

  const sigurban = await loadKnowledgeBase()

  let bankPartners: { name: string }[] = []
  try {
    bankPartners = JSON.parse(settings.bank_partners_json || '[]').map((b: any) => ({ name: b.name }))
  } catch { /* noop */ }

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
    SIGURBAN_DATA: { ...sigurban, bancosAliados: bankPartners },
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
