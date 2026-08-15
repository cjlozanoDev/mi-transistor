import { defineStore } from 'pinia'

const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000
const STORAGE_KEY = 'review-prompt-v1'

export const useReviewPromptStore = defineStore('reviewPrompt', {
  state: () => ({
    // Momento a partir del cual se puede volver a mostrar el popup.
    // null = todavía no se ha inicializado (primera vez que corre este código).
    nextPromptAt: null,
    dismissedForever: false,
  }),
  actions: {
    // Se llama una vez al arrancar la app. Decide si el usuario es "nuevo"
    // (localStorage vacío, sin ninguna otra key de la app) o si ya tenía la
    // app instalada de antes (hay alguna key ajena a esta, sea cual sea su
    // versión), sin depender del formato ni la versión de ningún otro store.
    initIfNeeded() {
      if (this.nextPromptAt !== null) return

      const hasExistingAppData = Object.keys(localStorage).some((key) => key !== STORAGE_KEY)
      this.nextPromptAt = hasExistingAppData ? Date.now() : Date.now() + TWO_WEEKS
    },
    shouldShowPrompt() {
      return !this.dismissedForever && this.nextPromptAt !== null && Date.now() >= this.nextPromptAt
    },
    postponePrompt() {
      this.nextPromptAt = Date.now() + TWO_WEEKS
    },
    markReviewed() {
      this.dismissedForever = true
    },
  },
  persist: {
    key: STORAGE_KEY,
  },
})
