<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { CubeClearGlowLabRuntime } from '../../presentation/three/lab/CubeClearGlowLabRuntime.ts'

const sceneContainer = useTemplateRef<HTMLDivElement>('sceneContainer')
const guiContainer = useTemplateRef<HTMLDivElement>('guiContainer')
const runtime = shallowRef<CubeClearGlowLabRuntime | null>(null)

onMounted(() => {
  if (!sceneContainer.value || !guiContainer.value) return
  runtime.value = new CubeClearGlowLabRuntime(sceneContainer.value, guiContainer.value)
})

onBeforeUnmount(() => {
  runtime.value?.dispose()
  runtime.value = null
})
</script>

<template>
  <main class="clear-glow-lab">
    <div
      ref="sceneContainer"
      class="clear-glow-lab__scene"
      aria-label="Cube clear glow test scene"
    />

    <header class="clear-glow-lab__header">
      <h1 class="clear-glow-lab__title">Cube Clear Glow Lab</h1>
      <p class="clear-glow-lab__description">
        Настрой свечение уничтожаемого куба. Камеру можно вращать мышью или пальцем.
      </p>
      <a class="clear-glow-lab__link" href="./">Вернуться в игру</a>
    </header>

    <aside
      ref="guiContainer"
      class="clear-glow-lab__controls"
      aria-label="Cube clear glow settings"
    />
  </main>
</template>

<style scoped>
.clear-glow-lab {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #111827;
}

.clear-glow-lab__scene {
  position: absolute;
  inset: 0;
  min-height: 320px;
  overflow: hidden;
  touch-action: none;
}

.clear-glow-lab__scene :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.clear-glow-lab__header {
  position: absolute;
  z-index: 20;
  top: 52px;
  left: 16px;
  max-width: min(390px, calc(100% - 32px));
  padding: 12px 14px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 10px;
  background: rgb(6 12 24 / 78%);
  box-shadow: 0 12px 32px rgb(0 0 0 / 24%);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.clear-glow-lab__title {
  margin: 0 0 4px;
  font-size: 18px;
}

.clear-glow-lab__description {
  margin: 0;
  color: #bac5d8;
  font-size: 13px;
  line-height: 1.4;
}

.clear-glow-lab__link {
  display: inline-block;
  margin-top: 8px;
  color: #f0abfc;
  font-size: 13px;
  pointer-events: auto;
}

.clear-glow-lab__controls {
  position: absolute;
  z-index: 30;
  top: 12px;
  right: 12px;
  max-height: calc(100% - 24px);
  overflow: auto;
  border-radius: 8px;
}

.clear-glow-lab__controls :deep(.lil-gui.root) {
  --background-color: rgb(9 17 31 / 94%);
  --widget-color: #1e2c43;
  --hover-color: #293a56;
  --focus-color: #334866;
  --text-color: #e5edf9;
  --number-color: #f0abfc;
  --string-color: #a7f3d0;
  --name-width: 56%;
}

@media (max-width: 720px) {
  .clear-glow-lab__header {
    top: 42px;
    max-width: calc(100% - 56px);
  }

  .clear-glow-lab__description {
    display: none;
  }

  .clear-glow-lab__controls {
    top: 8px;
    right: 8px;
    max-width: calc(100% - 16px);
    max-height: calc(100% - 16px);
  }
}
</style>
