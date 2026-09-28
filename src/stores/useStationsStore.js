import { defineStore } from 'pinia'
import { Capacitor } from '@capacitor/core'
import fallbackRadios from '../data/radios.json'
import fallbackRadiosLatinoamerica from '../data/radios-latinoamerica.json'
import fallbackRadiosEuropa from '../data/radios-europa.json'

// tdtchannels.com no manda cabeceras CORS: en la app nativa CapacitorHttp se
// salta esa restricción, pero en la versión web hace falta pasar por nuestra
// propia función de Netlify (ver netlify/functions/stations.js).
const STATIONS_URL = Capacitor.isNativePlatform()
  ? 'https://www.tdtchannels.com/lists/radio.json'
  : '/.netlify/functions/stations'

const CACHE_DURATION = 24 * 60 * 60 * 1000
const COUNTRIES_LATINOAMERICA = [
  'PE',
  'MX',
  'AR',
  'CO',
  'CL',
  'VE',
  'UY',
  'BO',
  'EC',
  'PY',
  'PR',
  'CR',
  'BR',
]
// Emisoras añadidas a mano (peticiones de usuarios) que la API no devuelve en
// su top 50 o marca como caídas. Se muestran las primeras de su país, tanto con
// datos de la API como con el fallback. `epg_id` es el stationuuid de radio-browser.
const FEATURED_STATIONS_LATINOAMERICA = [
  {
    name: 'El Observador 107.9',
    logo: 'https://elobservador1079.com.ar/wp-content/uploads/2025/05/cropped-LOGO-EL-OB-ICON-512-270x270.png',
    epg_id: '00c34d7b-60c2-400c-86b3-dfc83c7651ab',
    country: 'Argentina',
    options: [{ format: 'mp3', url: 'https://redirector.dps.live/observador/aac/icecast.audio' }],
  },
  {
    name: 'Continental 590 AM',
    logo: 'https://static.mytuner.mobi/media/tvos_radios/464/continental.275b128d.png',
    epg_id: 'cd7ab04a-64eb-42b8-b5fb-f3e23e0de103',
    country: 'Argentina',
    options: [{ format: 'mp3', url: 'https://frontend.radiohdvivo.com/continental/live' }],
  },
].map((s) => ({ ...s, id: normalizeIdPart(s.epg_id) }))

// Europa sin España (España ya tiene su propio listado desde tdtchannels)
const COUNTRIES_EUROPA = ['DE', 'FR', 'IT', 'GB', 'PT', 'NL', 'BE', 'CH', 'AT', 'PL']

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
  Brazil: 'Brasil',
  Chile: 'Chile',
  Colombia: 'Colombia',
  'Costa Rica': 'Costa Rica',
  Ecuador: 'Ecuador',
  Mexico: 'México',
  Paraguay: 'Paraguay',
  Peru: 'Perú',
  'Puerto Rico': 'Puerto Rico',
  Uruguay: 'Uruguay',
  Germany: 'Alemania',
  Austria: 'Austria',
  Belgium: 'Bélgica',
  France: 'Francia',
  Italy: 'Italia',
  'The Netherlands': 'Países Bajos',
  Poland: 'Polonia',
  Portugal: 'Portugal',
  'The United Kingdom Of Great Britain And Northern Ireland': 'Reino Unido',
  Switzerland: 'Suiza',
}

// Top 50 emisoras más escuchadas de cada país, pedidas en paralelo a radio-browser
async function fetchRadioBrowserCountries(codes) {
  const responses = await Promise.all(
    codes.map((code) =>
      fetch(
        `https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/${code}?limit=50&hidebroken=true&order=clickcount&reverse=true`,
        { signal: AbortSignal.timeout(5000) },
      ),
    ),
  )
  const parsed = await Promise.all(responses.map((r) => r.json()))
  return parsed.flat()
}

function parseRadioBrowserStations(data) {
  return data.map((s) => ({
    name: s.name,
    logo: s.favicon,
    id: normalizeIdPart(s.stationuuid),
    epg_id: s.stationuuid,
    country: s.country,
    options: [{ format: 'mp3', url: s.url_resolved || s.url }],
  }))
}

