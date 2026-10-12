<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import PlayerStation from 'src/components/PlayerStation.vue'

const $q = useQuasar()
const { t } = useI18n()

const rightDrawerOpen = ref(false)

const APP_URL = 'https://play.google.com/store/apps/details?id=com.mitransistor.app'

async function shareApp() {
  try {
    // En el dispositivo (Android/iOS) abrimos la hoja de compartir nativa
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: 'Mi Transistor',
        text: t('app.shareText'),
        url: APP_URL,
        dialogTitle: t('app.share'),
      })
      return
    }
    // En navegador usamos la Web Share API si está disponible
    if (navigator.share) {
      await navigator.share({ title: 'Mi Transistor', text: t('app.shareText'), url: APP_URL })
      return
    }
    // Último recurso: copiar el enlace al portapapeles
    await navigator.clipboard.writeText(APP_URL)
    $q.notify({ message: t('app.linkCopied'), color: 'positive', position: 'top' })
  } catch (err) {
    // El usuario canceló el diálogo de compartir: no mostramos error
    if (err?.name === 'AbortError' || err?.message?.includes('cancel')) return
    $q.notify({ message: t('app.shareError'), color: 'negative', position: 'top' })
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
            :aria-label="t('app.share')"
            @click="shareApp"
          />
          <q-btn
            flat
            round
            icon="menu"
            size="md"
            color="white"
            :aria-label="t('menu.open')"
            @click="rightDrawerOpen = !rightDrawerOpen"
          />
        </q-toolbar>
      </q-header>

      <q-drawer
        v-model="rightDrawerOpen"
        side="right"
        behavior="mobile"
        :width="280"
        class="bg-dark"
      >
        <q-list padding dark class="drawer-safe">
          <q-item
            clickable
            v-ripple
            :to="{ name: 'settings' }"
            class="drawer-item"
            @click="rightDrawerOpen = false"
          >
            <q-item-section avatar>
              <q-icon name="settings" color="secondary" size="28px" />
            </q-item-section>
            <q-item-section class="drawer-item__label">{{ t('menu.settings') }}</q-item-section>
          </q-item>
        </q-list>
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
.drawer-safe {
  padding-top: calc(env(safe-area-inset-top) + 8px);
}
.drawer-item {
  min-height: 56px;
  color: #f5ecd7;
}
.drawer-item__label {
  font-size: 18px;
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
