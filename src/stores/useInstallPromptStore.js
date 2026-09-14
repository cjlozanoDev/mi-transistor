import { defineStore } from 'pinia'

const SNOOZE_DAYS = 1
const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000
const STORAGE_KEY = 'install-prompt-v1'

export const useInstallPromptStore = defineStore('installPrompt', {
  state: () => ({
    nextPromptAt: 0,
    installed: false,
  }),
  actions: {
    shouldShowPrompt() {
      return !this.installed && Date.now() >= this.nextPromptAt
    },
    postponePrompt() {
      this.nextPromptAt = Date.now() + SNOOZE_MS
    },
    markInstalled() {
      this.installed = true
    },
  },
  persist: {
    key: STORAGE_KEY,
  },
})
