<script setup>
import { onMounted } from 'vue'
import { useStationsStore } from './stores/useStationsStore'
import { useReviewPromptStore } from './stores/useReviewPromptStore'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { AppUpdate } from '@capawesome/capacitor-app-update'
import { useQuasar } from 'quasar'

const store = useStationsStore()
const reviewPromptStore = useReviewPromptStore()
const $q = useQuasar()

// Plugin nativo propio: abre Google Play directamente, sin selector de apps
const StoreOpener = registerPlugin('StoreOpener')
const PACKAGE_NAME = 'com.mitransistor.app'

function openPlayStore() {
  StoreOpener.openPlayStore({ packageName: PACKAGE_NAME }).catch(() => {
    AppUpdate.openAppStore()
  })
}

function maybeShowReviewPrompt() {
  reviewPromptStore.initIfNeeded()
  if (!reviewPromptStore.shouldShowPrompt()) return

  $q.dialog({
    title: '📻 ¿Te gusta Mi Transistor?',
    message:
      'Si estás disfrutando de la app, nos ayudaría muchísimo que dejaras una reseña en Google Play. ' +
      'Solo te llevará un momento. ¡Gracias! 🙏',
    html: true,
    persistent: true,
    ok: {
      label: 'Dejar reseña',
      color: 'primary',
      unelevated: true,
    },
    cancel: {
      label: 'Quizás más tarde',
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
}

onMounted(async () => {
  store.loadStations()

  if (Capacitor.isNativePlatform()) {
    await StatusBar.setStyle({ style: Style.Dark })
    maybeShowReviewPrompt()
  }
})
</script>

<template>
  <router-view />
</template>
