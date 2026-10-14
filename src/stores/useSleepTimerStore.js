import { defineStore } from 'pinia'

import { usePlayerStore } from 'src/stores/usePlayerStore'

// Temporizador de apagado. NO se persiste a propósito: si se cierra la app o
// la web, no tiene sentido que siga activo al volver.
//
// En Android el apagado real lo hace el plugin nativo (AudioPlayerPlugin
// setSleepTimer), porque el JS de la WebView se congela con la pantalla
// bloqueada. Este setTimeout es el que manda en la web y sirve de respaldo.
let timeoutId = null

export const useSleepTimerStore = defineStore('sleepTimer', {
  state: () => ({
    endAt: null,
    durationMs: 0,
  }),

  getters: {
    isActive: (state) => state.endAt !== null,
  },

  actions: {
    start(ms) {
      this.clearTimeout()
      this.durationMs = ms
      this.endAt = Date.now() + ms
      timeoutId = setTimeout(() => this.expire(), ms)
    },

    cancel() {
      this.clearTimeout()
      this.endAt = null
      this.durationMs = 0
    },

    expire() {
      const playerStore = usePlayerStore()
      if (playerStore.isPlaying) playerStore.stop()
      this.cancel()
    },

    clearTimeout() {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    },
  },
})
