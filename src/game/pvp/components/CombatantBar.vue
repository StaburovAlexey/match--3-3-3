<script setup lang="ts">
import { computed } from 'vue'
import { useHudShake } from '../composables/useHudShake.ts'

const props = withDefaults(
  defineProps<{
    value: number
    max: number
    variant: 'hp' | 'energy'
    pulseId?: number | null
  }>(),
  { pulseId: null },
)

const fillWidth = computed(
  () => `${Math.max(0, Math.min(100, (props.value / Math.max(1, props.max)) * 100))}%`,
)
const icon = computed(() => (props.variant === 'hp' ? '♥' : '◉'))
const label = computed(() => (props.variant === 'hp' ? 'Здоровье' : 'Очки способностей'))
const ariaValue = computed(() => Math.max(0, Math.min(props.max, props.value)))
const pulseClass = computed(() => {
  if (props.variant !== 'energy' || props.pulseId === null) return undefined
  return props.pulseId % 2 === 0
    ? 'combatant-panel__bar--energy-hit-a'
    : 'combatant-panel__bar--energy-hit-b'
})
const hudShake = useHudShake()
</script>

<template>
  <div
    :ref="hudShake.setTarget"
    class="combatant-panel__bar pvp-hud-shake-target"
    :class="[
      `combatant-panel__bar--${props.variant}`,
      pulseClass,
      { 'pvp-hud-shake-target--active': hudShake.isShaking.value },
    ]"
    :style="hudShake.style.value"
    role="progressbar"
    :aria-label="label"
    aria-valuemin="0"
    :aria-valuemax="props.max"
    :aria-valuenow="ariaValue"
  >
    <span class="combatant-panel__bar-fill" :style="{ width: fillWidth }" />
    <span class="combatant-panel__bar-label">{{ icon }} {{ props.value }} / {{ props.max }}</span>
  </div>
</template>

<style scoped>
.combatant-panel__bar {
  position: relative;
  height: 1rem;
  overflow: hidden;
  border: 0.1rem solid currentColor;
  border-radius: 999px;
  background: #16091e;
}

.combatant-panel__bar--hp {
  color: #ff5858;
}

.combatant-panel__bar--energy {
  color: #cb65ff;
}

.combatant-panel__bar--energy-hit-a,
.combatant-panel__bar--energy-hit-b {
  animation-duration: 360ms;
  animation-timing-function: ease;
}

.combatant-panel__bar--energy-hit-a {
  animation-name: combatant-panel-energy-hit-a;
}

.combatant-panel__bar--energy-hit-b {
  animation-name: combatant-panel-energy-hit-b;
}

@keyframes combatant-panel-energy-hit-a {
  50% {
    filter: brightness(1.9);
    box-shadow: 0 0 1rem #cb65ff;
  }
}

@keyframes combatant-panel-energy-hit-b {
  50% {
    filter: brightness(1.9);
    box-shadow: 0 0 1rem #cb65ff;
  }
}

.combatant-panel__bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: currentColor;
  box-shadow: 0 0 0.75rem currentColor;
  transition: width 240ms ease;
}

.combatant-panel__bar-label {
  position: relative;
  z-index: 1;
  display: block;
  color: white;
  font-size: 0.65rem;
  font-weight: 900;
  text-align: center;
  text-shadow: 0 1px 0 #000;
}
</style>
