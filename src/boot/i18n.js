import { boot } from 'quasar/wrappers'
import { watch } from 'vue'
import { createI18n } from 'vue-i18n'
import messages, { DEFAULT_LOCALE } from 'src/i18n'
import { useSettingsStore } from 'src/stores/useSettingsStore'

// Va después del boot de Pinia: el idioma elegido vive en useSettingsStore
// (persistido en localStorage), así que al arrancar ya está restaurado.
export default boot(({ app }) => {
  const settingsStore = useSettingsStore()

  const i18n = createI18n({
    legacy: false,
    locale: messages[settingsStore.locale] ? settingsStore.locale : DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    messages,
    // Algunos mensajes (diálogo de actualización) llevan <b>/<br> a propósito
    warnHtmlMessage: false,
  })

  app.use(i18n)

  watch(
    () => settingsStore.locale,
    (locale) => {
      i18n.global.locale.value = locale
      document.documentElement.lang = locale
    },
    { immediate: true },
  )
})
