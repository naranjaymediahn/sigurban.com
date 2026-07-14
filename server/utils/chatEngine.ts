// Motor del chatbot Julia — versión propia (sin depender de n8n para responder).
// Puerto simplificado de la lógica del workflow n8n "Messenger Brain".

export type ChatLead = { name: string; dni: string; phone: string; phoneCountryCode: string }
export type ChatCountryFlags = { isSpain: boolean; isUSALegal: boolean; isUSAUnknown: boolean }
export type ChatSession = {
  hasGreeted: boolean
  stage: 'info' | 'collecting' | 'awaiting_consent' | 'submitted' | 'in_flight' | 'handoff'
  lead: ChatLead
  collectingEnabled: boolean
  // Una vez identificado el país del cliente (por palabras clave en cualquier turno), se
  // conserva durante toda la conversación — antes se recalculaba solo con el mensaje actual
  // y se perdía apenas el cliente cambiaba de tema.
  countryFlags: ChatCountryFlags
}

// Combina las banderas ya conocidas de la sesión con lo detectado en el mensaje actual.
// Una vez cierta, una bandera no vuelve a false; isUSAUnknown se "asciende" a isUSALegal
// si en un turno posterior el cliente aporta la señal de estatus legal.
export function mergeCountryFlags(existing: ChatCountryFlags, fresh: ChatCountryFlags): ChatCountryFlags {
  const isSpain = existing.isSpain || fresh.isSpain
  const isUSALegal = existing.isUSALegal || fresh.isUSALegal
  const isUSAUnknown = (existing.isUSAUnknown || fresh.isUSAUnknown) && !isUSALegal
  return { isSpain, isUSALegal, isUSAUnknown }
}

function stripAccents(s: string) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}
function norm(s: string) {
  return stripAccents(String(s || '').toLowerCase()).replace(/\s+/g, ' ').trim()
}

export function extractDni(text: string) {
  const s = String(text || '')
  let m = s.match(/\b(\d{4}[-\s]?\d{4}[-\s]?\d{5})\b/)
  if (m) return { digits: m[1].replace(/\D/g, ''), raw: m[0] }
  m = s.match(/\b(\d{13})\b/)
  if (m) return { digits: m[1], raw: m[0] }
  return { digits: '', raw: '' }
}

export type PhoneMatch = { digits: string, raw: string, countryCode: string }

// countryFlags decide qué formato de teléfono priorizar: Honduras (8 dígitos, +504) por
// defecto, o EEUU (10 dígitos, +1) / España (9 dígitos, +34) cuando ya sabemos que el
// cliente vive en el extranjero — así no se intenta forzar un número de 10 dígitos de EEUU
// dentro del formato hondureño de 8.
export function extractPhone(text: string, countryFlags?: ChatCountryFlags): PhoneMatch {
  const s = String(text || '')

  if (countryFlags?.isUSALegal || countryFlags?.isUSAUnknown) {
    const usMatch = s.match(/\b(?:\+?1[-\s]?)?\(?(\d{3})\)?[-\s]?(\d{3})[-\s]?(\d{4})\b/)
    if (usMatch) {
      const digits = usMatch[1] + usMatch[2] + usMatch[3]
      if (digits.length === 10) return { digits, raw: usMatch[0], countryCode: '+1' }
    }
  }

  if (countryFlags?.isSpain) {
    const esMatch = s.match(/\b(?:\+?34[-\s]?)?(\d{3})[-\s]?(\d{3})[-\s]?(\d{3})\b/)
    if (esMatch) {
      const digits = esMatch[1] + esMatch[2] + esMatch[3]
      if (digits.length === 9) return { digits, raw: esMatch[0], countryCode: '+34' }
    }
  }

  const cands: { digits: string, raw: string }[] = []
  const re1 = /\b(?:\+?504[-\s]?)?(\d{4})[-\s]?(\d{4})\b/g
  let m: RegExpExecArray | null
  while ((m = re1.exec(s)) !== null) {
    const d = String(m[1] || '') + String(m[2] || '')
    if (d.length === 8) cands.push({ digits: d, raw: m[0] })
  }
  const m2 = s.match(/\b(?:\+?504[-\s]?)?(\d{8})\b/)
  if (m2 && m2[1]?.length === 8) cands.push({ digits: m2[1], raw: m2[0] })
  const hn = cands.length ? cands[cands.length - 1] : { digits: '', raw: '' }
  return { ...hn, countryCode: '+504' }
}

