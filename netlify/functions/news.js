// Proxy server-to-server para el RSS de 20minutos: es un feed pensado para
// lectores RSS, no manda cabeceras CORS, así que el navegador bloquea la
// llamada directa desde la versión web. Igual que stations.js, esta función
// hace la petición desde el servidor de Netlify y reenvía el XML al cliente.
const SOURCE_URL = 'https://www.20minutos.es/rss/'

export default async () => {
  try {
    const response = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(8000) })
    const data = await response.text()
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return new Response('', {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}
