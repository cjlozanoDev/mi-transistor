<!-- SubHeader.vue -->
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
defineProps({
  titleRoute: { type: String, required: true },
  backNameRoute: { type: String, default: null },
})
</script>

<template>
  <div class="bg-primary row items-center q-px-md q-py-sm">
    <q-btn
      v-if="backNameRoute"
      flat
      round
      dense
      icon="arrow_back"
      color="white"
      @click="router.push({ name: backNameRoute })"
    />
    <span class="text-white text-h6 q-ml-sm">{{ titleRoute }}</span>
  </div>
</template>
