import { defineStore } from 'pinia'

export const useStationsStore = defineStore('stations', {
  state: () => ({
    listStations: [],
    stationsTimestamp: null,
    isLoading: false,
  }),
  actions: {
    async loadStations() {
      const CACHE_DURATION = 24 * 60 * 60 * 1000
      if (
        this.stationsTimestamp &&
        this.listStations.length > 0 &&
        Date.now() - this.stationsTimestamp < CACHE_DURATION
      ) {
        return
      }

      this.isLoading = true
      try {
        const response = await fetch('https://www.tdtchannels.com/lists/radio.json')
        const data = await response.json()
        this.listStations = data.countries
          .find((country) => country.name === 'Spain')
          .ambits.flatMap((a) => a.channels)
        this.stationsTimestamp = Date.now()
      } finally {
        this.isLoading = false
      }
    },
  },
  getters: {
    getStreamUrl: () => (station) => {
      const mp3 = station.options?.find((o) => o.format === 'mp3')
      return (mp3 || station.options?.[0])?.url ?? null
    },
  },
  persist: true,
})
