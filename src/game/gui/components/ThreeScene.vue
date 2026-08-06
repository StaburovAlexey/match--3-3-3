<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import type {
  AbilityActivationRequest,
  AbilityInteractionState,
  AbilityTerminalResult,
} from '../../core/ability/AbilityContract.ts'
import {
  ThreeGameRuntime,
  type GameRuntimeErrorEvent,
} from '../../runtime/ThreeGameRuntime.ts'
import GameControls from './GameControls.vue'

const props = withDefaults(
  defineProps<{
    abilityRequest?: AbilityActivationRequest | null
  }>(),
  { abilityRequest: null },
)

const emit = defineEmits<{
  abilityFinished: [result: AbilityTerminalResult]
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
    reportError: (event) => emit('runtimeError', event),
  })
  runtime.value = game
  unsubscribeAbilityState = game.subscribeAbilityState((state) => {
    abilityState.value = state
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

function startPendingAbility(): void {
  const game = runtime.value
  const request = props.abilityRequest
  if (!game || !request || request.activationId === lastStartedActivationId.value) return

  lastStartedActivationId.value = request.activationId
  const result = game.beginAbility(request)
  if (result.status === 'rejected') emit('abilityFinished', result)
}

function rebuildBoard(): void {
  void runtime.value?.rebuildBoard()
}

function cancelAbility(): void {
  const result = runtime.value?.cancelAbility()
  if (result) emit('abilityFinished', result)
}

async function confirmAbility(): Promise<void> {
  const result = await runtime.value?.confirmAbility()
  if (result && result.status !== 'invalid-selection') emit('abilityFinished', result)
}
</script>

<template>
  <div class="scene-root">
    <div ref="container" class="scene-root__canvas" aria-label="Three.js scene" />
    <GameControls
      :state="abilityState"
      @rebuild="rebuildBoard"
      @cancel-ability="cancelAbility"
      @confirm-ability="confirmAbility"
    />
  </div>
</template>

<style scoped>
.scene-root {
  position: relative;
  width: 100%;
  height: 100%;
}

.scene-root__canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  touch-action: none;
}

.scene-root__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
