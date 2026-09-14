<script setup>
defineEmits(['install', 'dismiss'])

const model = defineModel({ type: Boolean, default: false })
</script>

<template>
  <q-dialog v-model="model" persistent>
    <q-card class="install-card">
      <div class="install-header">
        <span class="install-emoji">💻</span>
        <div>
          <div class="install-title">Instala Mi Transistor</div>
          <div class="install-subtitle">Tenla siempre a mano en tu ordenador</div>
        </div>
      </div>

      <q-card-section class="install-body">
        Puedes instalar Mi Transistor en tu ordenador para abrirla como una app, sin buscarla en el navegador cada
        vez.
      </q-card-section>

      <q-card-actions class="install-actions">
        <q-btn
          flat
          no-caps
          label="Más tarde"
          color="grey-5"
          class="install-later-btn"
          @click="$emit('dismiss')"
        />
        <q-btn
          unelevated
          no-caps
          label="Instalar"
          color="primary"
          class="install-ok-btn"
          @click="$emit('install')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.install-card {
  width: 340px;
  max-width: 90vw;
  border-radius: 20px !important;
  background: #1a1420;
  border: 1px solid rgba(212, 168, 67, 0.3);
  overflow: hidden;
}

.install-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  background: linear-gradient(135deg, rgba(212, 110, 42, 0.18), rgba(200, 146, 42, 0.1));
  border-bottom: 1px solid rgba(212, 168, 67, 0.2);
}

.install-emoji {
  font-size: 30px;
  flex-shrink: 0;
}

.install-title {
  font-size: 18px;
  font-weight: 700;
  color: #f5ecd7;
  line-height: 1.2;
}

.install-subtitle {
  font-size: 12px;
  color: rgba(200, 146, 42, 0.8);
  margin-top: 2px;
}

.install-body {
  font-size: 14px;
  color: #f5ecd7;
  line-height: 1.4;
  padding: 18px 20px;
}

.install-actions {
  padding: 8px 20px 20px;
  gap: 10px;
}

.install-later-btn {
  flex: 1;
  border-radius: 12px;
  font-weight: 600;
}

.install-ok-btn {
  flex: 1;
  border-radius: 12px;
  font-weight: 600;
}
</style>
