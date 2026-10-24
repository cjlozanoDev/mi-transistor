import { defineStore } from 'pinia'

// Ids de los mensajes programados ya mostrados: cada mensaje sale una sola vez
export const useMessagesStore = defineStore('messages', {
  state: () => ({
    shownIds: [],
  }),
  actions: {
    markShown(id) {
      const key = String(id)
      if (!this.shownIds.includes(key)) this.shownIds.push(key)
    },
  },
  getters: {
    isShown: (state) => (id) => state.shownIds.includes(String(id)),
  },
  persist: {
    key: 'messages-v1',
  },
})
