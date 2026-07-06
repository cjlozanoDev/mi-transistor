import { defineStore } from 'pinia'
import fallbackRadios from '../data/radios.json'
import fallbackRadiosLatinoamerica from '../data/radios-latinoamerica.json'

const CACHE_DURATION = 24 * 60 * 60 * 1000
const COUNTRIES_LATINOAMERICA = ['PE', 'MX', 'AR', 'CO', 'CL', 'VE', 'UY', 'BO', 'EC', 'PY', 'PR', 'CR']

// Ámbitos de la API que son comunidades/ciudades autónomas (el resto son
// categorías como "Populares", "Musicales", etc., que se ignoran para el filtro).
const COMUNIDADES_AUTONOMAS = new Set([
  'Andalucía',
  'Aragón',
  'Canarias',
  'Cantabria',
  'Castilla-La Mancha',
  'Castilla y León',
  'Cataluña',
  'Ceuta',
  'C. de Madrid',
  'C. Foral de Navarra',
  'C. Valenciana',
  'Extremadura',
  'Galicia',
  'Illes Balears',
  'La Rioja',
  'Melilla',
  'País Vasco',
  'P. de Asturias',
  'R. de Murcia',
])

// Nombres que devuelve la API (en inglés) -> etiqueta bonita en español
const COUNTRY_LABELS = {
  Argentina: 'Argentina',
  'Bolivarian Republic Of Venezuela': 'Venezuela',
  Bolivia: 'Bolivia',
  Chile: 'Chile',
  Colombia: 'Colombia',
  'Costa Rica': 'Costa Rica',
  Ecuador: 'Ecuador',
  Mexico: 'México',
  Paraguay: 'Paraguay',
  Peru: 'Perú',
  'Puerto Rico': 'Puerto Rico',
  Uruguay: 'Uruguay',
}

export const useStationsStore = defineStore('stations', {
  state: () => ({
    listStations: [],
    stationsTimestamp: null,
    listStationsLatinoamerica: [],
    stationsLatinoamericaTimestamp: null,
    isLoading: false,
    isLoadingLatinoamerica: false,
    favorites: [],
    recentStations: [],
  }),
  actions: {
    _parseStations(data) {
      this.listStations = data.countries
        .find((country) => country.name === 'Spain')
        .ambits.flatMap((a) =>
          COMUNIDADES_AUTONOMAS.has(a.name)
            ? a.channels.map((channel) => ({ ...channel, comunidadAutonoma: a.name }))
            : a.channels,
        )
      this.stationsTimestamp = Date.now()
    },
    _parseStationsLatinoamerica(data) {
      this.listStationsLatinoamerica = data.map((s) => ({
        name: s.name,
        logo: s.favicon,
        epg_id: s.stationuuid,
        country: s.country,
        options: [{ format: 'mp3', url: s.url_resolved || s.url }],
      }))

      this.stationsLatinoamericaTimestamp = Date.now()
    },
    _isCacheValid(timestamp, list) {
      return timestamp && list.length > 0 && Date.now() - timestamp < CACHE_DURATION
    },
    async loadStations() {
      // Las latinoamericanas se cargan en segundo plano, sin bloquear el spinner
      this.loadStationsLatinoamerica()

      if (this._isCacheValid(this.stationsTimestamp, this.listStations)) return

      this.isLoading = true
      try {
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
    async loadStationsLatinoamerica() {
      if (this._isCacheValid(this.stationsLatinoamericaTimestamp, this.listStationsLatinoamerica))
        return

      this.isLoadingLatinoamerica = true
      try {
        const requests = COUNTRIES_LATINOAMERICA.map((code) =>
          fetch(
            `https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/${code}?limit=50&hidebroken=true&order=clickcount&reverse=true`,
            { signal: AbortSignal.timeout(5000) },
          ),
        )
        const responses = await Promise.all(requests)
        const parsed = await Promise.all(responses.map((r) => r.json()))
        this._parseStationsLatinoamerica(parsed.flat())
      } catch (e) {
        console.error('Error cargando emisoras de Latinoamérica, usando fallback:', e)
        // El fallback ya está en el formato de la app, no necesita parseo
        // (.flat() por si el JSON viniera anidado, así nunca queda sin países)
        this.listStationsLatinoamerica = fallbackRadiosLatinoamerica.flat()
        this.stationsLatinoamericaTimestamp = Date.now()
      } finally {
        this.isLoadingLatinoamerica = false
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
    latinoamericaCountries: (state) => {
      const countries = new Set(
        state.listStationsLatinoamerica.map((s) => s.country).filter(Boolean),
      )
      return [...countries]
        .map((c) => ({ label: COUNTRY_LABELS[c] ?? c, value: c }))
        .sort((a, b) => a.label.localeCompare(b.label))
    },
    comunidadesAutonomas: (state) => {
      const comunidades = new Set(
        state.listStations.map((s) => s.comunidadAutonoma).filter(Boolean),
      )
      return [...comunidades]
        .map((c) => ({ label: c, value: c }))
        .sort((a, b) => a.label.localeCompare(b.label))
    },
  },
  persist: {
    // Subir la versión cuando cambie el formato de los datos guardados,
    // así la caché antigua (sin nuevos campos) se ignora y se recarga limpia.
    key: 'stations-v3',
  },
})
