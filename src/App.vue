<script setup>
import { onMounted } from 'vue'
import { useStationsStore } from './stores/useStationsStore'

const store = useStationsStore()

onMounted(async () => {
  store.loadStations()
})
</script>

<template>
  <router-view />
</template>
