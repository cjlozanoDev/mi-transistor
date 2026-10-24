<script>
// A nivel de módulo (no dentro de <script setup>, que es por instancia): los
// popups de arranque solo se deciden una vez por sesión aunque HomePage se
// vuelva a montar al navegar entre páginas.
let launchDialogChecked = false
</script>

<script setup>
import CardMiTransistor from 'src/components/CardMiTransistor.vue'
import ChangelogDialog from 'src/components/ChangelogDialog.vue'
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { Capacitor } from '@capacitor/core'
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update'
import { useChangelogStore } from 'src/stores/useChangelogStore'
import { useMessagesStore } from 'src/stores/useMessagesStore'
import { CHANGELOG } from 'src/data/changelog'
import { fetchActiveMessages } from 'src/services/messages'
import { openPlayStore, useReviewPrompt } from 'src/composables/useReviewPrompt'

const router = useRouter()
const $q = useQuasar()
const { t, locale } = useI18n()
const changelogStore = useChangelogStore()
const messagesStore = useMessagesStore()
const { maybeShowReviewPrompt } = useReviewPrompt()

const showChangelog = ref(false)
const latestChangelogEntry = CHANGELOG[0]

const showMessage = ref(false)
const currentMessage = ref(null)
const currentMessageTitle = computed(() => {
  const title = currentMessage.value?.title
  return title ? (title[locale.value] ?? title.es ?? null) : null
})

function checkChangelog() {
  const latestVersion = latestChangelogEntry.version

  // lastSeenVersion === null solo puede pasar en una instalación realmente
  // nueva (boot/pinia.js siembra '' para quien ya tenía la app instalada):
  // no vivió ninguna novedad anterior, así que no se le muestra nada.
  if (changelogStore.lastSeenVersion === null) {
    changelogStore.markSeen(latestVersion)
    return false
  }

  if (changelogStore.hasUnseenVersion(latestVersion)) {
    showChangelog.value = true
    changelogStore.markSeen(latestVersion)
    return true
  }
  return false
}

function showPendingMessage(messages) {
  const message = messages.find((msg) => !messagesStore.isShown(msg.id))
  if (!message) return false

  currentMessage.value = message
  showMessage.value = true
  messagesStore.markShown(message.id)
  return true
}

// Solo comprueba si hay actualización; el popup lo muestra showUpdateDialog()
async function isUpdateAvailable() {
  // La comprobación solo funciona en el dispositivo (Android/iOS), no en el navegador
  if (!Capacitor.isNativePlatform()) return false
  try {
    const info = await AppUpdate.getAppUpdateInfo()
    return info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE
  } catch {
    // Si la comprobación falla (sin conexión, no instalada desde Play, etc.) no molestamos al usuario
    return false
  }
}

function showUpdateDialog() {
  $q.dialog({
    title: t('update.title'),
    message: t('update.message'),
    html: true,
    persistent: true,
    ok: {
      label: t('update.ok'),
      color: 'primary',
      unelevated: true,
    },
    cancel: {
      label: t('update.cancel'),
      flat: true,
      color: 'grey-7',
    },
  }).onOk(() => {
    openPlayStore()
  })
}

// Popups de arranque: como mucho UNO por sesión, para no encadenar varios
// seguidos. Prioridad: actualización > mensaje programado (caduca) >
// novedades (si se aplazan salen en el siguiente arranque, porque solo se
// marcan como vistas al mostrarse) > reseña (ya tiene su propio aplazamiento).
async function showLaunchDialog() {
  if (launchDialogChecked) return
  launchDialogChecked = true

  const [updateAvailable, messages] = await Promise.all([
    isUpdateAvailable(),
    fetchActiveMessages(),
  ])

  if (updateAvailable) {
    showUpdateDialog()
    return
  }
  if (showPendingMessage(messages)) return
  if (checkChangelog()) return
  if (Capacitor.isNativePlatform()) maybeShowReviewPrompt()
}

const headlines = ref([])
const currentIndex = ref(0)
const visible = ref(true)
const fetchError = ref(false)

// 20minutos no manda cabeceras CORS: en la app nativa CapacitorHttp se salta
// esa restricción, pero en la versión web hace falta pasar por nuestra propia
// función de Netlify que hace la petición desde el servidor (ver netlify/functions/news.js).
const RSS_URL = Capacitor.isNativePlatform()
  ? 'https://www.20minutos.es/rss/'
  : '/.netlify/functions/news'

async function fetchHeadlines() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(RSS_URL, { signal: controller.signal })
    clearTimeout(timeout)
    const text = await res.text()
    const xml = new DOMParser().parseFromString(text, 'text/xml')
    const items = Array.from(xml.querySelectorAll('item')).slice(0, 7)
    if (items.length) {
      headlines.value = items.map((item) => item.querySelector('title')?.textContent ?? '')
      currentIndex.value = 0
      fetchError.value = false
    } else {
      fetchError.value = true
    }
  } catch {
    fetchError.value = true
  }
}

let rotateTimer = null
let refreshTimer = null

function startRotation() {
  rotateTimer = setInterval(() => {
    visible.value = false
    setTimeout(() => {
      currentIndex.value = (currentIndex.value + 1) % headlines.value.length
      visible.value = true
    }, 400)
  }, 7000)
}

