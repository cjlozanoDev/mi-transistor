<script setup>
import { ref, onMounted } from 'vue'
import PlayerStation from 'src/components/PlayerStation.vue'

const rightDrawerOpen = ref(false)
const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}

onMounted(() => {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;bottom:0;padding-bottom:env(safe-area-inset-bottom)'
  document.body.appendChild(el)
  const val = getComputedStyle(el).paddingBottom
  document.getElementById('debug-inset').textContent = `inset-bottom: ${val}`
  document.body.removeChild(el)
})
</script>

<template>
  <q-layout view="hHh lpR fFr" class="layout-safe">
    <q-header elevated class="bg-dark text-white header-safe">
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

    <q-footer elevated class="bg-primary text-white footer-safe">
      <PlayerStation />
      <div class="footer-inset-spacer" />
    </q-footer>
  </q-layout>
</template>

<style>
.header-safe {
  padding-top: env(safe-area-inset-top);
}
.footer-inset-spacer {
  height: env(safe-area-inset-bottom);
  background-color: #8b5e3c;
}
</style>
