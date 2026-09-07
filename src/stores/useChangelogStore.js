import { defineStore } from 'pinia'

export const useChangelogStore = defineStore('changelog', {
  state: () => ({
    lastSeenVersion: null,
  }),
  actions: {
    markSeen(version) {
      this.lastSeenVersion = version
    },
  },
  getters: {
    // Nunca se muestra en el primer arranque (lastSeenVersion === null):
    // un usuario nuevo no necesita ver un changelog de cambios que no vivió.
    hasUnseenVersion: (state) => (version) =>
      state.lastSeenVersion !== null && state.lastSeenVersion !== version,
  },
  persist: {
    key: 'changelog-v1',
  },
})
