<script setup lang="ts">
import { computed, toRef, useTemplateRef } from 'vue'
import type { AbilityInteractionState } from '../../core/ability/AbilityContract.ts'
import type {
  HudShakeReason,
  ResolvePlayerRewardTarget,
  RewardPulse,
  ScreenPoint,
} from '../../core/model/RewardTarget.ts'
import type { PvPBattleState, RoundResources } from '../core/PvPBattleTypes.ts'
import { provideHudShake, useHudShake } from '../composables/useHudShake.ts'
import type { RoundClashPresentationState } from './round-clash/RoundClashTypes.ts'
import CombatantPanel from './CombatantPanel.vue'
import MatchComboBanner from './MatchComboBanner.vue'

const props = defineProps<{
  state: PvPBattleState
  abilityState: AbilityInteractionState
  playerInputEnabled: boolean
  displayResources: RoundResources
  displayEnergy: number
  rewardPulse: RewardPulse | null
  matchMultiplier: number
  matchMultiplierPulseId: number
  hudShakePulseId: number
  hudShakeReason: HudShakeReason
  roundBattle: RoundClashPresentationState
}>()

const emit = defineEmits<{
  abilitySelect: [abilityId: string]
  confirmAbility: []
  cancelAbility: []
  continueRound: []
  exit: []
}>()

const hudRoot = useTemplateRef<HTMLDivElement>('hudRoot')
provideHudShake(
  toRef(props, 'hudShakePulseId'),
  toRef(props, 'hudShakeReason'),
  toRef(props, 'matchMultiplier'),
)
const abilityControlsShake = useHudShake()
const roundActionShake = useHudShake()
const roundBattleActive = computed(
  () => props.roundBattle.phase === 'battle' || props.roundBattle.phase === 'complete',
)
const roundBattleFinished = computed(() => props.roundBattle.phase === 'complete')

