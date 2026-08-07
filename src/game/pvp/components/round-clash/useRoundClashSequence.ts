import { nextTick, onScopeDispose, readonly, shallowRef, watch, type ShallowRef } from 'vue'
import type { ElementType } from '../../../core/model/Element.ts'
import type { RoundResolutionResult } from '../../core/PvPBattleTypes.ts'
import { createRoundClashGsapTimeline } from './RoundClashGsapTimeline.ts'
import type { RoundClashGsapTimelineHandle } from './RoundClashGsapTimeline.ts'
import { createRoundClashEffectSchedule } from './RoundClashModel.ts'
import {
  createIdleRoundClashPresentation,
  createIntroRoundClashPresentation,
  setRoundClashPresentationHealth,
  setRoundClashPresentationPhase,
} from './RoundClashPresentation.ts'
import type { RoundClashEffectMoment, RoundClashPresentationState } from './RoundClashTypes.ts'

interface UseRoundClashSequenceOptions {
  readonly root: Readonly<ShallowRef<HTMLElement | null>>
  readonly resolution: () => RoundResolutionResult | null
  readonly playerElementType: () => ElementType
  readonly opponentElementType: () => ElementType
  readonly onPresentationChange: (presentation: RoundClashPresentationState) => void
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function useRoundClashSequence(options: UseRoundClashSequenceOptions) {
  const isActive = shallowRef(false)
  const renderKey = shallowRef(0)
  const effects = shallowRef<readonly RoundClashEffectMoment[]>([])
  let presentation = createIdleRoundClashPresentation()
  let activeTimeline: RoundClashGsapTimelineHandle | null = null
  let activeRun = 0

  function publish(nextPresentation: RoundClashPresentationState): void {
    presentation = nextPresentation
    options.onPresentationChange(nextPresentation)
  }

  function stopTimeline(): void {
    activeTimeline?.kill()
    activeTimeline = null
  }

  function resetPresentation(notify = true): void {
    isActive.value = false
    effects.value = []
    const idlePresentation = createIdleRoundClashPresentation()
    if (notify) publish(idlePresentation)
    else presentation = idlePresentation
  }

  function startTimeline(resolution: RoundResolutionResult, run: number): void {
    if (run !== activeRun) return
    const root = options.root.value
    if (!root) {
      resetPresentation()
      return
    }

    publish(createIntroRoundClashPresentation(resolution))
    const timeline = createRoundClashGsapTimeline({
      root,
      resolution,
      effects: effects.value,
      reducedMotion: prefersReducedMotion(),
      onStarted: () => {
        if (run !== activeRun) return
        publish(setRoundClashPresentationPhase(presentation, 'battle'))
      },
      onHealthProgress: (health) => {
        if (run !== activeRun) return
        publish(setRoundClashPresentationHealth(presentation, health))
      },
      onFinished: () => {
        if (run !== activeRun) return
        publish(setRoundClashPresentationPhase(presentation, 'complete'))
      },
    })

    if (!timeline) {
      resetPresentation()
      return
    }

    activeTimeline = timeline
    timeline.play()
  }

  watch(
    options.resolution,
    (resolution) => {
      activeRun += 1
      const run = activeRun
      stopTimeline()

      if (!resolution) {
        resetPresentation(isActive.value || presentation.phase !== 'idle')
        return
      }

      renderKey.value += 1
      effects.value = createRoundClashEffectSchedule(
        options.playerElementType(),
        options.opponentElementType(),
      )
      isActive.value = true
      void nextTick(() => startTimeline(resolution, run))
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    activeRun += 1
    stopTimeline()
  })

  return {
    isActive: readonly(isActive),
    renderKey: readonly(renderKey),
    effects: readonly(effects),
  }
}
