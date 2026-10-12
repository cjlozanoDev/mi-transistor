import { defineStore } from 'pinia'
import { DEFAULT_LOCALE } from 'src/i18n'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    locale: DEFAULT_LOCALE,
  }),
  actions: {
    setLocale(locale) {
      this.locale = locale
    },
  },
  persist: {
    key: 'settings-v1',
  },
})
