<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { CombatantState, RoundResolutionResult } from '../../core/PvPBattleTypes.ts'
import RoundClashIntro from './RoundClashIntro.vue'
import RoundClashScene from './RoundClashScene.vue'
import type { RoundClashPresentationState } from './RoundClashTypes.ts'
import { useRoundClashSequence } from './useRoundClashSequence.ts'

const props = defineProps<{
  player: CombatantState
  opponent: CombatantState
  resolution: RoundResolutionResult | null
}>()

const emit = defineEmits<{
  presentationChange: [presentation: RoundClashPresentationState]
}>()

const sequenceRoot = useTemplateRef<HTMLDivElement>('sequenceRoot')
const sequence = useRoundClashSequence({
  root: sequenceRoot,
  resolution: () => props.resolution,
  playerElementType: () => props.player.elementType,
  opponentElementType: () => props.opponent.elementType,
  onPresentationChange: (presentation) => emit('presentationChange', presentation),
})
</script>

<template>
  <div
    v-if="sequence.isActive.value"
    :key="sequence.renderKey.value"
    ref="sequenceRoot"
    class="round-clash-sequence"
    aria-hidden="true"
  >
    <div class="round-clash-sequence__backdrop" data-round-clash-backdrop />
    <RoundClashIntro />
    <RoundClashScene
      :player="props.player"
      :opponent="props.opponent"
      :effects="sequence.effects.value"
    />
  </div>
</template>

<style scoped>
.round-clash-sequence {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.round-clash-sequence__backdrop {
  position: absolute;
  z-index: 4;
  inset: 0;
  visibility: hidden;
  background: rgb(0 0 0 / 68%);
  backdrop-filter: brightness(0.48) saturate(0.72);
  -webkit-backdrop-filter: brightness(0.48) saturate(0.72);
  opacity: 0;
  pointer-events: none;
}
</style>
