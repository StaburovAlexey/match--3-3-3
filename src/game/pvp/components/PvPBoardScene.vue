<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import type {
  AbilityActivationRequest,
  AbilityInteractionState,
  AbilityTerminalResult,
} from '../../core/ability/AbilityContract.ts'
import type { GameTurnResolution } from '../../core/flow/GameController.ts'
import type { ElementType } from '../../core/model/Element.ts'
import type {
  HudShakeReason,
  ResolvePlayerRewardTarget,
  RewardHit,
} from '../../core/model/RewardTarget.ts'
import { ThreeGameRuntime, type GameRuntimeErrorEvent } from '../../runtime/ThreeGameRuntime.ts'

const props = withDefaults(
  defineProps<{
    abilityRequest?: AbilityActivationRequest | null
    inputEnabled?: boolean
    playerElementType: ElementType
    opponentElementType: ElementType
    resolvePlayerRewardTarget?: ResolvePlayerRewardTarget
  }>(),
  { abilityRequest: null, inputEnabled: true },
)

const emit = defineEmits<{
  abilityState: [state: AbilityInteractionState]
  abilityFinished: [result: AbilityTerminalResult]
  turnResolved: [event: GameTurnResolution]
  rewardBatchStarted: [hitCount: number]
  rewardHit: [event: RewardHit]
  matchMultiplierChanged: [multiplier: number]
  hudShake: [reason: HudShakeReason]
  runtimeError: [event: GameRuntimeErrorEvent]
}>()

const idleAbilityState: AbilityInteractionState = {
  phase: 'idle',
  request: null,
  previewBusy: false,
  canConfirm: false,
  error: null,
}

const container = useTemplateRef<HTMLDivElement>('container')
const runtime = shallowRef<ThreeGameRuntime | null>(null)
const abilityState = shallowRef<AbilityInteractionState>(idleAbilityState)
const lastStartedActivationId = shallowRef<string | null>(null)
let unsubscribeAbilityState: (() => void) | null = null

onMounted(() => {
  if (!container.value) return
  const game = new ThreeGameRuntime(container.value, {
    versusBackground: {
      playerElementType: props.playerElementType,
      opponentElementType: props.opponentElementType,
    },
    reportError: (event) => emit('runtimeError', event),
    onTurnResolved: (event) => emit('turnResolved', event),
    resolvePlayerRewardTarget: props.resolvePlayerRewardTarget,
    onRewardBatchStarted: (hitCount) => emit('rewardBatchStarted', hitCount),
    onRewardHit: (event) => emit('rewardHit', event),
    onMatchMultiplierChanged: (multiplier) => emit('matchMultiplierChanged', multiplier),
    onHudShake: (reason) => emit('hudShake', reason),
  })
  runtime.value = game
  game.setInputEnabled(props.inputEnabled)
  unsubscribeAbilityState = game.subscribeAbilityState((state) => {
    abilityState.value = state
    emit('abilityState', state)
  })
  void game.start().catch(() => undefined)
  startPendingAbility()
})

onBeforeUnmount(() => {
  unsubscribeAbilityState?.()
  unsubscribeAbilityState = null
  runtime.value?.dispose()
  runtime.value = null
})

watch(
  () => props.abilityRequest,
  () => startPendingAbility(),
)

watch(
  () => props.inputEnabled,
  (enabled) => runtime.value?.setInputEnabled(enabled),
)

function startPendingAbility(): void {
  const game = runtime.value
  const request = props.abilityRequest
  if (!game || !request || request.activationId === lastStartedActivationId.value) return

  lastStartedActivationId.value = request.activationId
  const result = game.beginAbility(request)
  if (result.status === 'rejected') emit('abilityFinished', result)
}

async function confirmAbility(): Promise<void> {
  const result = await runtime.value?.confirmAbility()
  if (result && result.status !== 'invalid-selection') emit('abilityFinished', result)
}

function cancelAbility(): void {
  const result = runtime.value?.cancelAbility()
  if (result) emit('abilityFinished', result)
}

function isBoardIdle(): boolean {
  return runtime.value?.isBoardIdle ?? false
}

defineExpose({ confirmAbility, cancelAbility, isBoardIdle })
</script>

<template>
  <div class="pvp-board-scene">
    <div ref="container" class="pvp-board-scene__canvas" aria-label="PvP 3D поле" />
  </div>
</template>

<style scoped>
.pvp-board-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #08050d;
}

.pvp-board-scene__canvas {
  width: 100%;
  height: 100%;
  min-height: 320px;
  touch-action: none;
}

.pvp-board-scene__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
