<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { BombExplosionLabRuntime } from '../../presentation/three/lab/BombExplosionLabRuntime.ts'

const sceneContainer = useTemplateRef<HTMLDivElement>('sceneContainer')
const guiContainer = useTemplateRef<HTMLDivElement>('guiContainer')
const runtime = shallowRef<BombExplosionLabRuntime | null>(null)

onMounted(() => {
  if (!sceneContainer.value || !guiContainer.value) return
  runtime.value = new BombExplosionLabRuntime(sceneContainer.value, guiContainer.value)
})

onBeforeUnmount(() => {
  runtime.value?.dispose()
  runtime.value = null
})
</script>

<template>
  <main class="bomb-lab">
    <div ref="sceneContainer" class="bomb-lab__scene" aria-label="Bomb explosion test scene" />

    <header class="bomb-lab__header">
      <h1>Bomb Explosion Lab</h1>
      <p>Настрой взрыв справа. Модель можно вращать мышью или пальцем.</p>
      <a href="./">Вернуться в игру</a>
    </header>

    <aside ref="guiContainer" class="bomb-lab__controls" aria-label="Bomb explosion settings" />
  </main>
</template>

<style scoped>
.bomb-lab {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #111827;
}

.bomb-lab__scene {
  position: absolute;
  inset: 0;
  min-height: 320px;
  overflow: hidden;
  touch-action: none;
}

.bomb-lab__scene :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.bomb-lab__header {
  position: absolute;
  z-index: 20;
  top: 52px;
  left: 16px;
  max-width: min(360px, calc(100% - 32px));
  padding: 12px 14px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 10px;
  background: rgb(6 12 24 / 78%);
  box-shadow: 0 12px 32px rgb(0 0 0 / 24%);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.bomb-lab__header h1 {
  margin: 0 0 4px;
  font-size: 18px;
}

.bomb-lab__header p {
  margin: 0;
  color: #bac5d8;
  font-size: 13px;
  line-height: 1.4;
}

.bomb-lab__header a {
  display: inline-block;
  margin-top: 8px;
  color: #fda4af;
  font-size: 13px;
  pointer-events: auto;
}

.bomb-lab__controls {
  position: absolute;
  z-index: 30;
  top: 12px;
  right: 12px;
  max-height: calc(100% - 24px);
  overflow: auto;
  border-radius: 8px;
}

.bomb-lab__controls :deep(.lil-gui.root) {
  --background-color: rgb(9 17 31 / 94%);
  --widget-color: #1e2c43;
  --hover-color: #293a56;
  --focus-color: #334866;
  --text-color: #e5edf9;
  --number-color: #fda4af;
  --string-color: #fde68a;
  --name-width: 56%;
}

@media (max-width: 720px) {
  .bomb-lab__header {
    top: 42px;
    max-width: calc(100% - 56px);
  }

  .bomb-lab__header p {
    display: none;
  }

  .bomb-lab__controls {
    top: 8px;
    right: 8px;
    max-width: calc(100% - 16px);
    max-height: calc(100% - 16px);
  }
}
</style>
