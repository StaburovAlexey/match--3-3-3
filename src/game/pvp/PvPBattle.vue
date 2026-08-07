<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'
import type { AbilityInteractionState } from '../core/ability/AbilityContract.ts'
import type { GameRuntimeErrorEvent } from '../runtime/ThreeGameRuntime.ts'
import type {
  HudShakeReason,
  ResolvePlayerRewardTarget,
  RewardHit,
} from '../core/model/RewardTarget.ts'
import type {
  CombatantDefinition,
  PvPBattleConfig,
  RoundResolutionResult,
  RoundResources,
} from './core/PvPBattleTypes.ts'
import { usePvPBattle } from './composables/usePvPBattle.ts'
import PvPBattleHud from './components/PvPBattleHud.vue'
import PvPBoardScene from './components/PvPBoardScene.vue'
import RoundClashSequence from './components/RoundClashSequence.vue'
import type { RoundClashHealthProgress } from './components/RoundClashTimeline.ts'
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

const battleConfig: PvPBattleConfig = {
  maxRounds: 3,
  maxTurnsPerRound: 7,
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
const roundBattleActive = shallowRef(false)
const roundBattleFinished = shallowRef(false)
const roundBattleHp = shallowRef<{ player: number; opponent: number } | null>(null)
const roundBattleResources = shallowRef<{
  player: RoundResources
  opponent: RoundResources
} | null>(null)
const board = useTemplateRef<{ confirmAbility: () => Promise<void>; cancelAbility: () => void }>(
  'board',
)
const hud = useTemplateRef<{ resolvePlayerRewardTarget: ResolvePlayerRewardTarget }>('hud')

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

function prepareRoundBattle(resolution: RoundResolutionResult): void {
  roundBattleFinished.value = false
  roundBattleHp.value = {
    player: resolution.playerSnapshot.currentHp,
    opponent: resolution.opponentSnapshot.currentHp,
  }
  roundBattleResources.value = {
    player: {
      fireDamage: resolution.playerSnapshot.fireDamage,
      iceDamage: resolution.playerSnapshot.iceDamage,
      earthDefense: resolution.playerSnapshot.earthDefense,
      lightDefense: resolution.playerSnapshot.lightDefense,
      abilityEnergy: resolution.playerSnapshot.abilityEnergy,
    },
    opponent: {
      fireDamage: resolution.opponentSnapshot.fireDamage,
      iceDamage: resolution.opponentSnapshot.iceDamage,
      earthDefense: resolution.opponentSnapshot.earthDefense,
      lightDefense: resolution.opponentSnapshot.lightDefense,
      abilityEnergy: resolution.opponentSnapshot.abilityEnergy,
    },
  }
}

function handleRoundBattleStarted(): void {
  roundBattleActive.value = true
}

function handleRoundBattleHealthProgress(health: RoundClashHealthProgress): void {
  if (!roundBattleHp.value) return
  roundBattleHp.value = {
    player: health.player,
    opponent: health.opponent,
  }
}

function handleRoundBattleFinished(): void {
  roundBattleFinished.value = true
}

function handleRoundBattleDismissed(): void {
  roundBattleActive.value = false
  roundBattleFinished.value = false
  roundBattleHp.value = null
  roundBattleResources.value = null
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
      @prepared="prepareRoundBattle"
      @started="handleRoundBattleStarted"
      @health-progress="handleRoundBattleHealthProgress"
      @finished="handleRoundBattleFinished"
      @dismissed="handleRoundBattleDismissed"
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
      :round-battle-active="roundBattleActive"
      :round-battle-finished="roundBattleFinished"
      :round-battle-hp="roundBattleHp"
      :round-battle-resources="roundBattleResources"
      @ability-select="handleAbilitySelect"
      @confirm-ability="confirmAbility"
      @cancel-ability="cancelAbility"
      @continue-round="battle.continueRound"
      @exit="exitBattle"
    />
    <p v-if="battle.status.value" class="pvp-battle__status" aria-live="polite">
      {{ battle.status.value }}
    </p>
  </main>
</template>

<style scoped>
.pvp-battle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(100vw, 32rem);
  height: min(100dvh, 57rem);
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 48%, rgb(122 66 18 / 38%), transparent 30%),
    linear-gradient(180deg, #0c0710 0%, #241707 50%, #0c0710 100%);
  transform: translate(-50%, -50%);
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
