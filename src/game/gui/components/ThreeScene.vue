<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { ThreeGameRuntime } from '../../runtime/ThreeGameRuntime.ts'
import GameControls from './GameControls.vue'

const container = useTemplateRef<HTMLDivElement>('container')
const runtime = shallowRef<ThreeGameRuntime | null>(null)

onMounted(() => {
  if (!container.value) return
  runtime.value = new ThreeGameRuntime(container.value)
  void runtime.value.start()
})

onBeforeUnmount(() => {
  runtime.value?.dispose()
  runtime.value = null
})

function rebuildBoard(): void {
  void runtime.value?.rebuildBoard()
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
