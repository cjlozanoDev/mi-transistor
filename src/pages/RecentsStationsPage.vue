<script setup>
import { useStationsStore } from 'src/stores/useStationsStore'
import { useRouter } from 'vue-router'
import SubHeader from 'src/components/SubHeader.vue'
import ListStations from 'src/components/ListStations.vue'

const stationsStore = useStationsStore()
const router = useRouter()
</script>

<template>
  <q-page class="bg-dark-page">
    <SubHeader title-route="Últimas Escuchadas" back-name-route="home" />

    <!-- Sin recientes -->
    <div v-if="stationsStore.recentStations.length === 0" class="empty-state">
      <span class="empty-icon">🕐</span>
      <div class="empty-title">Aún no has escuchado nada</div>
      <div class="empty-message">
        Aquí aparecerán las últimas 10 emisoras que escuches, para volver a encontrarlas fácilmente
      </div>
      <q-btn
        label="Ver todas las emisoras"
        color="secondary"
        unelevated
        rounded
        class="q-mt-lg"
        style="font-size: 16px; padding: 10px 28px"
        @click="router.push({ name: 'stations-list' })"
      />
    </div>

    <!-- Con recientes -->
    <template v-else>
      <div class="q-px-md q-pt-md q-pb-xs">
        <div style="font-size: 15px; color: rgba(200, 146, 42, 0.75)">
          Tus últimas {{ stationsStore.recentStations.length }} emisoras escuchadas (se guardarán
          las últimas 10)
        </div>
        <q-separator dark class="q-mt-sm" />
      </div>
      <ListStations :stations="stationsStore.recentStations" />
    </template>
  </q-page>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  text-align: center;
  gap: 12px;
}

.empty-icon {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 22px;
  font-weight: 600;
  color: #f5ecd7;
}

.empty-message {
  font-size: 16px;
  color: rgba(168, 139, 106, 0.8);
  max-width: 260px;
  line-height: 1.5;
}
</style>
