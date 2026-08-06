<script setup lang="ts">
import type { RewardPulse } from '../../core/model/RewardTarget.ts'
import type { CombatantState } from '../core/PvPBattleTypes.ts'
import AbilityIcon from './AbilityIcon.vue'
import CharacterPortrait from './CharacterPortrait.vue'

const props = withDefaults(
  defineProps<{
    combatant: CombatantState
    side: 'player' | 'opponent'
    interactive?: boolean
    disabled?: boolean
    rewardPulse?: RewardPulse | null
  }>(),
  { interactive: false, disabled: false },
)

const emit = defineEmits<{
  abilitySelect: [abilityId: string]
}>()

function isAbilityDisabled(abilityId: string): boolean {
  const ability = props.combatant.abilities.find(({ definition }) => definition.id === abilityId)
  if (!ability || props.disabled || !props.interactive) return true
  if (ability.definition.activation.type !== 'manual') return true
  if (props.combatant.energy < ability.definition.activation.energyCost) return true
  if (
    ability.definition.activation.usageLimit?.perRound !== undefined &&
    ability.usedThisRound >= ability.definition.activation.usageLimit.perRound
  ) {
    return true
  }
  return (
    ability.definition.activation.usageLimit?.perBattle !== undefined &&
    ability.usedInBattle >= ability.definition.activation.usageLimit.perBattle
  )
}
</script>

<template>
  <div
    class="combatant-panel__portrait-zone"
    :class="{
      'combatant-panel__portrait-zone--opponent': props.side === 'opponent',
      'combatant-panel__portrait-zone--energy-hit-a':
        props.rewardPulse?.resource === 'abilityEnergy' && props.rewardPulse.id % 2 === 0,
      'combatant-panel__portrait-zone--energy-hit-b':
        props.rewardPulse?.resource === 'abilityEnergy' && props.rewardPulse.id % 2 !== 0,
    }"
    :data-pvp-reward-target="props.side === 'player' ? 'portrait' : undefined"
  >
    <CharacterPortrait
      :src="props.combatant.portraitUrl"
      :alt="props.combatant.name"
      :defeated="props.combatant.hp <= 0"
    />
    <div class="combatant-panel__abilities">
      <AbilityIcon
        v-for="ability in props.combatant.abilities"
        :key="ability.definition.id"
        :ability="ability"
        :disabled="isAbilityDisabled(ability.definition.id)"
        @select="emit('abilitySelect', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.combatant-panel__portrait-zone {
  position: relative;
  z-index: 2;
  display: grid;
  width: 50%;
  max-width: 200px;
  height: 100%;
  min-height: 0;
  place-items: center;
}

.combatant-panel__portrait-zone--opponent {
  order: 2;
}

.combatant-panel__portrait-zone--opponent :deep(.ability-icon:disabled) {
  cursor: default;
  opacity: 1;
}

.combatant-panel__portrait-zone--energy-hit-a :deep(.character-portrait) {
  animation: combatant-portrait-energy-hit-a 360ms ease;
}

.combatant-panel__portrait-zone--energy-hit-b :deep(.character-portrait) {
  animation: combatant-portrait-energy-hit-b 360ms ease;
}

@keyframes combatant-portrait-energy-hit-a {
  50% {
    filter: brightness(1.8) drop-shadow(0 0 0.8rem #bd51ff);
  }
}

@keyframes combatant-portrait-energy-hit-b {
  50% {
    filter: brightness(1.8) drop-shadow(0 0 0.8rem #bd51ff);
  }
}

.combatant-panel__abilities {
  position: absolute;
  z-index: 3;
  bottom: -0.3rem;
  left: 50%;
  display: flex;
  width: 100%;
  justify-content: space-around;
  transform: translateX(-50%);
}
</style>
