<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import PlayerStation from 'src/components/PlayerStation.vue'

const $q = useQuasar()

const rightDrawerOpen = ref(false)

const APP_URL = 'https://play.google.com/store/apps/details?id=com.mitransistor.app'
const SHARE_TEXT = 'Escucha la radio fácil y sin anuncios con Mi Transistor'

async function shareApp() {
  try {
    // En el dispositivo (Android/iOS) abrimos la hoja de compartir nativa
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: 'Mi Transistor',
        text: SHARE_TEXT,
        url: APP_URL,
        dialogTitle: 'Compartir Mi Transistor',
      })
      return
    }
    // En navegador usamos la Web Share API si está disponible
    if (navigator.share) {
      await navigator.share({ title: 'Mi Transistor', text: SHARE_TEXT, url: APP_URL })
      return
    }
    // Último recurso: copiar el enlace al portapapeles
    await navigator.clipboard.writeText(APP_URL)
    $q.notify({ message: 'Enlace copiado', color: 'positive', position: 'top' })
  } catch (err) {
    // El usuario canceló el diálogo de compartir: no mostramos error
    if (err?.name === 'AbortError' || err?.message?.includes('cancel')) return
    $q.notify({ message: 'No se pudo compartir', color: 'negative', position: 'top' })
  }
}
</script>

<template>
  <div class="app-shell">
    <q-layout container view="hHh lpR fFr" class="layout-safe">
      <q-header elevated class="bg-dark text-white header-safe">
        <q-toolbar>
          <img src="~assets/mi_transistor_logo_header.svg" height="44" alt="Mi Transistor" />
          <q-space />
          <q-btn
            flat
            round
            icon="share"
            size="md"
            color="white"
            aria-label="Compartir Mi Transistor"
            @click="shareApp"
          />
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
  </div>
</template>

<style>
.header-safe {
  padding-top: env(safe-area-inset-top);
}
.footer-inset-spacer {
  height: env(safe-area-inset-bottom);
  background-color: #8b5e3c;
}

/* En pantallas anchas (navegador de escritorio) la app se centra con un
   ancho máximo, como una app de móvil, en vez de estirarse a todo el ancho. */
.app-shell {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  max-width: 560px;
  margin: 0 auto;
}
@media (min-width: 560px) {
  .app-shell {
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.45);
  }
}
</style>
