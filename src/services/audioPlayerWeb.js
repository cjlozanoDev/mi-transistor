import { WebPlugin } from '@capacitor/core'

// Implementación web del plugin nativo AudioPlayer (ver
// src-capacitor/android/app/src/main/java/com/mitransistor/app/AudioPlayerPlugin.java).
// Debe mantener exactamente el mismo contrato (métodos y forma de los eventos
// 'state'/'error') para que PlayerStation.vue no necesite saber en qué
// plataforma corre.
export class AudioPlayerWeb extends WebPlugin {
  audio = null

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

  async play({ url, title, artist, artwork }) {
    if (!url) throw this.unavailable('url required')

    const audio = this.getAudio()
    audio.src = url
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
