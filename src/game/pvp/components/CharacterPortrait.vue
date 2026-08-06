<script setup lang="ts">
import { useHudShake } from '../composables/useHudShake.ts'

withDefaults(
  defineProps<{
    src: string
    alt: string
    defeated?: boolean
  }>(),
  { defeated: false },
)

const hudShake = useHudShake()
</script>

<template>
  <div
    :ref="hudShake.setTarget"
    class="character-portrait pvp-hud-shake-target"
    :class="[
      { 'character-portrait--defeated': defeated },
      { 'pvp-hud-shake-target--active': hudShake.isShaking.value },
    ]"
    :style="hudShake.style.value"
  >
    <img class="character-portrait__image" :src="src" :alt="alt" />
  </div>
</template>

<style scoped>
.character-portrait {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
}

.character-portrait--defeated {
  filter: grayscale(0.9);
  opacity: 0.55;
}

.character-portrait__image {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
