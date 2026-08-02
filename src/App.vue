<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ThreeScene from './game/gui/components/ThreeScene.vue'

const isLightningLab = new URLSearchParams(window.location.search).has('lightning-lab')
const LightningLab = defineAsyncComponent(() => import('./game/gui/components/LightningLab.vue'))
</script>

<template>
  <LightningLab v-if="isLightningLab" />
  <main v-else class="app-shell">
    <ThreeScene />
  </main>
</template>
