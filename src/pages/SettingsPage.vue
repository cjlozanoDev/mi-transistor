<script setup>
import { useI18n } from 'vue-i18n'
import SubHeader from 'src/components/SubHeader.vue'
import { useSettingsStore } from 'src/stores/useSettingsStore'
import { LANGUAGES } from 'src/i18n'

const { t } = useI18n()
const settingsStore = useSettingsStore()
</script>

<template>
  <q-page class="bg-dark-page">
    <SubHeader :title-route="t('settings.title')" back-name-route="home" />

    <div class="settings-content">
      <div class="section-title">
        <q-icon name="translate" size="22px" class="q-mr-sm" />
        {{ t('settings.language') }}
      </div>

      <q-list dark class="language-list">
        <q-item
          v-for="language in LANGUAGES"
          :key="language.value"
          clickable
          v-ripple
          class="language-item"
          :active="settingsStore.locale === language.value"
          active-class="language-item--active"
          @click="settingsStore.setLocale(language.value)"
        >
          <q-item-section class="language-item__label">{{ language.label }}</q-item-section>
          <q-item-section side>
            <q-icon
              v-if="settingsStore.locale === language.value"
              name="check_circle"
              color="secondary"
              size="28px"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<style scoped>
.settings-content {
  padding: 24px 16px 40px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: rgba(200, 146, 42, 0.9);
  margin: 0 4px 12px;
}

.language-list {
  background: rgba(44, 26, 14, 0.6);
  border-radius: 20px;
  overflow: hidden;
}

.language-item {
  min-height: 60px;
  color: #f5ecd7;
}

.language-item + .language-item {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.language-item__label {
  font-size: 18px;
}

.language-item--active {
  background: rgba(200, 146, 42, 0.15);
  color: #f5ecd7;
  font-weight: 600;
}
</style>