// Coloca cada emisora destacada justo antes de la primera de su país (o al
// final si el país no aparece), quitando el duplicado si la API ya la trae.
function withFeaturedStations(list, featured) {
  const featuredIds = new Set(featured.map((s) => s.id))
  const result = list.filter((s) => !featuredIds.has(s.id))
  for (const country of new Set(featured.map((s) => s.country))) {
    const idx = result.findIndex((s) => s.country === country)
    const toInsert = featured.filter((s) => s.country === country)
    result.splice(idx === -1 ? result.length : idx, 0, ...toInsert)
  }
  return result
}

function countryOptions(list) {
  const countries = new Set(list.map((s) => s.country).filter(Boolean))
  return [...countries]
    .map((c) => ({ label: COUNTRY_LABELS[c] ?? c, value: c }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

// Normaliza un valor para usarlo como parte de un id: quita acentos, espacios
// sobrantes y diferencias de mayúsculas, para que pequeños cambios de formato
// en la fuente (espacios extra, tildes, mayúsculas) no rompan la identidad
// de la emisora entre refrescos.
function normalizeIdPart(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

export const useStationsStore = defineStore('stations', {
  state: () => ({
    listStations: [],
    stationsTimestamp: null,
    listStationsLatinoamerica: [],
    stationsLatinoamericaTimestamp: null,
    listStationsEuropa: [],
    stationsEuropaTimestamp: null,
    isLoading: false,
    isLoadingLatinoamerica: false,
    isLoadingEuropa: false,
    favorites: [],
    recentStations: [],
  }),
  actions: {
    _parseStations(data) {
      // `epg_id` es un id de guía de programación, NO un identificador único de
      // emisora: muchas desconexiones regionales comparten el mismo epg_id (p.ej.
      // "RNE.Radio") y la mayoría directamente lo tienen a null. Ni `name` ni
      // `epg_id` están garantizados como únicos por separado ni son estables a
      // largo plazo, así que el id se genera combinando ambos normalizados.
      const buildId = (channel) => `${normalizeIdPart(channel.name)}::${normalizeIdPart(channel.epg_id)}`
      this.listStations = data.countries
        .find((country) => country.name === 'Spain')
        .ambits.flatMap((a) =>
          COMUNIDADES_AUTONOMAS.has(a.name)
            ? a.channels.map((channel) => ({
                ...channel,
                id: buildId(channel),
                comunidadAutonoma: a.name,
              }))
            : a.channels.map((channel) => ({ ...channel, id: buildId(channel) })),
        )
      this.stationsTimestamp = Date.now()
      this._syncFavoritesWith(this.listStations)
    },
    _parseStationsLatinoamerica(data) {
      this.listStationsLatinoamerica = withFeaturedStations(
        parseRadioBrowserStations(data),
        FEATURED_STATIONS_LATINOAMERICA,
      )
      this.stationsLatinoamericaTimestamp = Date.now()
      this._syncFavoritesWith(this.listStationsLatinoamerica)
    },
    _parseStationsEuropa(data) {
      this.listStationsEuropa = parseRadioBrowserStations(data)
      this.stationsEuropaTimestamp = Date.now()
      this._syncFavoritesWith(this.listStationsEuropa)
    },
    // Las favoritas guardan una copia de la emisora (con su URL) en el momento
    // de marcarla. Si la fuente actualiza esa URL, la copia guardada queda
    // obsoleta y falla al reproducir. Al refrescar las listas, se sustituye
    // cada favorita por su versión actual buscándola por id.
    _syncFavoritesWith(freshList) {
      if (freshList.length === 0) return

      const freshById = new Map(freshList.map((s) => [s.id, s]))
      if (this.favorites.length > 0) {
        this.favorites = this.favorites.map((favorite) => freshById.get(favorite.id) ?? favorite)
      }
      if (this.recentStations.length > 0) {
        this.recentStations = this.recentStations.map(
          (recent) => freshById.get(recent.id) ?? recent,
        )
      }
    },
    _isCacheValid(timestamp, list) {
      return timestamp && list.length > 0 && Date.now() - timestamp < CACHE_DURATION
    },
    async loadStations() {
      // Las latinoamericanas y europeas se cargan en segundo plano, sin bloquear el spinner
      this.loadStationsLatinoamerica()
      this.loadStationsEuropa()

      if (this._isCacheValid(this.stationsTimestamp, this.listStations)) return

      this.isLoading = true
      try {
        const response = await fetch(STATIONS_URL, {
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
        this._parseStationsLatinoamerica(await fetchRadioBrowserCountries(COUNTRIES_LATINOAMERICA))
      } catch (e) {
        console.error('Error cargando emisoras de Latinoamérica, usando fallback:', e)
        // El fallback ya está en el formato de la app, solo le falta el id
        // (.flat() por si el JSON viniera anidado, así nunca queda sin países)
        this.listStationsLatinoamerica = withFeaturedStations(
          fallbackRadiosLatinoamerica.flat().map((s) => ({ ...s, id: normalizeIdPart(s.epg_id) })),
          FEATURED_STATIONS_LATINOAMERICA,
        )
        this.stationsLatinoamericaTimestamp = Date.now()
        this._syncFavoritesWith(this.listStationsLatinoamerica)
      } finally {
        this.isLoadingLatinoamerica = false
      }
    },
    async loadStationsEuropa() {
      if (this._isCacheValid(this.stationsEuropaTimestamp, this.listStationsEuropa)) return

      this.isLoadingEuropa = true
      try {
        this._parseStationsEuropa(await fetchRadioBrowserCountries(COUNTRIES_EUROPA))
      } catch (e) {
        console.error('Error cargando emisoras de Europa, usando fallback:', e)
        // El fallback ya está en el formato de la app, solo le falta el id
        this.listStationsEuropa = fallbackRadiosEuropa
          .flat()
          .map((s) => ({ ...s, id: normalizeIdPart(s.epg_id) }))
        this.stationsEuropaTimestamp = Date.now()
        this._syncFavoritesWith(this.listStationsEuropa)
      } finally {
        this.isLoadingEuropa = false
      }
    },
    toggleFavorite(station) {
      const idx = this.favorites.findIndex((favorite) => favorite.id === station.id)
      if (idx === -1) {
        this.favorites.push(station)
      } else {
        this.favorites.splice(idx, 1)
      }
    },
    addToRecent(station) {
      const filtered = this.recentStations.filter((s) => s.id !== station.id)
      this.recentStations = [station, ...filtered].slice(0, 10)
    },
  },
  getters: {
    getStreamUrl: () => (station) => {
      const mp3 = station.options?.find((o) => o.format === 'mp3')
      return (mp3 || station.options?.[0])?.url ?? null
    },
    isFavorite: (state) => (id) => state.favorites.some((favorite) => favorite.id === id),
    latinoamericaCountries: (state) => countryOptions(state.listStationsLatinoamerica),
    europaCountries: (state) => countryOptions(state.listStationsEuropa),
    comunidadesAutonomas: (state) => {
      const comunidades = new Set(
        state.listStations.map((s) => s.comunidadAutonoma).filter(Boolean),
      )
      return [...comunidades]
        .map((c) => ({ label: c, value: c }))
        .sort((a, b) => a.label.localeCompare(b.label))
    },
  },
  persist: [
    // Favoritas y recientes viven en una key estable y separada de la caché
    // de listados: así, subir la versión de la caché (abajo) para invalidar
    // datos con formato antiguo NUNCA borra lo que el usuario ha guardado.
    {
      key: 'stations-favorites',
      pick: ['favorites', 'recentStations'],
    },
    {
      // Subir la versión cuando cambie el formato de los datos cacheados,
      // así la caché antigua (sin nuevos campos) se ignora y se recarga limpia.
      key: 'stations-v7',
      pick: [
        'listStations',
        'stationsTimestamp',
        'listStationsLatinoamerica',
        'stationsLatinoamericaTimestamp',
        'listStationsEuropa',
        'stationsEuropaTimestamp',
      ],
    },
  ],
})
