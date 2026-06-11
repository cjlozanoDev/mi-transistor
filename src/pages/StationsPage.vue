<script setup>
import { useStationsStore } from 'src/stores/useStationsStore'
import SubHeader from 'src/components/SubHeader.vue'
import ListStations from 'src/components/ListStations.vue'

const stationsStore = useStationsStore()
</script>

<template>
  <q-page class="bg-dark-page">
    <SubHeader title-route="Todas las Radios" back-name-route="home" />
    <ListStations :stations="stationsStore.listStations" show-country-filter />
  </q-page>
</template>
