import { getCurrentScope, onScopeDispose, shallowRef } from 'vue'

interface UsePressFeedbackOptions {
  minimumDuration?: number
}

export function usePressFeedback(options: UsePressFeedbackOptions = {}) {
  const isPressed = shallowRef(false)
  const minimumDuration = options.minimumDuration ?? 110
  let pressedAt = 0
  let releaseTimer: ReturnType<typeof setTimeout> | null = null

  const now = (): number =>
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()

  const clearReleaseTimer = (): void => {
    if (releaseTimer === null) return
    clearTimeout(releaseTimer)
    releaseTimer = null
  }

  const reset = (): void => {
    clearReleaseTimer()
    isPressed.value = false
  }

  const press = () => {
    clearReleaseTimer()
    pressedAt = now()
    isPressed.value = true
  }

  const release = () => {
    if (!isPressed.value) return

    const remaining = Math.max(0, minimumDuration - (now() - pressedAt))
    if (remaining === 0) {
      reset()
      return
    }

    clearReleaseTimer()
    releaseTimer = setTimeout(reset, remaining)
  }

  if (getCurrentScope()) onScopeDispose(reset)

  return {
    isPressed,
    press,
    release,
    reset,
  }
}
