<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { registerPlugin } from '@capacitor/core'
import { MediaSession } from '@capgo/capacitor-media-session'
import { usePlayerStore } from 'src/stores/usePlayerStore'
import { useStationsStore } from 'src/stores/useStationsStore'
import { useQuasar } from 'quasar'

const WakeLock = registerPlugin('WakeLock')
const acquireWakeLock = async () => { try { await WakeLock.acquire() } catch { /* no-op on web */ } }
const releaseWakeLock = async () => { try { await WakeLock.release() } catch { /* no-op on web */ } }

const playerStore = usePlayerStore()
const stationStore = useStationsStore()
const $q = useQuasar()

const audioEl = ref(null)
const logoFailed = ref(false)

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY_MS = 3000
const BUFFERING_TIMEOUT_MS = 8000
const isReconnecting = ref(false)
const reconnectAttempts = ref(0)
let reconnectTimer = null
let bufferingTimer = null

const clearBufferingTimer = () => {
  if (bufferingTimer) {
    clearTimeout(bufferingTimer)
    bufferingTimer = null
  }
}

const cancelReconnect = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  clearBufferingTimer()
  isReconnecting.value = false
  reconnectAttempts.value = 0
}

const attemptReconnect = () => {
  reconnectAttempts.value += 1
  isReconnecting.value = true

  reconnectTimer = setTimeout(() => {
    if (!audioEl.value || !playerStore.streamUrl || playerStore.stoppedByUser) {
      cancelReconnect()
      return
    }
    audioEl.value.src = playerStore.streamUrl
    audioEl.value.load()
    audioEl.value.play().catch(() => {})
  }, RECONNECT_DELAY_MS)
}

const isStationFavorite = computed(() => {
  if (!playerStore.currentStation) return false
  return stationStore.isFavorite(playerStore.currentStation.epg_id)
})

const updateMediaSession = async (station) => {
  await MediaSession.setMetadata({
    title: station?.name ?? 'Mi Transistor',
    artist: 'Radio en directo',
    album: 'Mi Transistor',
    artwork: station?.logo ? [{ src: station.logo, sizes: '512x512', type: 'image/jpeg' }] : [],
  })
  await MediaSession.setPlaybackState({ playbackState: 'playing' })
}

const clearMediaSession = async () => {
  await MediaSession.setPlaybackState({ playbackState: 'paused' })
}

const setupMediaSessionHandlers = async () => {
  await MediaSession.setActionHandler({ action: 'play' }, () => {
    playerStore.isPlaying = true
    playerStore.isBuffering = true
  })
  await MediaSession.setActionHandler({ action: 'pause' }, () => {
    playerStore.stop()
  })
  await MediaSession.setActionHandler({ action: 'stop' }, () => {
    playerStore.stop()
  })
}

watch(
  () => playerStore.currentStation,
  () => {
    logoFailed.value = false
  },
)

watch(
  () => playerStore.playTrigger,
  () => {
    if (!audioEl.value || !playerStore.streamUrl) return
    audioEl.value.src = playerStore.streamUrl
    audioEl.value.load()
    audioEl.value.play().catch(() => {})
  },
)

watch(
  () => playerStore.isPlaying,
  (playing) => {
    if (!audioEl.value) return
    if (playing) {
      if (playerStore.streamUrl) {
        audioEl.value.src = playerStore.streamUrl
        audioEl.value.load()
      }
      audioEl.value.play().catch(() => {})
      updateMediaSession(playerStore.currentStation)
      acquireWakeLock()
    } else {
      audioEl.value.pause()
      clearMediaSession()
      releaseWakeLock()
    }
  },
)

onMounted(() => {
  setupMediaSessionHandlers()
})

onUnmounted(() => {
  cancelReconnect()
  clearBufferingTimer()
})

const onAudioError = () => {
  if (playerStore.stoppedByUser || !playerStore.streamUrl) return

  if (reconnectAttempts.value >= MAX_RECONNECT_ATTEMPTS) {
    cancelReconnect()
    playerStore.stop()
    $q.notify({
      message: 'No se puede conectar con esta emisora',
      color: 'negative',
      position: 'top',
      timeout: 3000,
    })
    return
  }

  attemptReconnect()
}

