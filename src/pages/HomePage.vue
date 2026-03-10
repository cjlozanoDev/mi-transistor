<script setup>
import CardMiTransistor from 'src/components/CardMiTransistor.vue'
</script>

<template>
  <q-page class="page-home">
    <div class="text-h5 text-primary">¿Qué quieres hacer?</div>
    <div class="cards-grid">
      <CardMiTransistor
        variant="favorites"
        title="Mis Favoritas"
        subtitle="Tus emisoras guardadas"
        @click="() => {}"
      >
        <template #icon><span style="font-size: 28px">❤️</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="stations"
        title="Todas las Radios"
        subtitle="Explora emisoras"
        @click="() => {}"
      >
        <template #icon><span style="font-size: 28px">📡</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="recent"
        title="Últimas Escuchadas"
        subtitle="Tu historial reciente"
        @click="() => {}"
      >
        <template #icon><span style="font-size: 28px">🕐</span></template>
      </CardMiTransistor>

      <CardMiTransistor
        variant="about"
        title="Mi Transistor"
        subtitle="Acerca de la app"
        @click="() => {}"
      >
        <template #icon><span style="font-size: 28px">📻</span></template>
      </CardMiTransistor>
    </div>
  </q-page>
</template>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}
</style>
