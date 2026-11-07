// Estándar de nombres, teléfonos e identidad SIG-URBAN (ver ESTANDAR_DATOS.md del CRM).
// Misma lógica que server/src/utils/data-standard.ts del CRM. Copia en utils/dataStandard.ts (app).

export interface PhoneResult { ok: boolean; value: string; reason?: string }

export function normalizeName(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[^\p{L}\s.'’-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('es')
}

const HN_LOCAL = /^[2389]\d{7}$/

/** Honduras = 8 dígitos (2/3/8/9). Extranjero = + código + número, sin espacios ni guiones. */
export function normalizePhone(raw: unknown): PhoneResult {
  const text = String(raw ?? '').trim()
  const hadPlus = text.startsWith('+') || text.startsWith('00')
  let d = text.replace(/\D/g, '')
  if (text.startsWith('00')) d = d.slice(2)
  if (!d) return { ok: false, value: '', reason: 'El teléfono está vacío.' }
  if (/^0+$/.test(d)) return { ok: false, value: '', reason: 'El teléfono no puede ser solo ceros.' }
  if (d.startsWith('504') && HN_LOCAL.test(d.slice(3))) return { ok: true, value: d.slice(3) }
  if (!hadPlus && HN_LOCAL.test(d)) return { ok: true, value: d }
  if (d.length === 11 && d[0] === '1' && /^1[2-9]\d{2}[2-9]\d{6}$/.test(d)) return { ok: true, value: '+' + d }
  if (!hadPlus && d.length === 10 && /^[2-9]\d{2}[2-9]\d{6}$/.test(d)) return { ok: true, value: '+1' + d }
  if (d.length < 8) return { ok: false, value: d, reason: `El teléfono tiene solo ${d.length} dígitos; el mínimo es 8.` }
  if (hadPlus && d.length >= 9 && d.length <= 15) return { ok: true, value: '+' + d }
  if (d.length === 8) return { ok: false, value: d, reason: 'Un número de Honduras empieza con 2, 3, 8 o 9. Si es de otro país, escribilo con + y el código.' }
  return { ok: false, value: d, reason: 'Falta el código de país: escribilo con + (ejemplo +34612345678).' }
}

/** Identidad de Honduras: 13 dígitos, departamento 01-18, año de nacimiento razonable y distinta al teléfono. */
export function normalizeIdentity(raw: unknown, phone?: unknown): { ok: boolean; value: string; reason?: string } {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.length !== 13) return { ok: false, value: d, reason: 'La identidad debe tener 13 dígitos (ejemplo 0801-1990-12345).' }
  const ph = String(phone ?? '').replace(/\D/g, '')
  if (ph && (d === ph || d === ph.slice(-8))) return { ok: false, value: d, reason: 'La identidad no puede ser igual al teléfono.' }
  const dep = parseInt(d.slice(0, 2), 10)
  const year = parseInt(d.slice(4, 8), 10)
  if (dep < 1 || dep > 18) return { ok: false, value: d, reason: 'Los dos primeros dígitos de la identidad no son válidos (01 a 18).' }
  if (year < 1900 || year > new Date().getFullYear() - 15) return { ok: false, value: d, reason: 'El año de nacimiento de la identidad no es válido.' }
  return { ok: true, value: d }
}
