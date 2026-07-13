import crypto from 'node:crypto'

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash = '') {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'))
}

export function generateSessionToken() {
  return crypto.randomBytes(48).toString('hex')
}
