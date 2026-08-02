<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ThreeScene from './game/gui/components/ThreeScene.vue'

const isLightningLab = new URLSearchParams(window.location.search).has('lightning-lab')
const isBombLab = new URLSearchParams(window.location.search).has('bomb-lab')
const LightningLab = defineAsyncComponent(() => import('./game/gui/components/LightningLab.vue'))
const BombExplosionLab = defineAsyncComponent(
  () => import('./game/gui/components/BombExplosionLab.vue'),
)
</script>

<template>
  <BombExplosionLab v-if="isBombLab" />
  <LightningLab v-else-if="isLightningLab" />
  <main v-else class="app-shell">
    <ThreeScene />
  </main>
</template>
