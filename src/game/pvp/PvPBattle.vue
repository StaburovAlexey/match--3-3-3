<script setup lang="ts">
import { computed, defineAsyncComponent, shallowRef, useTemplateRef } from 'vue'
import type { AbilityInteractionState } from '../core/ability/AbilityContract.ts'
import type { GameRuntimeErrorEvent } from '../runtime/ThreeGameRuntime.ts'
import type {
  HudShakeReason,
  ResolvePlayerRewardTarget,
  RewardHit,
} from '../core/model/RewardTarget.ts'
import type { CombatantDefinition, PvPBattleConfig } from './core/PvPBattleTypes.ts'
import type { PvPDevCommandResult, PvPDevRoundPatch } from './core/PvPBattleDevTypes.ts'
import type { PvPDevComboMultiplier } from './components/dev/usePvPDevEventSequence.ts'
import { usePvPBattle } from './composables/usePvPBattle.ts'
import PvPBattleHud from './components/PvPBattleHud.vue'
import PvPBoardScene from './components/PvPBoardScene.vue'
import { createIdleRoundClashPresentation } from './components/round-clash/RoundClashPresentation.ts'
import RoundClashSequence from './components/round-clash/RoundClashSequence.vue'
import type { RoundClashPresentationState } from './components/round-clash/RoundClashTypes.ts'
import ScreenCrackOverlay from './components/ScreenCrackOverlay.vue'
import { createOpponentRoundPlans } from './data/OpponentRoundPlans.ts'

const props = defineProps<{
  player: CombatantDefinition
  playerRating: number
  opponent: CombatantDefinition
  opponentRating: number
}>()

const emit = defineEmits<{
  exit: []
}>()

const PvPDevTools = import.meta.env.DEV
  ? defineAsyncComponent(() => import('./components/dev/PvPDevTools.vue'))
  : null

const battleConfig: PvPBattleConfig = {
  maxRounds: 3,
  maxTurnsPerRound: 7,
  devToolsEnabled: import.meta.env.DEV,
  player: props.player,
  playerRating: props.playerRating,
  opponent: props.opponent,
  opponentRating: props.opponentRating,
  opponentRounds: createOpponentRoundPlans(props.opponent.elementType),
}

const battle = usePvPBattle(battleConfig)
const abilityState = shallowRef<AbilityInteractionState>({
  phase: 'idle',
  request: null,
  previewBusy: false,
  canConfirm: false,
  error: null,
})
const roundBattle = shallowRef<RoundClashPresentationState>(createIdleRoundClashPresentation())
const devFeedback = shallowRef<PvPDevCommandResult | null>(null)
const board = useTemplateRef<{
  confirmAbility: () => Promise<void>
  cancelAbility: () => void
  isBoardIdle: () => boolean
}>('board')
const hud = useTemplateRef<{ resolvePlayerRewardTarget: ResolvePlayerRewardTarget }>('hud')
const devMutationEnabled = computed(
  () => battle.state.value.phase === 'player-turn' && abilityState.value.phase === 'idle',
)
const devCanContinue = computed(
  () => battle.state.value.phase === 'round-result' && roundBattle.value.phase === 'complete',
)

function handleAbilitySelect(abilityId: string): void {
  battle.selectAbility(abilityId)
}

function handleAbilityState(nextState: AbilityInteractionState): void {
  abilityState.value = nextState
}

function handleAbilityFinished(result: Parameters<typeof battle.handleAbilityFinished>[0]): void {
  battle.handleAbilityFinished(result)
}

function handleTurnResolved(event: Parameters<typeof battle.handleTurnResolved>[0]): void {
  battle.handleTurnResolved(event)
}

function handleRewardBatchStarted(hitCount: number): void {
  battle.handleRewardBatchStarted(hitCount)
}

function handleRewardHit(event: RewardHit): void {
  battle.handleRewardHit(event)
}

function handleMatchMultiplierChanged(multiplier: number): void {
  battle.handleMatchMultiplierChanged(multiplier)
}

function handleHudShake(reason: HudShakeReason): void {
  battle.handleHudShake(reason)
}

function handleDevCombo(multiplier: PvPDevComboMultiplier): void {
  battle.handleMatchMultiplierChanged(multiplier)
  battle.handleHudShake('match')
  devFeedback.value = { accepted: true, message: `Запущен визуальный каскад ×${multiplier}` }
}

function handleDevBomb(): void {
  battle.handleHudShake('bomb')
  devFeedback.value = {
    accepted: true,
    message: `Bomb запущен с силой ×${Math.max(1, battle.matchMultiplier.value)}`,
  }
}

function resetDevEffects(): void {
  battle.handleMatchMultiplierChanged(0)
  devFeedback.value = { accepted: true, message: 'Множитель эффектов сброшен' }
}

function canRunDevMutation(): boolean {
  if (!board.value?.isBoardIdle()) {
    devFeedback.value = { accepted: false, message: 'Дождитесь остановки поля' }
    return false
  }
  return true
}

