<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  badge: { type: Number, default: null },
  variant: { type: String, required: true },
})
</script>

<template>
  <q-card :class="['card-mi-transistor', `card--${variant}`]">
    <div class="icon-wrap">
      <slot name="icon" />
    </div>

    <q-card-section>
      <div class="text-h6 text-warm-white">{{ title }}</div>
      <div class="text-caption text-secondary">{{ subtitle }}</div>
    </q-card-section>

    <q-badge v-if="badge" floating color="secondary">{{ badge }}</q-badge>
  </q-card>
</template>

<style scoped>
.card-mi-transistor {
  border-radius: 20px !important;
  min-height: 140px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-mi-transistor > div {
  border-radius: 12px !important;
}

.card--favorites {
  background: #2e1a10;
  border: 1px solid rgba(212, 110, 42, 0.35);
}

.card--stations {
  background: #1e2015;
  border: 1px solid rgba(76, 175, 130, 0.3);
}

.card--recent {
  background: #1a1b28;
  border: 1px solid rgba(212, 168, 67, 0.3);
}

.card--about {
  background: #22182a;
  border: 1px solid rgba(139, 94, 60, 0.3);
}
.text-warm-white {
  color: #f5ecd7;
}
.icon-wrap {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin: 12px 0 0 12px;
  position: relative;
  z-index: 1;
}
.icon-wrap :deep(.q-icon) {
  position: relative;
  z-index: 1;
}
.card--favorites .icon-wrap {
  background: linear-gradient(135deg, #d46e2a, #c8922a) !important;
}
.card--stations .icon-wrap {
  background: linear-gradient(135deg, #4caf82, #3d9e73) !important;
}
.card--recent .icon-wrap {
  background: linear-gradient(135deg, #d4a843, #c8922a) !important;
}
.card--about .icon-wrap {
  background: linear-gradient(135deg, #8b5e3c, #6b4525) !important;
}
</style>