function resolvePlayerRewardTarget(
  destination: Parameters<ResolvePlayerRewardTarget>[0],
): ScreenPoint | null {
  const selector =
    destination === 'portrait'
      ? '[data-pvp-reward-target="portrait"]'
      : `[data-pvp-reward-stat="${destination}"]`
  const target = hudRoot.value?.querySelector<HTMLElement>(selector)
  if (!target) return null

  const rect = target.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

defineExpose({ resolvePlayerRewardTarget })
</script>

<template>
  <div
    ref="hudRoot"
    class="pvp-battle-hud"
    :class="{ 'pvp-battle-hud--round-battle': roundBattleActive }"
  >
    <CombatantPanel
      :combatant="props.state.opponent"
      :display-hp="props.roundBattle.health?.opponent"
      :display-resources="props.roundBattle.resources?.opponent ?? props.state.opponent.resources"
      :display-energy="props.roundBattle.resources?.opponent.abilityEnergy"
      side="opponent"
      :disabled="true"
    />

    <div class="pvp-battle-hud__center">
      <MatchComboBanner
        v-if="props.matchMultiplier > 1"
        :multiplier="props.matchMultiplier"
        :pulse-id="props.matchMultiplierPulseId"
      />
      <div
        v-if="props.abilityState.phase !== 'idle'"
        :ref="abilityControlsShake.setTarget"
        class="pvp-battle-hud__ability-controls pvp-hud-shake-target"
        :class="{ 'pvp-hud-shake-target--active': abilityControlsShake.isShaking.value }"
        :style="abilityControlsShake.style.value"
      >
        <span class="pvp-battle-hud__ability-hint">
          {{
            props.abilityState.request?.effect.type === 'rotateSegment'
              ? 'Выберите сегмент и повторите клик для поворота'
              : 'Выберите кубы на поле'
          }}
        </span>
        <div class="pvp-battle-hud__ability-actions">
          <button
            class="pvp-battle-hud__action pvp-battle-hud__action--confirm"
            type="button"
            :disabled="
              !props.abilityState.canConfirm ||
              props.abilityState.previewBusy ||
              props.abilityState.phase === 'executing'
            "
            @click="emit('confirmAbility')"
          >
            {{ props.abilityState.phase === 'executing' ? 'Выполняется…' : 'Применить' }}
          </button>
          <button
            class="pvp-battle-hud__action"
            type="button"
            :disabled="props.abilityState.phase === 'executing'"
            @click="emit('cancelAbility')"
          >
            Отмена
          </button>
        </div>
        <span v-if="props.abilityState.error" class="pvp-battle-hud__ability-error">
          {{ props.abilityState.error }}
        </span>
      </div>

      <button
        v-if="props.state.phase === 'round-result' && roundBattleFinished"
        :ref="roundActionShake.setTarget"
        class="pvp-battle-hud__next pvp-hud-shake-target"
        :class="{ 'pvp-hud-shake-target--active': roundActionShake.isShaking.value }"
        :style="roundActionShake.style.value"
        type="button"
        @click="emit('continueRound')"
      >
        Продолжить
      </button>
      <button
        v-if="props.state.phase === 'finished' && roundBattleFinished"
        :ref="roundActionShake.setTarget"
        class="pvp-battle-hud__next pvp-hud-shake-target"
        :class="{ 'pvp-hud-shake-target--active': roundActionShake.isShaking.value }"
        :style="roundActionShake.style.value"
        type="button"
        @click="emit('exit')"
      >
        Вернуться к выбору
      </button>
    </div>

    <CombatantPanel
      :combatant="props.state.player"
      side="player"
      :interactive="props.playerInputEnabled"
      :disabled="!props.playerInputEnabled || props.abilityState.phase !== 'idle'"
      :display-resources="props.roundBattle.resources?.player ?? props.displayResources"
      :display-energy="props.roundBattle.resources?.player.abilityEnergy ?? props.displayEnergy"
      :display-hp="props.roundBattle.health?.player"
      :reward-pulse="props.rewardPulse"
      @ability-select="emit('abilitySelect', $event)"
    />
  </div>
</template>

<style scoped>
.pvp-battle-hud {
  position: relative;
  z-index: 6;
  display: flex;
  width: min(100%, 72rem);
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(0.45rem, 1.6vh, 1.1rem);
  padding: 0 0.7rem 0.7rem;
  pointer-events: none;
}

.pvp-battle-hud > * {
  pointer-events: auto;
}

.pvp-battle-hud :deep(.combatant-panel__portrait-zone) {
  transition:
    width 620ms cubic-bezier(0.22, 0.76, 0.28, 1),
    max-width 620ms cubic-bezier(0.22, 0.76, 0.28, 1),
    opacity 420ms ease,
    transform 620ms cubic-bezier(0.22, 0.76, 0.28, 1);
}

.pvp-battle-hud :deep(.combatant-panel__content) {
  transition:
    flex-basis 620ms cubic-bezier(0.22, 0.76, 0.28, 1),
    padding-inline 620ms cubic-bezier(0.22, 0.76, 0.28, 1);
}

.pvp-battle-hud--round-battle :deep(.combatant-panel__portrait-zone) {
  width: 0;
  max-width: 0;
  min-width: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

.pvp-battle-hud--round-battle :deep(.combatant-panel__content) {
  width: 100%;
  flex: 1 1 100%;
  padding-inline: 0;
}

.pvp-battle-hud--round-battle :deep(.combatant-stats) {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.pvp-battle-hud__center {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  width: min(100%, 25rem);
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(0.55rem, 1.5vh, 1.2rem);
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.pvp-battle-hud__ability-controls {
  display: grid;
  width: min(100%, 25rem);
  gap: 0.45rem;
  padding: 0.55rem;
  border: 0.08rem solid rgb(207 115 255 / 65%);
  border-radius: 0.7rem;
  background: rgb(18 8 29 / 88%);
  box-shadow: 0 0 1rem rgb(190 71 255 / 22%);
  pointer-events: auto;
}

.pvp-battle-hud__ability-hint,
.pvp-battle-hud__ability-error {
  color: #f1dcff;
  font-size: 0.7rem;
  text-align: center;
}

.pvp-battle-hud__ability-error {
  color: #ffaaa8;
}

.pvp-battle-hud__ability-actions {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
}

.pvp-battle-hud__action,
.pvp-battle-hud__next {
  padding: 0.45rem 0.8rem;
  border: 0.08rem solid rgb(236 214 255 / 70%);
  border-radius: 999px;
  color: #fff;
  background: rgb(45 24 63 / 90%);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 800;
}

.pvp-battle-hud__action--confirm,
.pvp-battle-hud__next {
  border-color: #ffd12d;
  background: rgb(108 68 15 / 92%);
  box-shadow: 0 0 0.8rem rgb(255 190 32 / 36%);
}

.pvp-battle-hud__action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pvp-battle-hud__next {
  align-self: center;
  padding-inline: 1.2rem;
  font-size: 0.85rem;
  pointer-events: auto;
}
</style>
