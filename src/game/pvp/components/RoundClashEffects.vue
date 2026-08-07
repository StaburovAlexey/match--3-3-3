<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { RoundClashEffectMoment } from './RoundClashTimeline.ts'

const props = defineProps<{
  effects: readonly RoundClashEffectMoment[]
}>()

function getEffectStyle(effect: RoundClashEffectMoment): CSSProperties {
  return {
    left: `${effect.xPercent}%`,
    top: `${effect.yPercent}%`,
  }
}
</script>

<template>
  <div class="round-clash-effects" aria-hidden="true">
    <div
      v-for="effect in props.effects"
      :key="effect.id"
      :class="[
        'round-clash-effect',
        `round-clash-effect--${effect.kind}`,
        `round-clash-effect--${effect.elementType}`,
      ]"
      :style="getEffectStyle(effect)"
      :data-round-clash-effect="effect.id"
    >
      <svg
        v-if="effect.kind === 'lightning'"
        class="round-clash-effect__lightning"
        viewBox="0 0 120 70"
        focusable="false"
      >
        <polyline
          class="round-clash-effect__lightning-glow"
          data-round-clash-lightning-path
          pathLength="1"
          points="2,58 19,38 30,47 43,18 57,35 73,8 82,30 101,17 118,4"
        />
        <polyline
          class="round-clash-effect__lightning-core"
          data-round-clash-lightning-path
          pathLength="1"
          points="2,58 19,38 30,47 43,18 57,35 73,8 82,30 101,17 118,4"
        />
      </svg>

      <template v-else-if="effect.kind === 'explosion'">
        <span class="round-clash-effect__explosion-flash" data-round-clash-explosion-flash />
        <span class="round-clash-effect__explosion-ring" data-round-clash-explosion-ring />
        <span
          class="round-clash-effect__explosion-ring round-clash-effect__explosion-ring--second"
          data-round-clash-explosion-ring
        />
      </template>

      <span v-else class="round-clash-effect__flash" data-round-clash-flash />
    </div>
  </div>
</template>

<style scoped>
.round-clash-effects {
  position: absolute;
  z-index: 1;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.round-clash-effect {
  position: absolute;
  opacity: 0;
  transform-origin: center;
  will-change: transform, opacity;
}

.round-clash-effect--lightning {
  width: clamp(8rem, 40vw, 14rem);
  height: clamp(4rem, 20vw, 7rem);
}

.round-clash-effect--explosion {
  width: clamp(4rem, 18vw, 6.5rem);
  aspect-ratio: 1;
}

.round-clash-effect--flash {
  width: clamp(5rem, 26vw, 10rem);
  aspect-ratio: 1;
  mix-blend-mode: screen;
}

.round-clash-effect--ice {
  color: #57dbff;
}

.round-clash-effect--fire {
  color: #ff5a3d;
}

.round-clash-effect--earth {
  color: #45d65a;
}

.round-clash-effect--dark {
  color: #8b3dff;
}

.round-clash-effect--light {
  color: #fff1a8;
}

.round-clash-effect__lightning {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 0 0.7rem currentColor);
}

.round-clash-effect__lightning-core,
.round-clash-effect__lightning-glow {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: bevel;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  vector-effect: non-scaling-stroke;
}

.round-clash-effect__lightning-glow {
  stroke-width: 0.42rem;
  opacity: 0.28;
}

.round-clash-effect__lightning-core {
  stroke: #fff;
  stroke-width: 0.1rem;
}

.round-clash-effect__explosion-flash,
.round-clash-effect__explosion-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
}

.round-clash-effect__explosion-flash {
  background: radial-gradient(circle, #fff 0 7%, currentColor 27%, transparent 69%);
  filter: drop-shadow(0 0 1rem currentColor);
}

.round-clash-effect__explosion-ring {
  border: 0.18rem solid currentColor;
  box-shadow:
    0 0 0.8rem currentColor,
    inset 0 0 0.65rem currentColor;
}

.round-clash-effect__explosion-ring--second {
  border-width: 0.1rem;
  transform: rotate(45deg);
}

.round-clash-effect__flash {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    linear-gradient(90deg, transparent 45%, currentColor 49% 51%, transparent 55%),
    linear-gradient(0deg, transparent 45%, currentColor 49% 51%, transparent 55%),
    radial-gradient(circle, #fff 0 4%, currentColor 12%, transparent 62%);
  filter: drop-shadow(0 0 1.2rem currentColor);
  opacity: 0;
  will-change: transform, opacity;
}
</style>