function resetRotation() {
  clearInterval(rotateTimer)
  startRotation()
}

function goNext() {
  if (!headlines.value.length) return
  visible.value = false
  setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % headlines.value.length
    visible.value = true
  }, 400)
  resetRotation()
}

function goPrev() {
  if (!headlines.value.length) return
  visible.value = false
  setTimeout(() => {
    currentIndex.value = (currentIndex.value - 1 + headlines.value.length) % headlines.value.length
    visible.value = true
  }, 400)
  resetRotation()
}

let touchStartX = 0

function onTouchStart(e) {
  touchStartX = e.touches[0].clientX
}

function onTouchEnd(e) {
  const delta = touchStartX - e.changedTouches[0].clientX
  if (Math.abs(delta) < 50) return
  delta > 0 ? goNext() : goPrev()
}

onMounted(() => {
  showLaunchDialog()
  fetchHeadlines().then(() => {
    if (headlines.value.length) startRotation()
  })
  refreshTimer = setInterval(
    async () => {
      await fetchHeadlines()
    },
    30 * 60 * 1000,
  )
})

onUnmounted(() => {
  clearInterval(rotateTimer)
  clearInterval(refreshTimer)
})
</script>

<template>
  <q-page class="page-home">
    <div class="home-header q-px-lg q-pt-xl q-pb-md">
      <div class="question-text">{{ t('home.question') }}</div>
    </div>

    <div class="cards-grid">
      <CardMiTransistor
        variant="favorites"
        :title="t('home.favoritesTitle')"
        :subtitle="t('home.favoritesSubtitle')"
        @click="router.push({ name: 'favorites-stations' })"
      >
        <template #icon><span style="font-size: 28px">❤️</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="stations"
        :title="t('home.stationsTitle')"
        :subtitle="t('home.stationsSubtitle')"
        @click="router.push({ name: 'stations-list' })"
      >
        <template #icon><span style="font-size: 28px">📡</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="recent"
        :title="t('home.recentTitle')"
        :subtitle="t('home.recentSubtitle')"
        @click="router.push({ name: 'recents-stations' })"
      >
        <template #icon><span style="font-size: 28px">🕐</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="about"
        title="Mi Transistor"
        :subtitle="t('home.aboutSubtitle')"
        @click="router.push({ name: 'about-app' })"
      >
        <template #icon><span style="font-size: 28px">📻</span></template>
      </CardMiTransistor>
    </div>

    <div class="news-section q-px-lg q-py-md">
      <div class="news-label">
        <q-icon name="newspaper" size="14px" class="q-mr-xs" />
        {{ t('home.headlines') }}
      </div>

      <div v-if="fetchError" class="news-error">
        <q-icon name="info_outline" size="16px" class="q-mr-xs" />
        {{ t('home.noHeadlines') }}
      </div>

      <template v-else-if="headlines.length">
        <div class="news-swipe-area" @touchstart="onTouchStart" @touchend="onTouchEnd">
          <Transition name="fade">
            <div v-if="visible" :key="currentIndex" class="news-headline">
              {{ headlines[currentIndex] }}
            </div>
          </Transition>
        </div>
        <div class="news-controls">
          <q-btn
            flat
            round
            dense
            icon="chevron_left"
            size="xs"
            class="news-arrow"
            @click="goPrev"
          />
          <div class="news-dots">
            <span
              v-for="(_, i) in headlines"
              :key="i"
              class="dot"
              :class="{ active: i === currentIndex }"
            />
          </div>
          <q-btn
            flat
            round
            dense
            icon="chevron_right"
            size="xs"
            class="news-arrow"
            @click="goNext"
          />
        </div>
      </template>
    </div>

    <ChangelogDialog v-model="showChangelog" :entry="latestChangelogEntry" />
    <ChangelogDialog
      v-if="currentMessage"
      v-model="showMessage"
      :entry="currentMessage"
      :title="currentMessageTitle"
    />
  </q-page>
</template>

<style scoped>
.home-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.welcome-text {
  font-size: 16px;
  color: rgba(200, 146, 42, 0.8);
  letter-spacing: 0.5px;
}
.question-text {
  font-size: 26px;
  font-weight: 700;
  color: #f5ecd7;
  line-height: 1.2;
}
.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}

.news-section {
  min-height: 90px;
}

.news-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(200, 146, 42, 0.7);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.news-error {
  font-size: 13px;
  color: rgba(200, 146, 42, 0.5);
  display: flex;
  align-items: center;
  font-style: italic;
}

.news-swipe-area {
  min-height: 42px;
}

.news-headline {
  font-size: 15px;
  font-weight: 600;
  color: #f5ecd7;
  line-height: 1.4;
  min-height: 42px;
}

.news-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.news-arrow {
  color: rgba(200, 146, 42, 0.6);
  flex-shrink: 0;
}

.news-arrow:hover {
  color: rgba(200, 146, 42, 1);
}

.news-dots {
  display: flex;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(200, 146, 42, 0.3);
  transition: background 0.3s;
}

.dot.active {
  background: rgba(200, 146, 42, 0.9);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
