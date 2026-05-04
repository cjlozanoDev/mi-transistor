<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { registerPlugin } from '@capacitor/core'
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

const isStationFavorite = computed(() => {
  if (!playerStore.currentStation) return false
  return stationStore.isFavorite(playerStore.currentStation.epg_id)
})

const updateMediaSession = (station) => {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: station?.name ?? 'Mi Transistor',
    artist: 'Radio en directo',
    album: 'Mi Transistor',
    artwork: station?.logo ? [{ src: station.logo, sizes: '512x512', type: 'image/jpeg' }] : [],
  })
  navigator.mediaSession.playbackState = 'playing'
}

const clearMediaSession = () => {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.playbackState = 'paused'
}

const setupMediaSessionHandlers = () => {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.setActionHandler('play', () => {
    playerStore.isPlaying = true
    playerStore.isBuffering = true
  })
  navigator.mediaSession.setActionHandler('pause', () => {
    playerStore.stop()
  })
  navigator.mediaSession.setActionHandler('stop', () => {
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
  () => playerStore.streamUrl,
  (url) => {
    if (!audioEl.value || !url) return
    audioEl.value.src = url
    audioEl.value.load()
    audioEl.value.play().catch(() => {})
  },
)

watch(
  () => playerStore.isPlaying,
  (playing) => {
    if (!audioEl.value) return
    if (playing) {
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

const onAudioError = () => {
  playerStore.stop()
  $q.notify({
    message: 'No se puede conectar con esta emisora',
    color: 'negative',
    position: 'top',
    timeout: 3000,
  })
}

const togglePlay = () => {
  if (playerStore.isPlaying) {
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

      <div v-if="playerStore.isBuffering" class="player-status">
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
      @playing="playerStore.setBuffering(false)"
      @waiting="playerStore.setBuffering(true)"
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
