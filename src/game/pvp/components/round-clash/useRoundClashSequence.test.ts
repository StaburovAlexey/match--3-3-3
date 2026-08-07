import { effectScope, nextTick, shallowRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RoundResolutionResult } from '../../core/PvPBattleTypes.ts'
import { createRoundClashGsapTimeline } from './RoundClashGsapTimeline.ts'
import type { RoundClashPresentationState } from './RoundClashTypes.ts'
import { useRoundClashSequence } from './useRoundClashSequence.ts'

vi.mock('./RoundClashGsapTimeline.ts', () => ({
  createRoundClashGsapTimeline: vi.fn(),
}))

function createResolution(currentHp: number): RoundResolutionResult {
  const createSnapshot = (hp: number) => ({
    currentHp: hp,
    maxHp: 100,
    fireDamage: 10,
    iceDamage: 10,
    earthDefense: 10,
    lightDefense: 10,
    abilityEnergy: 20,
    modifiers: [],
    queuedAbilities: [],
  })

  return {
    playerSnapshot: createSnapshot(currentHp),
    opponentSnapshot: createSnapshot(currentHp),
    playerDamageTaken: 10,
    opponentDamageTaken: 10,
    playerHpAfter: currentHp - 10,
    opponentHpAfter: currentHp - 10,
    winner: 'draw',
  }
}

async function flushSequenceStart(): Promise<void> {
  await nextTick()
  await nextTick()
}

describe('useRoundClashSequence', () => {
  const createTimeline = vi.mocked(createRoundClashGsapTimeline)

  beforeEach(() => {
    createTimeline.mockReset()
  })

  it('kills replaced runs and ignores their stale callbacks', async () => {
    const resolution = shallowRef<RoundResolutionResult | null>(null)
    const root = shallowRef({} as HTMLElement)
    const presentations: RoundClashPresentationState[] = []
    const handles = Array.from({ length: 3 }, () => ({ play: vi.fn(), kill: vi.fn() }))
    createTimeline
      .mockReturnValueOnce(handles[0]!)
      .mockReturnValueOnce(handles[1]!)
      .mockReturnValueOnce(handles[2]!)

    const scope = effectScope()
    scope.run(() =>
      useRoundClashSequence({
        root,
        resolution: () => resolution.value,
        playerElementType: () => 'fire',
        opponentElementType: () => 'ice',
        onPresentationChange: (presentation) => presentations.push(presentation),
      }),
    )

    resolution.value = createResolution(100)
    await flushSequenceStart()
    const firstCallbacks = createTimeline.mock.calls[0]?.[0]
    expect(handles[0]?.play).toHaveBeenCalledOnce()

    resolution.value = createResolution(80)
    await flushSequenceStart()
    const secondCallbacks = createTimeline.mock.calls[1]?.[0]
    expect(handles[0]?.kill).toHaveBeenCalledOnce()
    expect(handles[1]?.play).toHaveBeenCalledOnce()

    const presentationCount = presentations.length
    firstCallbacks?.onStarted()
    firstCallbacks?.onHealthProgress({ player: 1, opponent: 1 })
    firstCallbacks?.onFinished()
    expect(presentations).toHaveLength(presentationCount)

    secondCallbacks?.onStarted()
    secondCallbacks?.onHealthProgress({ player: 70, opponent: 65 })
    secondCallbacks?.onFinished()
    expect(presentations.at(-1)).toMatchObject({
      phase: 'complete',
      health: { player: 70, opponent: 65 },
    })

    resolution.value = null
    await nextTick()
    expect(handles[1]?.kill).toHaveBeenCalledOnce()
    expect(presentations.at(-1)).toEqual({ phase: 'idle', health: null, resources: null })

    resolution.value = createResolution(60)
    await flushSequenceStart()
    scope.stop()
    expect(handles[2]?.kill).toHaveBeenCalledOnce()
  })

  it('returns to idle when the scene root cannot be resolved', async () => {
    const resolution = shallowRef<RoundResolutionResult | null>(createResolution(100))
    const root = shallowRef<HTMLElement | null>(null)
    const presentations: RoundClashPresentationState[] = []
    const scope = effectScope()
    let sequence: ReturnType<typeof useRoundClashSequence> | undefined

    scope.run(() => {
      sequence = useRoundClashSequence({
        root,
        resolution: () => resolution.value,
        playerElementType: () => 'fire',
        opponentElementType: () => 'ice',
        onPresentationChange: (presentation) => presentations.push(presentation),
      })
    })
    await flushSequenceStart()

    expect(createTimeline).not.toHaveBeenCalled()
    expect(sequence?.isActive.value).toBe(false)
    expect(sequence?.effects.value).toEqual([])
    expect(presentations.at(-1)).toEqual({ phase: 'idle', health: null, resources: null })
    scope.stop()
  })
})
