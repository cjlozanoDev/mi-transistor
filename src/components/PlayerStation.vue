<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { registerPlugin } from '@capacitor/core'
import { usePlayerStore } from 'src/stores/usePlayerStore'
import { useStationsStore } from 'src/stores/useStationsStore'
import { useQuasar } from 'quasar'

const AudioPlayer = registerPlugin('AudioPlayer')

const playerStore = usePlayerStore()
const stationStore = useStationsStore()
const $q = useQuasar()

const logoFailed = ref(false)
const isBuffering = ref(false)
const isActuallyPlaying = ref(false)
const hasPlayedOnce = ref(false)
const isReconnecting = ref(false)

const RECONNECT_DELAY_MS = 3000
let reconnectTimer = null
let stateHandle = null
let errorHandle = null

const cancelReconnect = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  isReconnecting.value = false
}

const scheduleReconnect = () => {
  isReconnecting.value = true
  isActuallyPlaying.value = false
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (playerStore.isPlaying) callPlay()
  }, RECONNECT_DELAY_MS)
}

const isConnecting = computed(
  () =>
    isBuffering.value &&
    !hasPlayedOnce.value &&
    playerStore.isPlaying &&
    !isReconnecting.value,
)

const isStationFavorite = computed(() => {
  if (!playerStore.currentStation) return false
  return stationStore.isFavorite(playerStore.currentStation.epg_id)
})

const callPlay = async () => {
  const st = playerStore.currentStation
  if (!st || !playerStore.streamUrl) return
  hasPlayedOnce.value = false
  isActuallyPlaying.value = false
  isBuffering.value = true
  try {
    await AudioPlayer.play({
      url: playerStore.streamUrl,
      title: st.name ?? 'Mi Transistor',
      artist: 'Radio en directo',
      artwork: st.logo ?? '',
    })
  } catch {
    /* no-op on web */
  }
}

const callStop = async () => {
  cancelReconnect()
  isBuffering.value = false
  isActuallyPlaying.value = false
  hasPlayedOnce.value = false
  try {
    await AudioPlayer.stop()
  } catch {
    /* no-op on web */
  }
}

const callUpdateMetadata = async () => {
  const st = playerStore.currentStation
  if (!st) return
  try {
    await AudioPlayer.updateMetadata({
      title: st.name ?? 'Mi Transistor',
      artist: 'Radio en directo',
      artwork: st.logo ?? '',
    })
  } catch {
    /* no-op on web */
  }
}

watch(
  () => playerStore.currentStation,
  () => {
    logoFailed.value = false
    if (playerStore.isPlaying) callUpdateMetadata()
  },
)

const userPlay = () => {
  cancelReconnect()
  callPlay()
}

// Reconcile UI/store with the real native player state. Only syncs the
// "is active" direction so an error-driven IDLE never cancels a reconnect.
let suppressPlayWatch = false
const reconcilePlaying = (nativeActive) => {
  if (nativeActive && !playerStore.isPlaying) {
    suppressPlayWatch = true
    playerStore.isPlaying = true
    suppressPlayWatch = false
  }
}

watch(
  () => playerStore.playTrigger,
  () => userPlay(),
)

watch(
  () => playerStore.isPlaying,
  (playing) => {
    if (suppressPlayWatch) return
    if (playing) userPlay()
    else callStop()
  },
  { flush: 'sync' },
)

onMounted(async () => {
  try {
    stateHandle = await AudioPlayer.addListener('state', (s) => {
      const buffering = !!s.isBuffering
      const playing = !!s.isPlaying && !buffering
      isBuffering.value = buffering
      isActuallyPlaying.value = playing
      if (playing) {
        hasPlayedOnce.value = true
        cancelReconnect()
      }
      reconcilePlaying(!!s.isPlaying)
    })
    errorHandle = await AudioPlayer.addListener('error', () => {
      if (playerStore.isPlaying) scheduleReconnect()
    })

    const s = await AudioPlayer.getState()
    const buffering = !!s.isBuffering
    isBuffering.value = buffering
    isActuallyPlaying.value = !!s.isPlaying && !buffering
    if (isActuallyPlaying.value) hasPlayedOnce.value = true
    reconcilePlaying(!!s.isPlaying)
  } catch {
    /* no-op on web */
  }
})

onUnmounted(() => {
  cancelReconnect()
  if (stateHandle) stateHandle.remove()
  if (errorHandle) errorHandle.remove()
})

const togglePlay = () => {
  if (playerStore.isPlaying) {
    cancelReconnect()
    playerStore.stop()
  } else {
    playerStore.isPlaying = true
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
        <span class="status-text">Reconectando...</span>
      </div>

      <div v-else-if="isConnecting" class="player-status">
        <q-spinner-dots color="secondary" size="16px" />
        <span class="status-text">Conectando...</span>
      </div>
      <div v-else-if="isActuallyPlaying" class="player-status">
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
