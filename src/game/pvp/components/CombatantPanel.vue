<script setup lang="ts">
import { computed } from 'vue'
import type { RewardPulse } from '../../core/model/RewardTarget.ts'
import type { CombatantState, RoundResources } from '../core/PvPBattleTypes.ts'
import CombatantBar from './CombatantBar.vue'
import CombatantPanelHeader from './CombatantPanelHeader.vue'
import CombatantPortraitZone from './CombatantPortraitZone.vue'
import CombatantStats from './CombatantStats.vue'

const props = withDefaults(
  defineProps<{
    combatant: CombatantState
    side: 'player' | 'opponent'
    displayHp?: number
    interactive?: boolean
    disabled?: boolean
    displayResources?: RoundResources
    displayEnergy?: number
    rewardPulse?: RewardPulse | null
  }>(),
  { interactive: false, disabled: false },
)

const emit = defineEmits<{
  abilitySelect: [abilityId: string]
}>()

const displayedResources = computed(() => props.displayResources ?? props.combatant.resources)
const displayedEnergy = computed(() => props.displayEnergy ?? props.combatant.energy)
const displayedHp = computed(() => props.displayHp ?? props.combatant.hp)
const energyPulseId = computed(() =>
  props.rewardPulse?.resource === 'abilityEnergy' ? props.rewardPulse.id : null,
)
</script>

<template>
  <section
    class="combatant-panel"
    :class="[`combatant-panel--${props.side}`, { 'combatant-panel--defeated': displayedHp <= 0 }]"
    :aria-label="props.combatant.name"
  >
    <CombatantPortraitZone
      :combatant="props.combatant"
      :side="props.side"
      :interactive="props.interactive"
      :disabled="props.disabled"
      :reward-pulse="props.rewardPulse"
      @ability-select="emit('abilitySelect', $event)"
    />

    <div class="combatant-panel__content">
      <CombatantPanelHeader :name="props.combatant.name" :rating="props.combatant.rating" />

      <div class="combatant-panel__bars">
        <CombatantBar variant="hp" :value="displayedHp" :max="props.combatant.maxHp" />
        <CombatantBar
          variant="energy"
          :value="displayedEnergy"
          :max="100"
          :pulse-id="energyPulseId"
        />

        <CombatantStats
          :resources="displayedResources"
          :side="props.side"
          :reward-pulse="props.rewardPulse"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.combatant-panel {
  position: relative;
  display: flex;
  width: 100%;

  max-height: 9rem;
  align-items: stretch;
  /* border: 0.14rem solid #b763ed;
  border-radius: 1.35rem; */
  color: #f7f1ff;
  padding: 0rem 0 0.2rem;
  /* background: linear-gradient(145deg, rgb(35 20 48 / 94%), rgb(9 6 18 / 93%));
  box-shadow:
    0 0 1.5rem rgb(145 50 244 / 30%),
    inset 0 0 1rem rgb(0 0 0 / 42%); */
  overflow: visible;
}

.combatant-panel--opponent {
  border-color: #cbd632;
  /* background: linear-gradient(145deg, rgb(28 49 11 / 94%), rgb(7 15 5 / 93%));
  box-shadow:
    0 0 1.5rem rgb(207 222 48 / 25%),
    inset 0 0 1rem rgb(0 0 0 / 42%); */
}

.combatant-panel--defeated {
  filter: saturate(0.55);
}

.combatant-panel__content {
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: end;
  min-width: 0;
  flex: 1;
  grid-template-rows: auto 1fr;
  gap: 0.4rem;
  padding: 0 0 0 0.4rem;
}

.combatant-panel--opponent .combatant-panel__content {
  order: 1;
}

.combatant-panel__bars {
  display: grid;
  width: 100%;
  align-content: center;
  gap: 0.42rem;
}
</style>