const onAudioWaiting = () => {
  playerStore.setBuffering(true)
  clearBufferingTimer()
  if (!playerStore.stoppedByUser && playerStore.streamUrl) {
    bufferingTimer = setTimeout(() => {
      bufferingTimer = null
      onAudioError()
    }, BUFFERING_TIMEOUT_MS)
  }
}

const onAudioPlaying = () => {
  playerStore.setBuffering(false)
  clearBufferingTimer()
  if (isReconnecting.value) cancelReconnect()
}

const togglePlay = () => {
  if (playerStore.isPlaying) {
    cancelReconnect()
    playerStore.stop()
  } else {
    playerStore.isPlaying = true
    playerStore.isBuffering = true
  }
}

const toggleFavorite = (station) => {
  stationStore.toggleFavorite(station)
  const added = stationStore.isFavorite(station.epg_id)
  $q.notify({
    message: added ? 'Emisora añadida a favoritas' : 'Emisora eliminada de favoritas',
    color: added ? 'positive' : 'grey-7',
    position: 'bottom',
    timeout: 2000,
  })
}
</script>

<template>
  <div class="player-bar bg-primary">
    <div class="player-logo-wrap">
      <img
        v-if="playerStore.currentStation?.logo && !logoFailed"
        :src="playerStore.currentStation.logo"
        :alt="playerStore.currentStation.name"
        class="player-logo"
        @error="logoFailed = true"
      />
      <q-icon v-else name="radio" size="32px" color="secondary" />
    </div>

    <div class="player-info">
      <div class="player-name">{{ playerStore.currentStation?.name ?? 'Sin emisora' }}</div>

      <div v-if="isReconnecting" class="player-status">
        <q-spinner-dots color="secondary" size="16px" />
        <span class="status-text">Reconectando ({{ reconnectAttempts }}/{{ MAX_RECONNECT_ATTEMPTS }})...</span>
      </div>
      <div v-else-if="playerStore.isBuffering" class="player-status">
        <q-spinner-dots color="secondary" size="16px" />
        <span class="status-text">Conectando...</span>
      </div>
      <div v-else-if="playerStore.isPlaying" class="player-status">
        <span class="live-dot" />
        <span class="status-text">En antena</span>
      </div>
      <div v-else-if="playerStore.stoppedByUser" class="player-status">
        <span class="status-text">Parada</span>
      </div>
    </div>

    <q-btn
      flat
      round
      :icon="isStationFavorite ? 'favorite' : 'favorite_border'"
      :disable="!playerStore.currentStation"
      @click="toggleFavorite(playerStore.currentStation)"
      :color="isStationFavorite ? 'red' : 'warm-white'"
      size="15px"
      class="player-btn"
    />

    <q-btn
      flat
      round
      :disable="!playerStore.currentStation"
      :icon="playerStore.isPlaying ? 'stop' : 'play_arrow'"
      size="18px"
      class="player-btn player-btn--main"
      @click="togglePlay"
    />

    <audio
      ref="audioEl"
      @playing="onAudioPlaying"
      @waiting="onAudioWaiting"
      @error="onAudioError"
    />
  </div>
</template>

<style scoped>
.player-bar {
  display: flex;
  align-items: center;
  height: 80px;
  padding: 0 14px;
  gap: 12px;
}

.player-logo-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.player-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-name {
  font-size: 16px;
  font-weight: 600;
  color: #f5ecd7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-text {
  font-size: 12px;
  color: rgba(245, 236, 215, 0.6);
}

.stopped-text {
  color: rgba(245, 236, 215, 0.35);
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4caf82;
  flex-shrink: 0;
  animation: pulse 1.8s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(0.8);
  }
}

.player-btn {
  flex-shrink: 0;
  color: #f5ecd7;
}

.player-btn--main {
  background: rgba(0, 0, 0, 0.22);
  border-radius: 50%;
  width: 44px;
  height: 44px;
}
</style>
