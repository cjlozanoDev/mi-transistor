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
    // La decisión usuario nuevo/antiguo se toma en boot/pinia.js
    // (seedReviewPrompt), antes de que ningún store escriba en localStorage.
    // Esto es solo una red de seguridad: ante la duda, se trata como nuevo.
    initIfNeeded() {
      if (this.nextPromptAt !== null) return
      this.nextPromptAt = Date.now() + TWO_WEEKS
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