function applyDevRound(patch: PvPDevRoundPatch): void {
  if (!canRunDevMutation()) return
  devFeedback.value = battle.applyDevRoundPatch(patch)
}

function forceDevRound(): void {
  if (!canRunDevMutation()) return
  devFeedback.value = battle.forceResolveCurrentRound()
}

function continueDevRound(): void {
  if (!devCanContinue.value) {
    devFeedback.value = { accepted: false, message: 'Сначала дождитесь завершения боя' }
    return
  }
  battle.continueRound()
  devFeedback.value = { accepted: true, message: 'Следующий раунд запущен' }
}

function handleRoundBattlePresentationChange(presentation: RoundClashPresentationState): void {
  roundBattle.value = presentation
}

function resolvePlayerRewardTarget(...args: Parameters<ResolvePlayerRewardTarget>) {
  return hud.value?.resolvePlayerRewardTarget(...args) ?? null
}

function handleRuntimeError(event: GameRuntimeErrorEvent): void {
  console.error(`[${event.context}]`, event.error)
}

function confirmAbility(): void {
  void board.value?.confirmAbility()
}

function cancelAbility(): void {
  board.value?.cancelAbility()
  battle.cancelAbility()
}

function exitBattle(): void {
  emit('exit')
}
</script>

<template>
  <main class="pvp-battle">
    <PvPBoardScene
      ref="board"
      :ability-request="battle.abilityRequest.value"
      :input-enabled="battle.playerInputEnabled.value"
      :player-element-type="battle.state.value.player.elementType"
      :opponent-element-type="battle.state.value.opponent.elementType"
      :resolve-player-reward-target="resolvePlayerRewardTarget"
      @ability-state="handleAbilityState"
      @ability-finished="handleAbilityFinished"
      @turn-resolved="handleTurnResolved"
      @reward-batch-started="handleRewardBatchStarted"
      @reward-hit="handleRewardHit"
      @match-multiplier-changed="handleMatchMultiplierChanged"
      @hud-shake="handleHudShake"
      @runtime-error="handleRuntimeError"
    />
    <ScreenCrackOverlay
      :pulse-id="battle.hudShakePulseId.value"
      :reason="battle.hudShakeReason.value"
      :multiplier="battle.matchMultiplier.value"
    />
    <RoundClashSequence
      :player="battle.state.value.player"
      :opponent="battle.state.value.opponent"
      :resolution="battle.state.value.lastResolution"
      @presentation-change="handleRoundBattlePresentationChange"
    />
    <PvPBattleHud
      ref="hud"
      :state="battle.state.value"
      :ability-state="abilityState"
      :player-input-enabled="battle.playerInputEnabled.value"
      :display-resources="battle.displayedPlayerResources.value"
      :display-energy="battle.displayedPlayerEnergy.value"
      :reward-pulse="battle.rewardPulse.value"
      :match-multiplier="battle.matchMultiplier.value"
      :match-multiplier-pulse-id="battle.matchMultiplierPulseId.value"
      :hud-shake-pulse-id="battle.hudShakePulseId.value"
      :hud-shake-reason="battle.hudShakeReason.value"
      :round-battle="roundBattle"
      @ability-select="handleAbilitySelect"
      @confirm-ability="confirmAbility"
      @cancel-ability="cancelAbility"
      @continue-round="battle.continueRound"
      @exit="exitBattle"
    />
    <p v-if="battle.status.value" class="pvp-battle__status" aria-live="polite">
      {{ battle.status.value }}
    </p>
    <PvPDevTools
      v-if="PvPDevTools"
      :setup="battle.devRoundSetup.value"
      :phase="battle.state.value.phase"
      :round="battle.state.value.round"
      :max-rounds="battle.state.value.maxRounds"
      :player-max-hp="battle.state.value.player.maxHp"
      :opponent-max-hp="battle.state.value.opponent.maxHp"
      :active-multiplier="battle.matchMultiplier.value"
      :mutation-enabled="devMutationEnabled"
      :can-continue="devCanContinue"
      :feedback="devFeedback"
      @combo="handleDevCombo"
      @bomb="handleDevBomb"
      @reset-effects="resetDevEffects"
      @apply-round="applyDevRound"
      @force-round="forceDevRound"
      @continue-round="continueDevRound"
    />
  </main>
</template>

<style scoped>
.pvp-battle {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 48%, rgb(122 66 18 / 38%), transparent 30%),
    linear-gradient(180deg, #0c0710 0%, #241707 50%, #0c0710 100%);
}

.pvp-battle::before {
  position: absolute;
  z-index: 1;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgb(255 194 61 / 70%) 0 0.08rem, transparent 0.12rem);
  background-position:
    10% 20%,
    80% 45%,
    35% 70%;
  background-size: 7rem 7rem;
  opacity: 0.22;
}

.pvp-battle__status {
  position: absolute;
  z-index: 8;
  bottom: 0.7rem;
  left: 50%;
  margin: 0;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  color: #f4e7ff;
  background: rgb(22 9 32 / 86%);
  font-size: 0.72rem;
  transform: translateX(-50%);
}
</style>
