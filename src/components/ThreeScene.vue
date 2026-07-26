<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import ThreeScene from '../three/ThreeScene'

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
</script>

<template>
  <div ref="container" class="scene-container" aria-label="Three.js scene" />
</template>

<style scoped>
.scene-container {
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
