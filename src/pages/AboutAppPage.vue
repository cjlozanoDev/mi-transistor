<script setup>
import SubHeader from 'src/components/SubHeader.vue'

const email = 'cjlozanodev@gmail.com'

const openMail = () => {
  window.open(`mailto:${email}?subject=Mi Transistor`, '_blank')
}
</script>

<template>
  <q-page class="bg-dark-page">
    <SubHeader title-route="Mi Transistor" back-name-route="home" />

    <div class="about-content">
      <!-- Hero -->
      <div class="hero-section">
        <q-avatar size="96px" color="primary" text-color="white">
          <q-icon name="radio" size="56px" />
        </q-avatar>
        <div class="app-name">Mi Transistor</div>
        <div class="app-tagline">La radio de siempre, en tu bolsillo</div>
      </div>

      <!-- Valores -->
      <div class="values-section">
        <div class="value-item">
          <q-avatar size="48px" color="dark" text-color="secondary">
            <q-icon name="block" size="26px" />
          </q-avatar>
          <div class="value-text">
            <div class="value-title">Sin publicidad</div>
            <div class="value-desc">Ningún anuncio. Nunca. Solo tu emisora.</div>
          </div>
        </div>

        <q-separator dark inset class="q-my-sm" />

        <div class="value-item">
          <q-avatar size="48px" color="dark" text-color="secondary">
            <q-icon name="accessibility_new" size="26px" />
          </q-avatar>
          <div class="value-text">
            <div class="value-title">Para todos</div>
            <div class="value-desc">
              Diseñada para que cualquier persona pueda usarla con facilidad.
            </div>
          </div>
        </div>

        <q-separator dark inset class="q-my-sm" />

        <div class="value-item">
          <q-avatar size="48px" color="dark" text-color="secondary">
            <q-icon name="touch_app" size="26px" />
          </q-avatar>
          <div class="value-text">
            <div class="value-title">Simple de usar</div>
            <div class="value-desc">Abre la app, toca tu emisora y escucha. Sin más pasos.</div>
          </div>
        </div>

        <q-separator dark inset class="q-my-sm" />

        <div class="value-item">
          <q-avatar size="48px" color="dark" text-color="secondary">
            <q-icon name="no_accounts" size="26px" />
          </q-avatar>
          <div class="value-text">
            <div class="value-title">Sin registro</div>
            <div class="value-desc">No hace falta crear ninguna cuenta ni dar ningún dato.</div>
          </div>
        </div>
      </div>

      <!-- Contacto -->
      <div class="contact-section">
        <div class="contact-title">¿Tienes alguna sugerencia?</div>
        <div class="contact-desc">
          Peticiones, comentarios o lo que necesites. Escríbenos y leemos todos los mensajes.
        </div>

        <q-btn
          unelevated
          rounded
          outline
          color="secondary"
          icon="mail_outline"
          :label="email"
          class="q-mt-sm full-width"
          style="font-size: 14px; padding: 12px 0"
          @click="openMail"
        />
      </div>

      <!-- Footer -->
      <div class="app-footer">Hecho con ❤️ para que la radio llegue a todos</div>
    </div>
  </q-page>
</template>

<style scoped>
.about-content {
  padding: 24px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.app-name {
  font-size: 28px;
  font-weight: 700;
  color: #f5ecd7;
  letter-spacing: 0.5px;
}

.app-tagline {
  font-size: 16px;
  color: rgba(200, 146, 42, 0.85);
}

.values-section {
  background: rgba(44, 26, 14, 0.6);
  border-radius: 20px;
  padding: 8px 16px;
}

.value-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
}

.value-title {
  font-size: 17px;
  font-weight: 600;
  color: #f5ecd7;
}

.value-desc {
  font-size: 14px;
  color: rgba(168, 139, 106, 0.85);
  margin-top: 2px;
  line-height: 1.4;
}

.contact-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.contact-title {
  font-size: 20px;
  font-weight: 600;
  color: #f5ecd7;
}

.contact-desc {
  font-size: 15px;
  color: rgba(168, 139, 106, 0.85);
  margin-top: 8px;
  line-height: 1.5;
  max-width: 280px;
}

.app-footer {
  text-align: center;
  font-size: 14px;
  color: rgba(168, 139, 106, 0.6);
  padding-top: 8px;
}
</style>
