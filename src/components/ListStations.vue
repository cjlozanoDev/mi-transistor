<script setup>
import { useStationsStore } from 'src/stores/useStationsStore'
import { usePlayerStore } from 'src/stores/usePlayerStore'
import { ref, computed } from 'vue'

const props = defineProps({
  stations: {
    type: Array,
    required: true,
  },
  showCountryFilter: {
    type: Boolean,
    default: false,
  },
})

const stationsStore = useStationsStore()
const playerStore = usePlayerStore()

const searchStation = ref('')
const failedLogos = ref(new Set())
const selectedCountry = ref('España')

const countryOptions = [
  { label: 'España', value: 'España' },
  { label: 'Latinoamérica', value: 'Latinoamérica' },
]

const showingLatinoamerica = computed(
  () => props.showCountryFilter && selectedCountry.value === 'Latinoamérica',
)

const isLoadingList = computed(() =>
  showingLatinoamerica.value ? stationsStore.isLoadingLatinoamerica : stationsStore.isLoading,
)

const baseStations = computed(() =>
  showingLatinoamerica.value ? stationsStore.listStationsLatinoamerica : props.stations,
)

const filteredStations = computed(() => {
  if (!searchStation.value) return baseStations.value
  const words = searchStation.value
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3)
  if (words.length === 0) return baseStations.value
  return baseStations.value.filter((s) => {
    const name = s.name.toLowerCase()
    return words.some((w) => name.includes(w))
  })
})

const onStationTap = (station) => {
  const url = stationsStore.getStreamUrl(station)
  if (url) playerStore.play(station, url)
}

const onImgError = (station) => {
  failedLogos.value = new Set([...failedLogos.value, station.name])
}
</script>

<template>
  <section>
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

    <div v-if="showCountryFilter" class="q-px-md q-pb-sm text-white">
      <q-option-group
        v-model="selectedCountry"
        :options="countryOptions"
        type="radio"
        color="secondary"
        inline
        dark
      />
    </div>

    <template v-if="isLoadingList">
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
          v-for="(station, index) in filteredStations"
          :key="`${index}-${station.name}`"
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
    <div v-if="filteredStations.length === 0" class="q-pa-xl text-center">
      <q-icon name="search_off" size="48px" color="secondary" class="q-mb-md" />
      <div style="font-size: 18px; color: #f5ecd7">No se ha encontrado ninguna emisora</div>
    </div>
  </section>
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
