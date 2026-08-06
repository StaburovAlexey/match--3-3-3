import { computed, onBeforeUnmount, readonly, shallowRef } from 'vue'
import type {
  AbilityActivationRequest,
  AbilityTerminalResult,
} from '../../core/ability/AbilityContract.ts'
import type { GameTurnResolution } from '../../core/flow/GameController.ts'
import type { HudShakeReason, RewardHit, RewardPulse } from '../../core/model/RewardTarget.ts'
import { PvPBattleController } from '../core/PvPBattleController.ts'
import {
  cloneRoundResources,
  type AbilityStartResult,
  type PvPBattleConfig,
  type PvPBattleState,
  type RoundResources,
} from '../core/PvPBattleTypes.ts'

export function usePvPBattle(config: PvPBattleConfig) {
  const controller = new PvPBattleController(config)
  const initialState = controller.currentState
  const state = shallowRef<PvPBattleState>(initialState)
  const displayedPlayerResources = shallowRef<RoundResources>(
    cloneRoundResources(initialState.player.resources),
  )
  const displayedPlayerEnergy = shallowRef(initialState.player.energy)
  const rewardPulse = shallowRef<RewardPulse | null>(null)
  const matchMultiplier = shallowRef(0)
  const matchMultiplierPulseId = shallowRef(0)
  const hudShakePulseId = shallowRef(0)
  const hudShakeReason = shallowRef<HudShakeReason>('match')
  const abilityRequest = shallowRef<AbilityActivationRequest | null>(null)
  const status = shallowRef<string | null>(null)
  let abilitySequence = 0
  let rewardPulseId = 0
  let pendingRewardHits = 0
  let playerResourceSyncDeferred = false

  const unsubscribe = controller.subscribe((nextState) => {
    state.value = nextState
    if (pendingRewardHits > 0) {
      playerResourceSyncDeferred = true
      return
    }
    displayedPlayerResources.value = cloneRoundResources(nextState.player.resources)
    displayedPlayerEnergy.value = nextState.player.energy
  })
  controller.start()

  const playerInputEnabled = computed(
    () => state.value.phase === 'player-turn' || abilityRequest.value !== null,
  )

  function selectAbility(abilityId: string): AbilityStartResult {
    const result = controller.beginAbility(abilityId)
    if (!result.accepted || !result.ability) {
      status.value = result.message ?? 'Не удалось активировать способность'
      return result
    }

    abilitySequence += 1
    status.value = null
    if (!result.ability.fieldEffect) {
      controller.finishAbility(abilityId, true)
      return result
    }

    abilityRequest.value = {
      activationId: `pvp:${abilityId}:${abilitySequence}`,
      characterId: state.value.player.id,
      abilityId,
      effect: result.ability.fieldEffect,
    }
    return result
  }

  function handleAbilityFinished(result: AbilityTerminalResult): void {
    if (result.status === 'applied') {
      controller.finishAbility(result.abilityId, true)
      status.value = 'Способность применена.'
    } else {
      controller.finishAbility(result.abilityId, false)
      status.value = result.status === 'cancelled' ? 'Способность отменена' : result.message
    }
    abilityRequest.value = null
  }

  function handleTurnResolved(event: GameTurnResolution): void {
    if (event.type === 'board') {
      controller.recordBoardTurn(event.resolutions, event.rewardMultipliers)
      matchMultiplier.value = 0
    }
  }

  function handleMatchMultiplierChanged(multiplier: number): void {
    matchMultiplier.value = multiplier
    matchMultiplierPulseId.value += 1
  }

  function handleHudShake(reason: HudShakeReason): void {
    hudShakeReason.value = reason
    hudShakePulseId.value += 1
  }

  function handleRewardBatchStarted(hitCount: number): void {
    pendingRewardHits += Math.max(0, hitCount)
  }

  function handleRewardHit(event: RewardHit): void {
    const nextResources = cloneRoundResources(displayedPlayerResources.value)
    nextResources[event.resource] += event.amount
    displayedPlayerResources.value = nextResources
    if (event.resource === 'abilityEnergy') {
      displayedPlayerEnergy.value += event.amount
    }
    pendingRewardHits = Math.max(0, pendingRewardHits - 1)
    rewardPulseId += 1
    rewardPulse.value = { ...event, id: rewardPulseId }
    if (pendingRewardHits === 0 && playerResourceSyncDeferred) {
      displayedPlayerResources.value = cloneRoundResources(state.value.player.resources)
      displayedPlayerEnergy.value = state.value.player.energy
      playerResourceSyncDeferred = false
    }
  }

  function continueRound(): void {
    status.value = null
    controller.continueAfterRound()
  }

  function cancelAbility(): void {
    controller.cancelPendingAbility()
    abilityRequest.value = null
  }

  onBeforeUnmount(() => {
    unsubscribe()
    controller.dispose()
  })

  return {
    state: readonly(state),
    displayedPlayerResources: readonly(displayedPlayerResources),
    displayedPlayerEnergy: readonly(displayedPlayerEnergy),
    rewardPulse: readonly(rewardPulse),
    matchMultiplier: readonly(matchMultiplier),
    matchMultiplierPulseId: readonly(matchMultiplierPulseId),
    hudShakePulseId: readonly(hudShakePulseId),
    hudShakeReason: readonly(hudShakeReason),
    abilityRequest: readonly(abilityRequest),
    status: readonly(status),
    playerInputEnabled,
    selectAbility,
    handleAbilityFinished,
    handleTurnResolved,
    handleMatchMultiplierChanged,
    handleHudShake,
    handleRewardBatchStarted,
    handleRewardHit,
    continueRound,
    cancelAbility,
  }
}
