<script setup lang="ts">
import type { PvPBattlePhase } from '../core/PvPBattleTypes.ts'

const props = defineProps<{
  phase: PvPBattlePhase
  message: string
}>()
</script>

<template>
  <div class="turn-indicator" :class="`turn-indicator--${props.phase}`" aria-live="polite">
    <span class="turn-indicator__dot" />
    <span class="turn-indicator__message">{{ props.message }}</span>
  </div>
</template>

<style scoped>
.turn-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  max-width: min(100%, 22rem);
  padding: 0.45rem 1rem;
  border: 0.1rem solid #f4c223;
  border-radius: 999px;
  color: #fff6d0;
  background: rgb(104 65 17 / 78%);
  box-shadow: 0 0 1rem rgb(255 189 28 / 55%);
  font-size: clamp(0.65rem, 2cqw, 0.9rem);
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.turn-indicator--opponent-turn,
.turn-indicator--resolving {
  border-color: #bc76ed;
  background: rgb(55 20 80 / 82%);
  box-shadow: 0 0 1rem rgb(186 77 255 / 45%);
}

.turn-indicator--finished {
  border-color: #fff;
  background: rgb(79 56 10 / 92%);
}

.turn-indicator__dot {
  width: 0.72rem;
  height: 0.72rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #fff0a0;
  box-shadow: 0 0 0.6rem #fff0a0;
}

.turn-indicator--opponent-turn .turn-indicator__dot,
.turn-indicator--resolving .turn-indicator__dot {
  background: #d991ff;
  box-shadow: 0 0 0.6rem #d991ff;
}

.turn-indicator__message {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
