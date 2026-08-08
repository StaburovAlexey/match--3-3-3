import { onScopeDispose, readonly, shallowRef } from 'vue'

export type PvPDevComboMultiplier = 2 | 3 | 4 | 5

interface UsePvPDevEventSequenceOptions {
  onCombo: (multiplier: PvPDevComboMultiplier) => void
  intervalMs?: number
}

const comboMultipliers: readonly PvPDevComboMultiplier[] = [2, 3, 4, 5]

export function usePvPDevEventSequence(options: UsePvPDevEventSequenceOptions) {
  const isRunning = shallowRef(false)
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const intervalMs = options.intervalMs ?? 700
  let activeRun = 0

  function stop(): void {
    activeRun += 1
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    isRunning.value = false
  }

  function runComboSequence(): void {
    stop()
    const run = activeRun
    isRunning.value = true

    comboMultipliers.forEach((multiplier, index) => {
      if (index === 0) {
        options.onCombo(multiplier)
        return
      }

      const timer = setTimeout(() => {
        timers.delete(timer)
        if (run !== activeRun) return
        options.onCombo(multiplier)
        if (multiplier === 5) isRunning.value = false
      }, intervalMs * index)
      timers.add(timer)
    })
  }

  onScopeDispose(stop)

  return {
    isRunning: readonly(isRunning),
    runComboSequence,
    stop,
  }
}
