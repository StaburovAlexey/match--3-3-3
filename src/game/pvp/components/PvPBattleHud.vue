<script setup lang="ts">
import { toRef, useTemplateRef } from 'vue'
import type { AbilityInteractionState } from '../../core/ability/AbilityContract.ts'
import type {
  HudShakeReason,
  ResolvePlayerRewardTarget,
  RewardPulse,
  ScreenPoint,
} from '../../core/model/RewardTarget.ts'
import type { PvPBattleState } from '../core/PvPBattleTypes.ts'
import type { RoundResources } from '../core/PvPBattleTypes.ts'
import CombatantPanel from './CombatantPanel.vue'
import MatchComboBanner from './MatchComboBanner.vue'
import { provideHudShake, useHudShake } from '../composables/useHudShake.ts'

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
  <div ref="hudRoot" class="pvp-battle-hud">
    <CombatantPanel :combatant="props.state.opponent" side="opponent" :disabled="true" />

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
        v-if="props.state.phase === 'round-result'"
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
        v-if="props.state.phase === 'finished'"
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
      :display-resources="props.displayResources"
      :display-energy="props.displayEnergy"
      :reward-pulse="props.rewardPulse"
      @ability-select="emit('abilitySelect', $event)"
    />
  </div>
</template>

<style scoped>
.pvp-battle-hud {
  position: relative;
  z-index: 5;
  display: flex;
  width: min(100%, 72rem);
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(0.45rem, 1.6vh, 1.1rem);
  padding: clamp(0.5rem, 1.6vw, 1.1rem);
  pointer-events: none;
}

.pvp-battle-hud > * {
  pointer-events: auto;
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
