import { boot } from 'quasar/wrappers'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Antes de separar favoritas/recientes en su propia key ('stations-favorites'),
// vivían dentro de la key versionada de la caché de emisoras (stations-v1..v6),
// así que cada bump de versión (necesario para invalidar el formato cacheado)
// las borraba de paso. Esta migración, ejecutada una sola vez, las rescata de
// la key vieja más reciente que exista antes de que Pinia restaure el estado.
function migrateFavoritesToStableKey() {
  const NEW_KEY = 'stations-favorites'
  if (localStorage.getItem(NEW_KEY)) return

  // Se recorren de la más reciente a la más antigua, y solo se usa la
  // primera que tenga datos reales: una key existente pero vacía (p.ej. si
  // ese bump ya perdió las favoritas) no debe tapar los datos de una anterior.
  const OLD_KEYS = ['stations-v6', 'stations-v5', 'stations-v4', 'stations-v3', 'stations-v2', 'stations-v1']
  for (const oldKey of OLD_KEYS) {
    const raw = localStorage.getItem(oldKey)
    if (!raw) continue

    try {
      const parsed = JSON.parse(raw)
      const favorites = Array.isArray(parsed.favorites) ? parsed.favorites : []
      const recentStations = Array.isArray(parsed.recentStations) ? parsed.recentStations : []
      if (favorites.length > 0 || recentStations.length > 0) {
        localStorage.setItem(NEW_KEY, JSON.stringify({ favorites, recentStations }))
        break
      }
    } catch (e) {
      console.error(`Error migrando favoritas desde ${oldKey}:`, e)
    }
  }
}

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app } /* { app, router, ... } */) => {
  migrateFavoritesToStableKey()

  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  app.use(pinia)
  // something to do
})
