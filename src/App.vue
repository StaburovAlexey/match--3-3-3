<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ThreeScene from './game/gui/components/ThreeScene.vue'

const isLightningLab = new URLSearchParams(window.location.search).has('lightning-lab')
const isBombLab = new URLSearchParams(window.location.search).has('bomb-lab')
const isClearGlowLab = new URLSearchParams(window.location.search).has('clear-glow-lab')
const LightningLab = defineAsyncComponent(() => import('./game/gui/components/LightningLab.vue'))
const BombExplosionLab = defineAsyncComponent(
  () => import('./game/gui/components/BombExplosionLab.vue'),
)
const CubeClearGlowLab = defineAsyncComponent(
  () => import('./game/gui/components/CubeClearGlowLab.vue'),
)
</script>

<template>
  <CubeClearGlowLab v-if="isClearGlowLab" />
  <BombExplosionLab v-else-if="isBombLab" />
  <LightningLab v-else-if="isLightningLab" />
  <main v-else class="app-shell">
    <ThreeScene />
  </main>
</template>
