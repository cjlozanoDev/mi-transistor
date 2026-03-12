<script setup>
import { useStationsStore } from 'src/stores/useStationsStore'
import { usePlayerStore } from 'src/stores/usePlayerStore'
import { ref, computed } from 'vue'
import SubHeader from 'src/components/SubHeader.vue'

const stationsStore = useStationsStore()
const playerStore = usePlayerStore()

const searchStation = ref('')
const failedLogos = ref(new Set())

const onStationTap = (station) => {
  const url = stationsStore.getStreamUrl(station)
  if (url) playerStore.play(station, url)
}

const onImgError = (station) => {
  failedLogos.value = new Set([...failedLogos.value, station.name])
}

const filteredStations = computed(() => {
  if (!searchStation.value) return stationsStore.listStations
  const q = searchStation.value.toLowerCase()
  return stationsStore.listStations.filter((s) => s.name.toLowerCase().includes(q))
})
</script>

<template>
  <q-page class="bg-dark-page">
    <SubHeader title-route="Todas las Radios" back-name-route="home" />

    <div class="q-px-md q-pt-md q-pb-sm">
      <q-input
        v-model="searchStation"
        placeholder="Buscar emisora..."
        filled
        rounded
        dark
        clearable
        input-style="font-size: 18px"
      >
        <template #prepend>
          <q-icon name="search" color="secondary" />
        </template>
      </q-input>
    </div>

    <template v-if="stationsStore.isLoading">
      <div class="stations-list q-px-md q-pt-sm">
        <div v-for="n in 8" :key="n" class="station-skeleton-row">
          <q-skeleton type="QAvatar" size="52px" dark />
          <div class="skeleton-text">
            <q-skeleton type="text" width="60%" height="18px" dark />
            <q-skeleton type="text" width="35%" height="14px" dark class="q-mt-xs" />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="stations-grid">
        <div
          v-for="station in filteredStations"
          :key="station.name"
          class="station-item"
          @click="onStationTap(station)"
        >
          <div class="station-logo-wrap">
            <img
              v-if="station.logo && !failedLogos.has(station.name)"
              :src="station.logo"
              :alt="station.name"
              class="station-logo"
              @error="onImgError(station)"
            />
            <q-icon v-else name="radio" size="32px" color="secondary" />
          </div>
          <div class="station-name">{{ station.name }}</div>
        </div>
      </div>
    </template>
  </q-page>
</template>

<style scoped>
.stations-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  justify-content: center;
}

.station-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100px;
  cursor: pointer;
}

.station-logo-wrap {
  width: 100px;
  height: 100px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(44, 26, 14, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.station-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.station-name {
  font-size: 12px;
  color: var(--q-secondary);
  text-align: center;
  line-height: 1.2;
  /* recorta nombres muy largos */
  display: -webkit-box;

  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
