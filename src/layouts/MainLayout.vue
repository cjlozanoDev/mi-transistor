<script setup>
import { ref } from 'vue'
import PlayerStation from 'src/components/PlayerStation.vue'

const rightDrawerOpen = ref(false)

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>

<template>
  <q-layout view="hHh lpR fFr">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <img src="~assets/mi_transistor_logo_header.svg" height="44" alt="Mi Transistor" />

        <q-btn v-if="false" dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="rightDrawerOpen" side="right" bordered>
      <!-- drawer content -->
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated class="bg-primary text-white">
      <PlayerStation />
    </q-footer>
  </q-layout>
</template>
