<script setup>
import { useStationsStore } from 'src/stores/useStationsStore'
import SubHeader from 'src/components/SubHeader.vue'
import ListStations from 'src/components/ListStations.vue'
import { useI18n } from 'vue-i18n'

const stationsStore = useStationsStore()
const { t } = useI18n()
</script>

<template>
  <q-page class="bg-dark-page">
    <SubHeader :title-route="t('stations.title')" back-name-route="home" />
    <ListStations :stations="stationsStore.listStations" show-country-filter />
  </q-page>
</template>