const NAME_STOP_WORDS = [
  'casa', 'casas', 'vivienda', 'viviendas', 'proyecto', 'proyectos', 'lote', 'lotes', 'terreno',
  'precio', 'precios', 'cuota', 'cuotas', 'prima', 'plazo', 'requisito', 'requisitos',
  'ubicacion', 'direccion', 'whatsapp', 'asesor', 'asesora', 'precalificar', 'precalificacion',
  'si', 'no', 'ok', 'okay', 'gracias', 'listo', 'perfecto', 'dato', 'datos', 'enviar', 'envia',
  'crm', 'sistema', 'registro', 'registrado', 'tegucigalpa', 'siguatepeque', 'honduras', 'usa',
  'espana', 'financiamiento', 'credito', 'informacion',
  // Palabras interrogativas / de consulta — un mensaje que las contiene es una pregunta, no un nombre.
  'cuanto', 'cuantos', 'cuanta', 'cuantas', 'como', 'cuando', 'donde', 'cual', 'cuales', 'que',
  'porque', 'quien', 'quienes', 'anos', 'meses', 'dias', 'banco', 'bancos', 'modelo', 'modelos',
]

function cleanNameCandidate(s: string) {
  return String(s || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/#[A-Za-z0-9_]+/g, ' ')
    .replace(/[0-9]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function looksLikeName(candidate: string) {
  const cand = cleanNameCandidate(candidate)
  if (!cand || cand.length < 5 || cand.length > 60) return false
  const parts = cand.split(' ').filter(Boolean)
  if (parts.length < 2 || parts.length > 5) return false
  const plain = norm(cand)
  if (NAME_STOP_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(plain))) return false
  if (parts.some((w) => stripAccents(w).length < 2)) return false
  return true
}

// Solo patrones explícitos ("mi nombre es X", "me llamo X", "no, es X"...). Se usa para
// aceptar correcciones incluso cuando SESSION.lead.name ya tiene un valor.
export function extractNameFromCorrectionPhrase(text: string): string {
  const raw = String(text || '').trim()
  if (!raw) return ''

  const patterns = [
    /(?:mi\s+nombre\s+correcto\s+es)\s+([^\n,.]+)/i,
    /(?:mi\s+nombre\s+completo\s+es)\s+([^\n,.]+)/i,
    /(?:mi\s+nombre\s+es)\s+([^\n,.]+)/i,
    /(?:me\s+llamo)\s+([^\n,.]+)/i,
    /(?:^|\b)(?:no,?\s*)?es\s+([^\n,.]+)/i,
    /(?:soy)\s+([^\n,.]+)/i,
    /(?:nombre\s+completo)\s*[:\-]\s*([^\n,.]+)/i,
    /(?:nombre)\s*[:\-]\s*([^\n,.]+)/i,
  ]
  for (const re of patterns) {
    const m = raw.match(re)
    if (m?.[1]) {
      const candidate = cleanNameCandidate(m[1])
      if (looksLikeName(candidate)) return candidate
    }
  }
  return ''
}

// Heurística completa: patrones explícitos + "todo el mensaje parece ser solo un nombre".
// El fallback es deliberadamente permisivo (candidato, no verdad) — quien decide si es un
// nombre real de persona antes de guardarlo es la IA (ver isRealPersonName en chat.post.ts).
export function extractName(text: string): string {
  const raw = String(text || '').trim()
  if (!raw) return ''

  const fromPhrase = extractNameFromCorrectionPhrase(raw)
  if (fromPhrase) return fromPhrase

  const cleaned = cleanNameCandidate(raw)
  if (looksLikeName(cleaned) && !/\d/.test(raw)) return cleaned

  return ''
}

export function detectCountryFlags(text: string) {
  const lc = norm(text)
  const isSpain = /\b(espana|madrid|barcelona|sevilla|valencia|bilbao|espanol|espanola)\b/.test(lc)
  const isUSA = /\b(estados unidos|usa|eeuu|miami|houston|nueva york|new york|los angeles|dallas|atlanta|chicago|virginia|maryland|california|arizona|texas|florida)\b/.test(lc)
  const hasTPS = /\b(tps|estatus temporal|temporary protected|residencia permanente|residente|ciudadano|ciudadana|green card|visa de trabajo|legal|documentado|documentada)\b/.test(lc)
  const isUSALegal = isUSA && hasTPS
  const isUSAUnknown = isUSA && !hasTPS
  const needsReferido = isSpain || isUSAUnknown
  return { isSpain, isUSA, isUSALegal, isUSAUnknown, needsReferido }
}

export function detectTimeOfDay(date = new Date()) {
  const hourHN = new Date(date.getTime() - 6 * 3600000).getUTCHours()
  return hourHN < 12 ? 'mañana' : hourHN < 18 ? 'tarde' : 'noche'
}

export function wantsPrequalify(text: string) {
  const lc = norm(text)
  const isForeignQuestion = /\b(usa|estados unidos|visa|extranjero|extranjera|espana)\b/.test(lc)
  if (isForeignQuestion) return false
  return (
    /(precal|precalific|calificacion)/i.test(lc) ||
    /\b(quiero|deseo|me interesa|como|puedo)\s+(aplicar|solicitar|tramitar)\b/i.test(lc) ||
    /\b(aplicar|solicitar)\s+(credito|financiamiento|precalificacion|prestamo)\b/i.test(lc) ||
    /(credito|financ|hipotec|prestam|banco|buro)/i.test(lc) ||
    /(me contacten|contactenme|llamenme|llamame)/i.test(lc) ||
    /(agendar|agenda|cita|visita|tour|quiero visitar|quiero verla|quiero ver la casa)/i.test(lc)
  )
}

export function stopPrequalify(text: string) {
  const lc = norm(text)
  return /(no precalificar|no aplicar|no autoriz|no enviar|olvidalo|cancelar|ya no)/i.test(lc) ||
    /(prefiero hablar con persona|prefiero un asesor|prefiero una asesora)/i.test(lc) ||
    /(solo informacion|solo queria preguntar|no doy mis datos|no quiero dar mis datos)/i.test(lc)
}

export function consentYes(text: string) {
  const lc = norm(text)
  if (/^(no,?\s*)?(es|mi nombre correcto es|mi nombre completo es|mi nombre es|me llamo|soy)\s+[a-z]/i.test(lc)) return false
  return /(^(si)\b|claro\b|dale\b|de una\b|va\b|ok(ay|ey|i)?\b|perfecto\b|listo\b|de acuerdo\b|autorizo\b|te autorizo\b|acepto\b|confirmo\b|proced(e|a)\b|envia\b|manda\b)/i.test(lc)
}

export function consentNo(text: string) {
  const lc = norm(text)
  if (consentYes(text)) return false
  return /(^(no|nel|nop|negativo)\b|no gracias|prefiero whatsapp|mejor whatsapp|no autoriz|no lo envies|no enviar|despues|luego|mas tarde|otro dia)/i.test(lc)
}

export function wantsHandoff(text: string) {
  const lc = norm(text)
  return /(quiero hablar con un asesor|quiero hablar con una asesora|quiero un asesor|quiero una asesora|prefiero whatsapp|mejor whatsapp)/i.test(lc)
}

export function maskDni(dni: string) {
  const d = String(dni || '').replace(/\D/g, '')
  return d.length <= 4 ? d : ('*********' + d.slice(-4))
}
