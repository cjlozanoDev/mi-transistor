<script setup>
import { onMounted } from 'vue'
import { useStationsStore } from './stores/useStationsStore'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

const store = useStationsStore()

onMounted(async () => {
  store.loadStations()

  if (Capacitor.isNativePlatform()) {
    await StatusBar.setBackgroundColor({ color: '#2C1A0E' })
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setOverlaysWebView({ overlay: false })
  }
})
</script>

<template>
  <router-view />
</template>
