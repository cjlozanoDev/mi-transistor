<script setup>
import CardMiTransistor from 'src/components/CardMiTransistor.vue'
import ChangelogDialog from 'src/components/ChangelogDialog.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update'
import { useChangelogStore } from 'src/stores/useChangelogStore'
import { CHANGELOG } from 'src/data/changelog'

const router = useRouter()
const $q = useQuasar()
const changelogStore = useChangelogStore()

const showChangelog = ref(false)
const latestChangelogEntry = CHANGELOG[0]

function checkChangelog() {
  const latestVersion = latestChangelogEntry.version

  // lastSeenVersion === null solo puede pasar en una instalación realmente
  // nueva (boot/pinia.js siembra '' para quien ya tenía la app instalada):
  // no vivió ninguna novedad anterior, así que no se le muestra nada.
  if (changelogStore.lastSeenVersion === null) {
    changelogStore.markSeen(latestVersion)
    return
  }

  if (changelogStore.hasUnseenVersion(latestVersion)) {
    showChangelog.value = true
    changelogStore.markSeen(latestVersion)
  }
}

// Plugin nativo propio: abre Google Play directamente, sin selector de apps
const StoreOpener = registerPlugin('StoreOpener')
const PACKAGE_NAME = 'com.mitransistor.app'

function openPlayStore() {
  // Forzamos Google Play con nuestro plugin; si fallara, usamos el del sistema
  StoreOpener.openPlayStore({ packageName: PACKAGE_NAME }).catch(() => {
    AppUpdate.openAppStore()
  })
}

async function checkForUpdate() {
  // La comprobación solo funciona en el dispositivo (Android/iOS), no en el navegador
  if (!Capacitor.isNativePlatform()) return
  try {
    const info = await AppUpdate.getAppUpdateInfo()
    if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return

    $q.dialog({
      title: '📻 Nueva versión disponible',
      message:
        'Hay una versión más reciente de Mi Transistor.<br><br>' +
        'Pulse <b>Actualizar</b> y se abrirá <b>Google Play</b>. ' +
        'Allí solo tiene que pulsar el botón <b>Actualizar</b> para tener la última versión.',
      html: true,
      persistent: true,
      ok: {
        label: 'Actualizar',
        color: 'primary',
        unelevated: true,
      },
      cancel: {
        label: 'Ahora no',
        flat: true,
        color: 'grey-7',
      },
    }).onOk(() => {
      openPlayStore()
    })
  } catch {
    // Si la comprobación falla (sin conexión, no instalada desde Play, etc.) no molestamos al usuario
  }
}

const headlines = ref([])
const currentIndex = ref(0)
const visible = ref(true)
const fetchError = ref(false)

const RSS_URL = 'https://www.20minutos.es/rss/'

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
  checkForUpdate()
  checkChangelog()
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
      <div class="question-text">¿Qué quieres escuchar hoy?</div>
    </div>

    <div class="cards-grid">
      <CardMiTransistor
        variant="favorites"
        title="Mis Favoritas"
        subtitle="Tus emisoras guardadas"
        @click="router.push({ name: 'favorites-stations' })"
      >
        <template #icon><span style="font-size: 28px">❤️</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="stations"
        title="Todas las emisoras"
        subtitle="Explora emisoras"
        @click="router.push({ name: 'stations-list' })"
      >
        <template #icon><span style="font-size: 28px">📡</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="recent"
        title="Últimas Escuchadas"
        subtitle="Tu historial reciente"
        @click="router.push({ name: 'recents-stations' })"
      >
        <template #icon><span style="font-size: 28px">🕐</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="about"
        title="Mi Transistor"
        subtitle="Acerca de la app"
        @click="router.push({ name: 'about-app' })"
      >
        <template #icon><span style="font-size: 28px">📻</span></template>
      </CardMiTransistor>
    </div>

    <div class="news-section q-px-lg q-py-md">
      <div class="news-label">
        <q-icon name="newspaper" size="14px" class="q-mr-xs" />
        Titulares de hoy
      </div>

      <div v-if="fetchError" class="news-error">
        <q-icon name="info_outline" size="16px" class="q-mr-xs" />
        No hay titulares disponibles en este momento
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
