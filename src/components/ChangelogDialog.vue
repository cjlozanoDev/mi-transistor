<script setup>
import { useI18n } from 'vue-i18n'

// title/subtitle son opcionales: si no vienen se usan los del changelog.
// Los mensajes programados reutilizan este diálogo pasando su propio título.
const props = defineProps({
  entry: { type: Object, required: true },
  title: { type: String, default: null },
  subtitle: { type: String, default: null },
})

const model = defineModel({ type: Boolean, default: false })
const { t, locale } = useI18n()

// Cada novedad trae su texto en todos los idiomas; si faltara alguno, español
const itemText = (item) => item.text?.[locale.value] ?? item.text?.es ?? ''
</script>

<template>
  <q-dialog v-model="model" persistent>
    <q-card class="changelog-card">
      <div class="changelog-header">
        <span class="changelog-emoji">📻</span>
        <div>
          <div class="changelog-title">{{ props.title ?? t('changelog.title') }}</div>
          <div v-if="!props.title || props.subtitle" class="changelog-subtitle">
            {{ props.subtitle ?? t('changelog.subtitle') }}
          </div>
        </div>
      </div>

      <q-card-section class="changelog-body">
        <div v-for="(item, i) in entry.items" :key="i" class="changelog-item">
          <span class="changelog-item-icon">{{ item.icon }}</span>
          <span class="changelog-item-text">{{ itemText(item) }}</span>
        </div>
      </q-card-section>

      <q-card-actions class="changelog-actions">
        <q-btn
          unelevated
          no-caps
          :label="t('changelog.ok')"
          color="primary"
          class="changelog-ok-btn"
          @click="model = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.changelog-card {
  width: 340px;
  max-width: 90vw;
  border-radius: 20px !important;
  background: #1a1420;
  border: 1px solid rgba(212, 168, 67, 0.3);
  overflow: hidden;
}

.changelog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  background: linear-gradient(135deg, rgba(212, 110, 42, 0.18), rgba(200, 146, 42, 0.1));
  border-bottom: 1px solid rgba(212, 168, 67, 0.2);
}

.changelog-emoji {
  font-size: 30px;
  flex-shrink: 0;
}

.changelog-title {
  font-size: 18px;
  font-weight: 700;
  color: #f5ecd7;
  line-height: 1.2;
}

.changelog-subtitle {
  font-size: 12px;
  color: rgba(200, 146, 42, 0.8);
  margin-top: 2px;
}

.changelog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
}

.changelog-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.changelog-item-icon {
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1.4;
}

.changelog-item-text {
  font-size: 14px;
  color: #f5ecd7;
  line-height: 1.4;
}

.changelog-actions {
  padding: 8px 20px 20px;
}

.changelog-ok-btn {
  width: 100%;
  border-radius: 12px;
  font-weight: 600;
}
</style>
