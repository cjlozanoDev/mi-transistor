<script setup>
import CardMiTransistor from 'src/components/CardMiTransistor.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <q-page class="page-home">
    <div class="home-header q-px-lg q-pt-xl q-pb-md">
      <div class="question-text">¿Qué quieres escuchar hoy?</div>
    </div>

    <div class="cards-grid">
      <CardMiTransistor
        variant="favorites"
        title="Mis Favoritas"
        subtitle="Tus emisoras guardadas"
        @click="router.push({ name: 'favorites-stations' })"
      >
        <template #icon><span style="font-size: 28px">❤️</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="stations"
        title="Todas las emisoras"
        subtitle="Explora emisoras"
        @click="router.push({ name: 'stations-list' })"
      >
        <template #icon><span style="font-size: 28px">📡</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="recent"
        title="Últimas Escuchadas"
        subtitle="Tu historial reciente"
        @click="router.push({ name: 'recents-stations' })"
      >
        <template #icon><span style="font-size: 28px">🕐</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="about"
        title="Mi Transistor"
        subtitle="Acerca de la app"
        @click="router.push({ name: 'about-app' })"
      >
        <template #icon><span style="font-size: 28px">📻</span></template>
      </CardMiTransistor>
    </div>
  </q-page>
</template>

<style scoped>
.home-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.welcome-text {
  font-size: 16px;
  color: rgba(200, 146, 42, 0.8);
  letter-spacing: 0.5px;
}
.question-text {
  font-size: 26px;
  font-weight: 700;
  color: #f5ecd7;
  line-height: 1.2;
}
.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}
</style>
