import { WebPlugin } from '@capacitor/core'
import Hls from 'hls.js'

// Implementación web del plugin nativo AudioPlayer (ver
// src-capacitor/android/app/src/main/java/com/mitransistor/app/AudioPlayerPlugin.java).
// Debe mantener exactamente el mismo contrato (métodos y forma de los eventos
// 'state'/'error') para que PlayerStation.vue no necesite saber en qué
// plataforma corre.
export class AudioPlayerWeb extends WebPlugin {
  audio = null
  hls = null

  getAudio() {
    if (this.audio) return this.audio

    const audio = new Audio()
    audio.preload = 'none'

    audio.addEventListener('waiting', () => this.emitState(true))
    audio.addEventListener('stalled', () => this.emitState(true))
    audio.addEventListener('playing', () => this.emitState(false))
    audio.addEventListener('pause', () => this.emitState(false))
    audio.addEventListener('error', () => {
      const error = audio.error
      this.notifyListeners('error', {
        code: error?.code ?? -1,
        message: error?.message ?? 'Error de reproducción',
      })
    })

    this.audio = audio
    return audio
  }

  emitState(isBuffering) {
    const audio = this.audio
    const isPlaying = !!audio && !audio.paused && !audio.ended
    this.notifyListeners('state', { isPlaying, isBuffering: isBuffering && isPlaying })
  }

  setMediaSessionMetadata({ title, artist, artwork }) {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Mi Transistor',
      artist: artist || 'Radio en directo',
      album: 'Mi Transistor',
      artwork: artwork ? [{ src: artwork, sizes: '512x512', type: 'image/png' }] : [],
    })
  }

  destroyHls() {
    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }
  }

  // Muchas emisoras exponen un "master.m3u8" multivariante que solo apunta a
  // una única sub-lista real (con los segmentos). Algunos CDNs (ej.
  // 3catdirectes.cat) responden ese master de forma intermitente (503), pero
  // la sub-lista real va perfectamente: resolvemos el master una sola vez y
  // le damos a hls.js la sub-lista directa, evitando reintentos contra el
  // endpoint problemático en cada refresco de playlist en directo.
  async resolveMediaPlaylistUrl(masterUrl) {
    try {
      const res = await fetch(masterUrl, { cache: 'no-store' })
      const text = await res.text()
      // Solo tiene sentido "saltar" el master si es un multivariante
      // (EXT-X-STREAM-INF): si ya es la lista de segmentos, la primera línea
      // sin '#' sería un .ts, no otra sub-lista.
      if (!text.includes('#EXT-X-STREAM-INF')) return masterUrl
      const lines = text.split('\n').map((l) => l.trim())
      const variantLine = lines.find((l) => l && !l.startsWith('#'))
      if (!variantLine) return masterUrl
      return new URL(variantLine, masterUrl).toString()
    } catch {
      return masterUrl
    }
  }

  async play({ url, title, artist, artwork }) {
    if (!url) throw this.unavailable('url required')

    const audio = this.getAudio()
    this.destroyHls()

    // audio.canPlayType('application/vnd.apple.mpegurl') no es fiable: Chrome
    // devuelve "maybe" aunque en realidad no sepa desmuxar HLS. Por eso
    // preferimos hls.js siempre que esté soportado (MSE), tal y como
    // recomienda la propia librería, y solo caemos al <audio> nativo cuando
    // hls.js no puede funcionar en absoluto.
    if (/\.m3u8(\?|$)/i.test(url) && Hls.isSupported()) {
      const playlistUrl = await this.resolveMediaPlaylistUrl(url)
      this.hls = new Hls({
        // Algunos CDNs de emisoras (ej. 3catdirectes.cat) responden mal a las
        // peticiones condicionales/Range que el navegador añade al revalidar
        // caché (devuelven gzip mal calculado sobre un rango parcial, lo que
        // Chrome no puede decodificar). 'no-store' evita esa revalidación.
        fetchSetup: (context, initParams) => new Request(context.url, { ...initParams, cache: 'no-store' }),
      })
      this.hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return
        this.notifyListeners('error', { code: -1, message: 'Error de reproducción' })
        this.destroyHls()
      })
      this.hls.loadSource(playlistUrl)
      this.hls.attachMedia(audio)
    } else {
      audio.src = url
    }

    this.setMediaSessionMetadata({ title, artist, artwork })

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => audio.play())
      navigator.mediaSession.setActionHandler('pause', () => this.stop())
      navigator.mediaSession.setActionHandler('stop', () => this.stop())
    }

    await audio.play()
  }

  async stop() {
    const audio = this.audio
    this.destroyHls()
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    this.notifyListeners('state', { isPlaying: false, isBuffering: false })
  }

  async updateMetadata({ title, artist, artwork }) {
    this.setMediaSessionMetadata({ title, artist, artwork })
  }

  async getState() {
    const audio = this.audio
    const isPlaying = !!audio && !audio.paused && !audio.ended
    return { isPlaying, isBuffering: false }
  }
}
