<script setup lang="ts">
import { nextTick, shallowRef, watch, type ComponentPublicInstance } from 'vue'
import type { HudShakeReason } from '../../core/model/RewardTarget.ts'
import { HUD_SCREEN_CRACK_COLOR } from '../config/HudEffectsConfig.ts'
import {
  getScreenCrackIntensity,
  type ScreenCrackIntensity,
} from '../composables/screenCrackIntensity.ts'

const props = defineProps<{
  pulseId: number
  reason: HudShakeReason
  multiplier: number
  intensity?: ScreenCrackIntensity | null
  color?: string
}>()

const root = shallowRef<HTMLElement | null>(null)
const isActive = shallowRef(false)
const variant = shallowRef(0)
const style = shallowRef<Record<string, string>>({})

function randomSigned(min: number, max: number): number {
  const magnitude = min + Math.random() * (max - min)
  return Math.random() < 0.5 ? -magnitude : magnitude
}

function setRoot(element: Element | ComponentPublicInstance | null): void {
  root.value = typeof HTMLElement !== 'undefined' && element instanceof HTMLElement ? element : null
}

watch(
  () => props.pulseId,
  () => {
    const intensity =
      props.intensity === undefined
        ? getScreenCrackIntensity(props.reason, props.multiplier)
        : props.intensity
    isActive.value = false

    if (!intensity) {
      style.value = {}
      return
    }

    variant.value = (variant.value + 1) % 3
    style.value = {
      '--screen-crack-opacity': `${intensity.opacity}`,
      '--screen-crack-width': `${intensity.width}`,
      '--screen-crack-scale': `${intensity.scale}`,
      '--screen-crack-duration': `${intensity.duration}ms`,
      '--screen-crack-glow': `${intensity.glow}rem`,
      '--screen-crack-rotation': `${randomSigned(-2.5, 2.5)}deg`,
      '--screen-crack-shift-x': `${randomSigned(-1.5, 1.5)}%`,
      '--screen-crack-shift-y': `${randomSigned(-1.5, 1.5)}%`,
      '--screen-crack-color': props.color ?? HUD_SCREEN_CRACK_COLOR,
    }

    void nextTick(() => {
      if (root.value) void root.value.offsetWidth
      isActive.value = true
    })
  },
)
</script>

<template>
  <div
    :ref="setRoot"
    class="screen-crack-overlay"
    :class="{ 'screen-crack-overlay--active': isActive }"
    :style="style"
    aria-hidden="true"
  >
    <svg
      class="screen-crack-overlay__svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      focusable="false"
    >
      <g v-if="variant === 0" class="screen-crack-overlay__group">
        <path
          class="screen-crack-overlay__path"
          d="M-2 7 12 19 18 35 32 44 39 59 52 67 58 84 70 102"
        />
        <path
          class="screen-crack-overlay__path"
          d="m12 19-11 2M18 35 5 42M32 44l13-8M39 59l-9 14"
        />
        <path class="screen-crack-overlay__path" d="M102 86 87 75 82 61 69 52 63 38 50 31 45-2" />
        <path
          class="screen-crack-overlay__path"
          d="m87 75 12 4M82 61l14-7M69 52l-10-9M63 38l9-13"
        />
      </g>
      <g v-else-if="variant === 1" class="screen-crack-overlay__group">
        <path
          class="screen-crack-overlay__path"
          d="M-2 78 14 69 27 70 39 58 49 59 61 47 74 46 87 31 102 27"
        />
        <path
          class="screen-crack-overlay__path"
          d="m14 69-6-15M27 70l8 15M49 59l-1-16M74 46l8 13"
        />
        <path
          class="screen-crack-overlay__path"
          d="M-2 25 13 30 22 42 36 40 49 50 64 34 78 26 102 15"
        />
        <path
          class="screen-crack-overlay__path"
          d="m13 30 2-16M22 42 8 48M36 40l8-13M64 34l-3-17M78 26l13 6"
        />
      </g>
      <g v-else class="screen-crack-overlay__group">
        <path
          class="screen-crack-overlay__path"
          d="M50 48 39 31 25 25 17 8M50 48 64 35 79 28 91 7"
        />
        <path
          class="screen-crack-overlay__path"
          d="M50 48 38 54 25 68 13 92M50 48 63 56 76 70 88 94"
        />
        <path
          class="screen-crack-overlay__path"
          d="M50 48 48 31 50 14 45-3M50 48 54 31 62 17 66-3"
        />
        <path
          class="screen-crack-overlay__path"
          d="m39 31-2-15M25 25 9 28M64 35l3-15M79 28l14 1M38 54l-14-2M63 56l14-2"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.screen-crack-overlay {
  position: absolute;
  z-index: 4;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  color: var(--screen-crack-color);
  opacity: 0;
  mix-blend-mode: screen;
}

.screen-crack-overlay--active {
  animation: screen-crack-overlay-flash var(--screen-crack-duration, 440ms) ease-out both;
}

.screen-crack-overlay__svg {
  position: absolute;
  top: calc(var(--screen-crack-shift-y, 0%) - 8%);
  left: calc(var(--screen-crack-shift-x, 0%) - 8%);
  width: 116%;
  height: 116%;
  overflow: visible;
  filter: drop-shadow(0 0 var(--screen-crack-glow, 0.8rem) currentColor);
  opacity: var(--screen-crack-opacity, 0.45);
  transform: rotate(var(--screen-crack-rotation, 0deg)) scale(var(--screen-crack-scale, 1));
  transform-origin: center;
}

.screen-crack-overlay__path {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: var(--screen-crack-width, 1.2);
  vector-effect: non-scaling-stroke;
}

@keyframes screen-crack-overlay-flash {
  0% {
    opacity: 0;
  }

  14% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .screen-crack-overlay--active {
    animation: none;
  }
}
</style>
