import { defineStore } from 'pinia'

import { useStationsStore } from 'src/stores/useStationsStore'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    currentStation: null,
    streamUrl: null,
    isPlaying: false,
    isBuffering: false,
    stoppedByUser: false,
    playTrigger: 0,
  }),

  actions: {
    play(station, url) {
      const stationsStore = useStationsStore()
      stationsStore.addToRecent(station)

      this.currentStation = station
      this.streamUrl = url
      this.isPlaying = true
      this.isBuffering = true
      this.stoppedByUser = false
      this.playTrigger += 1
    },

    stop() {
      this.isPlaying = false
      this.isBuffering = false
      this.stoppedByUser = true
    },

    setBuffering(val) {
      this.isBuffering = val
    },
  },
})
