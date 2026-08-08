import { effectScope } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePressFeedback } from './usePressFeedback.ts'

describe('usePressFeedback', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a fast tap visible for the minimum feedback duration', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const feedback = scope.run(() => usePressFeedback({ minimumDuration: 110 }))!

    feedback.press()
    feedback.release()

    expect(feedback.isPressed.value).toBe(true)
    vi.advanceTimersByTime(109)
    expect(feedback.isPressed.value).toBe(true)
    vi.advanceTimersByTime(1)
    expect(feedback.isPressed.value).toBe(false)

    scope.stop()
  })

  it('cancels a pending release when another pointer starts', () => {
    vi.useFakeTimers()
    const feedback = usePressFeedback({ minimumDuration: 110 })

    feedback.press()
    feedback.release()
    vi.advanceTimersByTime(40)
    feedback.press()
    vi.advanceTimersByTime(70)

    expect(feedback.isPressed.value).toBe(true)
    feedback.release()
    vi.advanceTimersByTime(110)
    expect(feedback.isPressed.value).toBe(false)
  })
})
