<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useSleepTimerStore } from 'src/stores/useSleepTimerStore'

const model = defineModel({ type: Boolean, default: false })
const sleepTimer = useSleepTimerStore()
const $q = useQuasar()
const { t } = useI18n()

const hours = ref(0)
const minutes = ref(30)
const seconds = ref(0)

const PRESETS = [
  { label: '15 min', h: 0, m: 15 },
  { label: '30 min', h: 0, m: 30 },
  { label: '1 h', h: 1, m: 0 },
  { label: '2 h', h: 2, m: 0 },
]

const columns = computed(() => [
  { key: 'hours', label: t('sleepTimer.hours'), value: hours, max: 23 },
  { key: 'minutes', label: t('sleepTimer.minutes'), value: minutes, max: 59 },
  { key: 'seconds', label: t('sleepTimer.seconds'), value: seconds, max: 59 },
])

// Vuelta circular: de 59 a 0 al subir y de 0 a 59 al bajar
const step = (col, delta) => {
  const size = col.max + 1
  col.value.value = (col.value.value + delta + size) % size
}

const applyPreset = (p) => {
  hours.value = p.h
  minutes.value = p.m
  seconds.value = 0
}

const isPresetSelected = (p) => hours.value === p.h && minutes.value === p.m && seconds.value === 0

const totalMs = computed(() => ((hours.value * 60 + minutes.value) * 60 + seconds.value) * 1000)

