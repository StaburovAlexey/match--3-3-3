<script setup lang="ts">
import earthShieldIcon from '../../../assets/pvp/stats/earth-shield.png'
import fireSwordIcon from '../../../assets/pvp/stats/fire-sword.png'
import iceSwordIcon from '../../../assets/pvp/stats/ice-sword.png'
import lightShieldIcon from '../../../assets/pvp/stats/light-shield.png'
import type { PlayerRewardStat, RewardPulse } from '../../core/model/RewardTarget.ts'
import type { RoundResources } from '../core/PvPBattleTypes.ts'
import CombatantStat from './CombatantStat.vue'

const props = withDefaults(
  defineProps<{
    resources: RoundResources
    side: 'player' | 'opponent'
    rewardPulse?: RewardPulse | null
  }>(),
  { rewardPulse: null },
)

interface CombatantStatDefinition {
  resource: PlayerRewardStat
  icon: string
}

const statDefinitions: readonly CombatantStatDefinition[] = [
  { resource: 'fireDamage', icon: fireSwordIcon },
  { resource: 'iceDamage', icon: iceSwordIcon },
  { resource: 'earthDefense', icon: earthShieldIcon },
  { resource: 'lightDefense', icon: lightShieldIcon },
]
</script>

<template>
  <div class="combatant-stats">
    <CombatantStat
      v-for="stat in statDefinitions"
      :key="stat.resource"
      :resource="stat.resource"
      :value="props.resources[stat.resource]"
      :icon="stat.icon"
      :reward-target="props.side === 'player'"
      :reward-pulse="props.rewardPulse"
    />
  </div>
</template>

<style scoped>
.combatant-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 0.55rem;
  justify-items: start;
  color: #e8e0ee;
  font-size: clamp(0.62rem, 1.8cqw, 0.85rem);
  font-weight: 800;
}
</style>
