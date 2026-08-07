<script setup lang="ts">
import type { CombatantState } from '../core/PvPBattleTypes.ts'
import RoundClashEffects from './RoundClashEffects.vue'
import type { RoundClashEffectMoment } from './RoundClashTimeline.ts'

const props = defineProps<{
  player: CombatantState
  opponent: CombatantState
  effects: readonly RoundClashEffectMoment[]
}>()
</script>

<template>
  <div class="round-clash-animation" aria-hidden="true">
    <RoundClashEffects :effects="props.effects" />

    <div class="round-clash__arena" data-round-clash-arena>
      <div
        class="round-clash__fighter round-clash__fighter--opponent"
        data-round-clash-fighter="opponent"
      >
        <img :src="props.opponent.portraitUrl" :alt="props.opponent.name" />
      </div>
      <div
        class="round-clash__fighter round-clash__fighter--player"
        data-round-clash-fighter="player"
      >
        <img :src="props.player.portraitUrl" :alt="props.player.name" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.round-clash-animation {
  position: absolute;
  z-index: 5;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.round-clash__arena {
  position: absolute;
  z-index: 2;
  inset: 20% 0;
  transform-origin: center;
  will-change: transform;
}

.round-clash__fighter {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  width: clamp(6rem, 28vw, 9.5rem);
  height: clamp(7rem, 31vw, 11rem);
  opacity: 0;
  transform-origin: center;
  filter: drop-shadow(0 0 0.7rem rgb(255 255 255 / 35%));
  will-change: transform, opacity;
}

.round-clash__fighter img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
