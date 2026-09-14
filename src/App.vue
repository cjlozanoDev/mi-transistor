<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useStationsStore } from './stores/useStationsStore'
import { useReviewPromptStore } from './stores/useReviewPromptStore'
import { useInstallPromptStore } from './stores/useInstallPromptStore'
import InstallPwaDialog from './components/InstallPwaDialog.vue'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { AppUpdate } from '@capawesome/capacitor-app-update'
import { useQuasar } from 'quasar'

const store = useStationsStore()
const reviewPromptStore = useReviewPromptStore()
const installPromptStore = useInstallPromptStore()
const $q = useQuasar()

const showInstallPrompt = ref(false)
let deferredInstallEvent = null

// Solo tiene sentido ofrecer "instalar en el ordenador" en navegador de
// escritorio: en el móvil ya se instala como app nativa, y si ya está
// instalada como PWA (display-mode standalone) no hay nada que ofrecer.
function isInstallPromptEligible() {
  if (Capacitor.isNativePlatform()) return false
  if ($q.platform.is.mobile) return false
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  return !isStandalone
}

function onBeforeInstallPrompt(event) {
  // Evita que Chrome muestre su propio mini-infobar; lo controlamos nosotros
  event.preventDefault()
  deferredInstallEvent = event
  if (!isInstallPromptEligible()) return
  if (installPromptStore.shouldShowPrompt()) {
    showInstallPrompt.value = true
  }
}

function onAppInstalled() {
  showInstallPrompt.value = false
  installPromptStore.markInstalled()
}

async function installApp() {
  showInstallPrompt.value = false
  if (!deferredInstallEvent) return
  deferredInstallEvent.prompt()
  const choice = await deferredInstallEvent.userChoice
  if (choice.outcome === 'accepted') {
    installPromptStore.markInstalled()
  } else {
    installPromptStore.postponePrompt()
  }
  deferredInstallEvent = null
}

function dismissInstallPrompt() {
  showInstallPrompt.value = false
  installPromptStore.postponePrompt()
}

window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
window.addEventListener('appinstalled', onAppInstalled)

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
})

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
  <InstallPwaDialog v-model="showInstallPrompt" @install="installApp" @dismiss="dismissInstallPrompt" />
</template>
