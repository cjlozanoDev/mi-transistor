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
const selectedLatamCountry = ref(null)
const showCountrySheet = ref(false)

const COUNTRY_FLAGS = {
  Argentina: '🇦🇷',
  Venezuela: '🇻🇪',
  Bolivia: '🇧🇴',
  Chile: '🇨🇱',
  Colombia: '🇨🇴',
  Ecuador: '🇪🇨',
  México: '🇲🇽',
  Paraguay: '🇵🇾',
  Perú: '🇵🇪',
  'Puerto Rico': '🇵🇷',
  Uruguay: '🇺🇾',
}

const countryOptions = [
  { label: 'España', value: 'España' },
  { label: 'Latinoamérica', value: 'Latinoamérica' },
]

const showingLatinoamerica = computed(
  () => props.showCountryFilter && selectedCountry.value === 'Latinoamérica',
)

const selectedCountryLabel = computed(() => {
  if (!selectedLatamCountry.value) return 'Todos los países'
  const found = stationsStore.latinoamericaCountries.find(
    (c) => c.value === selectedLatamCountry.value,
  )
  return found ? found.label : 'Todos los países'
})

const selectedCountryFlag = computed(() => COUNTRY_FLAGS[selectedCountryLabel.value] ?? '🌍')

const isLoadingList = computed(() =>
  showingLatinoamerica.value ? stationsStore.isLoadingLatinoamerica : stationsStore.isLoading,
)

const baseStations = computed(() => {
  if (!showingLatinoamerica.value) return props.stations
  const all = stationsStore.listStationsLatinoamerica
  if (!selectedLatamCountry.value) return all
  return all.filter((s) => s.country === selectedLatamCountry.value)
})

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

    <div v-if="showingLatinoamerica" class="q-px-md q-pb-sm">
      <q-btn flat rounded no-caps class="country-btn full-width" @click="showCountrySheet = true">
        <span class="country-btn__flag">{{ selectedCountryFlag }}</span>
        <span class="country-btn__label">{{ selectedCountryLabel }}</span>
        <q-icon name="keyboard_arrow_down" color="secondary" size="20px" class="q-ml-auto" />
      </q-btn>
    </div>

    <q-dialog v-model="showCountrySheet" position="bottom">
      <q-card dark class="country-sheet">
        <q-card-section class="row items-center q-pb-sm">
          <span class="text-subtitle1 text-white text-weight-medium">Selecciona un país</span>
          <q-space />
          <q-btn icon="close" flat round dense color="white" v-close-popup />
        </q-card-section>
        <q-separator dark />
        <q-list dark padding>
          <q-item
            clickable
            v-close-popup
            @click="selectedLatamCountry = null"
            :active="!selectedLatamCountry"
            active-class="text-secondary"
          >
            <q-item-section class="country-sheet__flag">🌍</q-item-section>
            <q-item-section>Todos los países</q-item-section>
            <q-item-section side>
              <q-icon v-if="!selectedLatamCountry" name="check" color="secondary" />
            </q-item-section>
          </q-item>
          <q-item
            v-for="country in stationsStore.latinoamericaCountries"
            :key="country.value"
            clickable
            v-close-popup
            @click="selectedLatamCountry = country.value"
            :active="selectedLatamCountry === country.value"
            active-class="text-secondary"
          >
            <q-item-section class="country-sheet__flag">
              {{ COUNTRY_FLAGS[country.label] ?? '🏳️' }}
            </q-item-section>
            <q-item-section>{{ country.label }}</q-item-section>
            <q-item-section side>
              <q-icon
                v-if="selectedLatamCountry === country.value"
                name="check"
                color="secondary"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

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
              loading="lazy"
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

.country-btn {
  background: rgba(255, 255, 255, 0.08);
  color: var(--q-secondary);
  font-size: 14px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  justify-content: flex-start;
  gap: 8px;
}

.country-btn__flag {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}

.country-btn__label {
  color: var(--q-secondary);
  font-size: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
}

.country-sheet {
  width: 100%;
  border-radius: 20px 20px 0 0;
  max-height: 70vh;
  overflow-y: auto;
}

.country-sheet__flag {
  font-size: 22px;
  flex: 0 0 40px !important;
  min-width: 40px !important;
  max-width: 40px !important;
}
</style>
