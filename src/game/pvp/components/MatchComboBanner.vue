<script setup lang="ts">
import { computed } from 'vue'
import comboX2Icon from '../../../assets/pvp/multipliers/combo-x2.png'
import comboX3Icon from '../../../assets/pvp/multipliers/combo-x3.png'
import comboX4Icon from '../../../assets/pvp/multipliers/combo-x4.png'
import comboX5Icon from '../../../assets/pvp/multipliers/combo-x5.png'
import { useHudShake } from '../composables/useHudShake.ts'

const props = defineProps<{
  multiplier: number
  pulseId: number
}>()

const multiplierIcons = {
  2: comboX2Icon,
  3: comboX3Icon,
  4: comboX4Icon,
  5: comboX5Icon,
} as const

const multiplierIcon = computed(() => {
  const multiplier = Math.min(5, Math.max(2, Math.floor(props.multiplier))) as 2 | 3 | 4 | 5
  return multiplierIcons[multiplier]
})

const hudShake = useHudShake()
</script>

<template>
  <div
    :key="props.pulseId"
    :ref="hudShake.setTarget"
    class="match-combo-banner pvp-hud-shake-target"
    :class="{ 'pvp-hud-shake-target--active': hudShake.isShaking.value }"
    :style="hudShake.style.value"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <img
      class="match-combo-banner__icon"
      :src="multiplierIcon"
      :alt="`Множитель ×${props.multiplier}`"
    />
  </div>
</template>

<style scoped>
.match-combo-banner {
  display: grid;
  width: clamp(7rem, 22cqw, 13rem);
  aspect-ratio: 1;
  place-items: center;
  pointer-events: none;
  animation: match-combo-banner-pop 440ms cubic-bezier(0.2, 0.85, 0.3, 1.2);
}

.match-combo-banner__icon {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 0.8rem rgb(255 198 55 / 25%));
}

@keyframes match-combo-banner-pop {
  0% {
    opacity: 0;
    transform: translateY(0.35rem) scale(0.78);
  }

  55% {
    opacity: 1;
    transform: translateY(0) scale(1.08);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
