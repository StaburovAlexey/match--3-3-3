import { effectScope } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePvPDevEventSequence } from './usePvPDevEventSequence.ts'

describe('usePvPDevEventSequence', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits the cascade from x2 through x5 and leaves x5 active', () => {
    vi.useFakeTimers()
    const onCombo = vi.fn()
    const scope = effectScope()
    const sequence = scope.run(() => usePvPDevEventSequence({ onCombo, intervalMs: 100 }))!

    sequence.runComboSequence()
    expect(onCombo.mock.calls.map(([multiplier]) => multiplier)).toEqual([2])
    expect(sequence.isRunning.value).toBe(true)

    vi.advanceTimersByTime(300)
    expect(onCombo.mock.calls.map(([multiplier]) => multiplier)).toEqual([2, 3, 4, 5])
    expect(sequence.isRunning.value).toBe(false)
    scope.stop()
  })

  it('cancels stale timers when restarted or disposed', () => {
    vi.useFakeTimers()
    const onCombo = vi.fn()
    const scope = effectScope()
    const sequence = scope.run(() => usePvPDevEventSequence({ onCombo, intervalMs: 100 }))!

    sequence.runComboSequence()
    vi.advanceTimersByTime(100)
    sequence.runComboSequence()
    vi.advanceTimersByTime(300)
    expect(onCombo.mock.calls.map(([multiplier]) => multiplier)).toEqual([2, 3, 2, 3, 4, 5])

    sequence.runComboSequence()
    scope.stop()
    vi.runAllTimers()
    expect(onCombo.mock.calls.at(-1)?.[0]).toBe(2)
  })
})
