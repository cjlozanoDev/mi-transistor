import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { registerPlugin } from '@capacitor/core'
import { AppUpdate } from '@capawesome/capacitor-app-update'
import { useReviewPromptStore } from 'src/stores/useReviewPromptStore'

// Plugin nativo propio: abre Google Play directamente, sin selector de apps
const StoreOpener = registerPlugin('StoreOpener')
const PACKAGE_NAME = 'com.mitransistor.app'

export function openPlayStore() {
  // Forzamos Google Play con nuestro plugin; si fallara, usamos el del sistema
  StoreOpener.openPlayStore({ packageName: PACKAGE_NAME }).catch(() => {
    AppUpdate.openAppStore()
  })
}

export function useReviewPrompt() {
  const $q = useQuasar()
  const { t } = useI18n()
  const reviewPromptStore = useReviewPromptStore()

  // Devuelve true si ha mostrado el popup, para no encadenar otro detrás
  function maybeShowReviewPrompt() {
    reviewPromptStore.initIfNeeded()
    if (!reviewPromptStore.shouldShowPrompt()) return false

    $q.dialog({
      title: t('review.title'),
      message: t('review.message'),
      html: true,
      persistent: true,
      ok: {
        label: t('review.ok'),
        color: 'primary',
        unelevated: true,
      },
      cancel: {
        label: t('review.cancel'),
        flat: true,
        color: 'grey-7',
      },
    })
      .onOk(() => {
        reviewPromptStore.markReviewed()
        openPlayStore()
      })
      .onCancel(() => {
        reviewPromptStore.postponePrompt()
      })
    return true
  }

  return { maybeShowReviewPrompt }
}
