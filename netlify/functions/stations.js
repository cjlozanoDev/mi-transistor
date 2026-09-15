// Proxy server-to-server para el listado de emisoras españolas: tdtchannels.com
// no manda cabeceras CORS, así que el navegador bloquea la llamada directa
// desde la versión web. Esta función corre en el servidor de Netlify, donde
// CORS no aplica, y devuelve el JSON ya con las cabeceras que el navegador sí acepta.
const SOURCE_URL = 'https://www.tdtchannels.com/lists/radio.json'

export default async () => {
  try {
    const response = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(5000) })
    const data = await response.text()
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo obtener el listado de emisoras' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
