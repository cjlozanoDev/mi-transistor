import { Capacitor } from '@capacitor/core'

// Mensajes programados (ver netlify/functions/messages.js). En la web basta la
// ruta relativa; la app nativa no corre en nuestro dominio, así que necesita
// la URL completa. /api/messages no depende de Netlify: si se cambia de
// plataforma, basta con seguir sirviendo esa ruta en mitransistor.com.
const MESSAGES_URL = Capacitor.isNativePlatform()
  ? 'https://mitransistor.com/api/messages'
  : '/api/messages'

// 'dd/mm/yyyy' -> Date local a las 00:00 (o null si el formato no es válido)
function parseDate(value) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? '').trim())
  if (!match) return null
  const [, d, m, y] = match.map(Number)
  return new Date(y, m - 1, d)
}

function isActiveToday(message) {
  const start = parseDate(message.start)
  const end = parseDate(message.end)
  if (!start || !end) return false

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return start <= today && today <= end
}

// Mensajes vigentes hoy según la fecha local del usuario. Si algo falla
// (sin conexión, función caída...) devuelve [] y la app sigue sin más.
export async function fetchActiveMessages() {
  try {
    const res = await fetch(MESSAGES_URL, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const messages = await res.json()
    return Array.isArray(messages) ? messages.filter(isActiveToday) : []
  } catch {
    return []
  }
}