const formatReadable = (ms) => {
  const total = Math.round(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h} h ${m} min ${s} s`
}

const pad = (n) => String(n).padStart(2, '0')
const formatClock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

// Cuenta atrás: solo se refresca mientras el diálogo está abierto
const now = ref(Date.now())
let tick = null

const stopTick = () => {
  if (tick) {
    clearInterval(tick)
    tick = null
  }
}

watch(
  model,
  (open) => {
    stopTick()
    if (!open) return
    now.value = Date.now()
    tick = setInterval(() => (now.value = Date.now()), 1000)
  },
  { immediate: true },
)

onUnmounted(stopTick)

const remainingMs = computed(() => (sleepTimer.endAt ? sleepTimer.endAt - now.value : 0))

const apply = () => {
  if (!totalMs.value) return
  sleepTimer.start(totalMs.value)
  model.value = false
  $q.notify({
    message: t('sleepTimer.applied', { time: formatReadable(totalMs.value) }),
    color: 'positive',
    position: 'bottom',
    timeout: 2500,
  })
}

const stop = () => {
  sleepTimer.cancel()
  model.value = false
  $q.notify({
    message: t('sleepTimer.stopped'),
    color: 'grey-7',
    position: 'bottom',
    timeout: 2000,
  })
}
</script>

<template>
  <q-dialog v-model="model" position="bottom">
    <q-card class="timer-card">
      <div class="timer-header">
        <span class="timer-emoji">🌙</span>
        <div>
          <div class="timer-title">
            {{ sleepTimer.isActive ? t('sleepTimer.activeTitle') : t('sleepTimer.title') }}
          </div>
          <div class="timer-subtitle">
            {{
              sleepTimer.isActive ? t('sleepTimer.activeDescription') : t('sleepTimer.description')
            }}
          </div>
        </div>
      </div>

      <!-- Temporizador activo: cuenta atrás + detener -->
      <template v-if="sleepTimer.isActive">
        <q-card-section class="timer-body">
          <div class="timer-label">{{ t('sleepTimer.remaining') }}</div>
          <div class="timer-countdown">{{ formatClock(remainingMs) }}</div>
        </q-card-section>

        <q-card-actions class="timer-actions">
          <q-btn
            unelevated
            no-caps
            icon="timer_off"
            :label="t('sleepTimer.stop')"
            color="negative"
            class="timer-main-btn"
            @click="stop"
          />
          <q-btn
            flat
            no-caps
            :label="t('sleepTimer.close')"
            class="timer-secondary-btn"
            @click="model = false"
          />
        </q-card-actions>
      </template>

      <!-- Sin temporizador: elegir duración -->
      <template v-else>
        <q-card-section class="timer-body">
          <div class="timer-label">{{ t('sleepTimer.presets') }}</div>
          <div class="timer-presets">
            <q-btn
              v-for="p in PRESETS"
              :key="p.label"
              unelevated
              no-caps
              :label="p.label"
              :class="['timer-preset', { 'timer-preset--selected': isPresetSelected(p) }]"
              @click="applyPreset(p)"
            />
          </div>

          <div class="timer-pickers">
            <div v-for="col in columns" :key="col.key" class="timer-col">
              <div class="timer-col-label">{{ col.label }}</div>
              <q-btn
                flat
                round
                icon="add"
                class="timer-step-btn"
                :aria-label="`+ ${col.label}`"
                @click="step(col, 1)"
              />
              <div class="timer-col-value">{{ pad(col.value.value) }}</div>
              <q-btn
                flat
                round
                icon="remove"
                class="timer-step-btn"
                :aria-label="`- ${col.label}`"
                @click="step(col, -1)"
              />
            </div>
          </div>

          <div class="timer-summary">
            {{ t('sleepTimer.summary', { time: formatReadable(totalMs) }) }}
          </div>
        </q-card-section>

        <q-card-actions class="timer-actions">
          <q-btn
            unelevated
            no-caps
            icon="timer"
            :label="t('sleepTimer.apply')"
            color="primary"
            :disable="!totalMs"
            class="timer-main-btn"
            @click="apply"
          />
          <q-btn
            flat
            no-caps
            :label="t('sleepTimer.close')"
            class="timer-secondary-btn"
            @click="model = false"
          />
        </q-card-actions>
      </template>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.timer-card {
  width: 480px;
  max-width: 100vw;
  border-radius: 20px 20px 0 0 !important;
  background: #1a1420;
  border: 1px solid rgba(212, 168, 67, 0.3);
  border-bottom: none;
  overflow: hidden;
}

.timer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  background: linear-gradient(135deg, rgba(212, 110, 42, 0.18), rgba(200, 146, 42, 0.1));
  border-bottom: 1px solid rgba(212, 168, 67, 0.2);
}

.timer-emoji {
  font-size: 30px;
  flex-shrink: 0;
}

.timer-title {
  font-size: 18px;
  font-weight: 700;
  color: #f5ecd7;
  line-height: 1.2;
}

.timer-subtitle {
  font-size: 15px;
  color: rgba(245, 236, 215, 0.75);
  margin-top: 4px;
  line-height: 1.4;
}

.timer-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
}

.timer-label {
  font-size: 14px;
  color: rgba(200, 146, 42, 0.9);
  font-weight: 600;
}

.timer-presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.timer-preset {
  min-height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #f5ecd7;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(212, 168, 67, 0.25);
}

.timer-preset--selected {
  background: rgba(212, 168, 67, 0.25);
  border-color: rgba(212, 168, 67, 0.8);
}

.timer-pickers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.timer-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.timer-col-label {
  font-size: 14px;
  color: rgba(245, 236, 215, 0.7);
}

.timer-col-value {
  font-size: 32px;
  font-weight: 700;
  color: #f5ecd7;
  font-variant-numeric: tabular-nums;
}

.timer-step-btn {
  width: 52px;
  height: 52px;
  color: #f5ecd7;
  background: rgba(0, 0, 0, 0.25);
}

.timer-summary {
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  color: #f5ecd7;
}

.timer-countdown {
  font-size: 48px;
  font-weight: 700;
  text-align: center;
  color: #4caf82;
  font-variant-numeric: tabular-nums;
}

.timer-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 20px 20px;
}

.timer-actions > .q-btn {
  margin-left: 0;
}

.timer-main-btn {
  width: 100%;
  min-height: 52px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
}

.timer-secondary-btn {
  width: 100%;
  min-height: 48px;
  font-size: 16px;
  color: rgba(245, 236, 215, 0.8);
}
</style>
