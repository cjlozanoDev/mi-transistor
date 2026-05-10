import { defineStore } from 'pinia'
import fallbackRadios from '../data/radios.json'

export const useStationsStore = defineStore('stations', {
  state: () => ({
    listStations: [],
    stationsTimestamp: null,
    isLoading: false,
    favorites: [],
    recentStations: [],
  }),
  actions: {
    _parseStations(data) {
      this.listStations = data.countries
        .find((country) => country.name === 'Spain')
        .ambits.flatMap((a) => a.channels)
      this.stationsTimestamp = Date.now()
    },
    async loadStations() {
      const CACHE_DURATION = 24 * 60 * 60 * 1000
      if (
        this.stationsTimestamp &&
        this.listStations.length > 0 &&
        Date.now() - this.stationsTimestamp < CACHE_DURATION
      ) {
        console.log('Usando caché')
        return
      }

      this.isLoading = true
      try {
        console.log('Fetching emisoras...')
        const response = await fetch('https://www.tdtchannels.com/lists/radio.json', {
          signal: AbortSignal.timeout(5000),
        })
        const data = await response.json()
        this._parseStations(data)
      } catch (e) {
        console.error('Error cargando emisoras, usando fallback:', e)
        this._parseStations(fallbackRadios)
      } finally {
        this.isLoading = false
      }
    },
    toggleFavorite(station) {
      const idx = this.favorites.findIndex((favorite) => favorite.epg_id === station.epg_id)
      if (idx === -1) {
        this.favorites.push(station)
      } else {
        this.favorites.splice(idx, 1)
      }
    },
    addToRecent(station) {
      const filtered = this.recentStations.filter((s) => s.epg_id !== station.epg_id)
      this.recentStations = [station, ...filtered].slice(0, 10)
    },
  },
  getters: {
    getStreamUrl: () => (station) => {
      const mp3 = station.options?.find((o) => o.format === 'mp3')
      return (mp3 || station.options?.[0])?.url ?? null
    },
    isFavorite: (state) => (epgId) => state.favorites.some((favorite) => favorite.epg_id === epgId),
  },
  persist: true,
})
