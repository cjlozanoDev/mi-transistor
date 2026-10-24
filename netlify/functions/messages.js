// Mensajes programados que se muestran al usuario en un popup al entrar a la
// app (ver src/services/messages.js y HomePage.vue). La app la llama a través
// de /api/messages (redirección en netlify.toml).
//
// Los mensajes viven en messages.json del repo PRIVADO
// cjlozanoDev/mi-transistor-messages. Esta función lo lee con un token de solo
// lectura guardado en la variable de entorno GITHUB_MESSAGES_TOKEN de Netlify
// (nunca llega a la app) y devuelve solo los mensajes vigentes, así que los
// programados para más adelante no se pueden ver antes de tiempo.
//
// Para publicar un mensaje, añade un objeto a messages.json:
//   {
//     "id": "1",                    // único, NUNCA reutilizar uno anterior
//     "start": "24/12/2026",        // dd/mm/yyyy, inclusivo
//     "end": "25/12/2026",          // dd/mm/yyyy, inclusivo (igual a start = solo ese día)
//     "title": { "es": "...", "ca": "...", "eu": "...", "gl": "...", "en": "..." },
//     "items": [{ "icon": "🎄", "text": { "es": "...", "ca": "...", ... } }]
//   }
// Si falta algún idioma se muestra en español. Cada usuario ve cada mensaje
// una sola vez.
const SOURCE_URL =
  'https://api.github.com/repos/cjlozanoDev/mi-transistor-messages/contents/messages.json'

const DAY = 24 * 60 * 60 * 1000

// 'dd/mm/yyyy' -> timestamp UTC de ese día (o NaN si el formato no es válido)
function parseDate(value) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? '').trim())
  if (!match) return NaN
  const [, d, m, y] = match.map(Number)
  return Date.UTC(y, m - 1, d)
}

// Hoy en España como timestamp UTC de ese día. El servidor corre en UTC.
function todayInMadrid() {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' })
    .format(new Date())
    .split('-')
    .map(Number)
  return Date.UTC(y, m - 1, d)
}

function jsonResponse(body, cacheSeconds) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${cacheSeconds}`,
    },
  })
}

export default async () => {
  try {
    const response = await fetch(SOURCE_URL, {
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_MESSAGES_TOKEN}`,
        Accept: 'application/vnd.github.raw',
        'User-Agent': 'mi-transistor-messages',
      },
    })
    if (!response.ok) throw new Error(`GitHub respondió ${response.status}`)

    const messages = await response.json()
    if (!Array.isArray(messages)) throw new Error('messages.json no es un array')

    // Se devuelve con un día de margen por cada lado: el usuario puede estar
    // en otra zona horaria (Latinoamérica, Canarias...). El filtro exacto por
    // su fecha local lo hace la app.
    const today = todayInMadrid()
    const from = today - DAY
    const to = today + DAY
    const active = messages.filter((msg) => {
      const start = parseDate(msg.start)
      const end = parseDate(msg.end)
      return msg.id != null && start <= to && end >= from
    })

    return jsonResponse(active, 300)
  } catch (e) {
    console.error('Error leyendo los mensajes:', e)
    // Sin mensajes la app sigue funcionando igual; caché corta para reintentar pronto
    return jsonResponse([], 60)
  }
}
