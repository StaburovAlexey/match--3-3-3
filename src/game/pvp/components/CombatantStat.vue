<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerRewardStat, RewardPulse } from '../../core/model/RewardTarget.ts'
import { useHudShake } from '../composables/useHudShake.ts'

const props = withDefaults(
  defineProps<{
    resource: PlayerRewardStat
    value: number
    icon: string
    rewardTarget?: boolean
    rewardPulse?: RewardPulse | null
  }>(),
  { rewardTarget: false, rewardPulse: null },
)

const isHit = computed(() => props.rewardPulse?.resource === props.resource)
const pulseKey = computed(() => (isHit.value ? (props.rewardPulse?.id ?? 0) : 0))
const hudShake = useHudShake()
</script>

<template>
  <span
    :ref="hudShake.setTarget"
    class="combatant-stat pvp-hud-shake-target"
    :class="{ 'pvp-hud-shake-target--active': hudShake.isShaking.value }"
    :style="hudShake.style.value"
  >
    <b
      :key="pulseKey"
      class="combatant-stat__value"
      :class="{ 'combatant-stat__value--hit': isHit }"
      :data-pvp-reward-stat="props.rewardTarget ? props.resource : undefined"
    >
      <img class="combatant-stat__icon" :src="props.icon" alt="" aria-hidden="true" />
    </b>
    {{ props.value }}
  </span>
</template>

<style scoped>
.combatant-stat {
  display: inline-flex;
  align-items: center;
}

.combatant-stat__value {
  display: inline-grid;
  width: 1.45rem;
  aspect-ratio: 1;
  flex: 0 0 auto;
  place-items: center;
  margin-right: 0.22rem;
}

.combatant-stat__icon {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.combatant-stat__value--hit {
  animation: combatant-stat-hit 360ms ease;
}

@keyframes combatant-stat-hit {
  50% {
    filter: brightness(1.9);
    transform: scale(1.3);
  }
}
</style>
