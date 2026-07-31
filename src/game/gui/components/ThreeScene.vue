<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import ThreeScene from '../../three/scene/ThreeScene'
import GameControls from './GameControls.vue'
import { gameEvents } from '../../logic/events/GameEvents.ts'

const container = useTemplateRef<HTMLDivElement>('container')
let scene: ThreeScene | null = null

onMounted(() => {
  if (container.value) {
    scene = new ThreeScene(container.value)
  }
})

onBeforeUnmount(() => {
  scene?.dispose()
  scene = null
})

function rebuildBoard(): void {
  gameEvents.emit('board-rebuild-requested', { reason: 'manual' })
}
</script>

<template>
  <div class="scene-root">
    <div ref="container" class="scene-container" aria-label="Three.js scene" />
    <GameControls @rebuild="rebuildBoard" />
  </div>
</template>

<style scoped>
.scene-root {
  position: relative;
  width: 100%;
  height: 100%;
}

.scene-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  touch-action: none;
}

.scene-container :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
