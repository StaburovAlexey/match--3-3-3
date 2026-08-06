import {
  inject,
  nextTick,
  provide,
  shallowRef,
  watch,
  type ComponentPublicInstance,
  type InjectionKey,
  type Ref,
} from 'vue'
import type { HudShakeReason } from '../../core/model/RewardTarget.ts'

interface HudShakeContext {
  pulseId: Ref<number>
  reason: Ref<HudShakeReason>
  multiplier: Ref<number>
}

const hudShakeContextKey: InjectionKey<HudShakeContext> = Symbol('pvp-hud-shake')

export function provideHudShake(
  pulseId: Ref<number>,
  reason: Ref<HudShakeReason>,
  multiplier: Ref<number>,
): void {
  provide(hudShakeContextKey, { pulseId, reason, multiplier })
}

function randomSigned(min: number, max: number): number {
  const magnitude = min + Math.random() * (max - min)
  return Math.random() < 0.5 ? -magnitude : magnitude
}

export function useHudShake() {
  const context = inject(hudShakeContextKey, null)
  const targetRef = shallowRef<HTMLElement | null>(null)
  const isShaking = shallowRef(false)
  const style = shallowRef<Record<string, string>>({})
  const setTarget = (element: Element | ComponentPublicInstance | null): void => {
    targetRef.value =
      typeof HTMLElement !== 'undefined' && element instanceof HTMLElement ? element : null
  }

  if (context) {
    watch(context.pulseId, () => {
      const isBomb = context.reason.value === 'bomb'
      const multiplier = Math.min(5, Math.max(1, Math.floor(context.multiplier.value)))
      if (!isBomb && multiplier <= 1) {
        isShaking.value = false
        return
      }
      const cascadeProgress = (multiplier - 1) / 4
      const cascadeScale = 0.85 + cascadeProgress * 0.65
      const scale = cascadeScale * (isBomb ? 1.45 : 1)
      style.value = {
        '--pvp-hud-shake-x': `${randomSigned(1.5, 3.5) * scale}px`,
        '--pvp-hud-shake-y': `${randomSigned(1.5, 3.5) * scale}px`,
        '--pvp-hud-shake-angle': `${randomSigned(0.35, 0.9) * scale}deg`,
        '--pvp-hud-shake-duration': `${(220 + Math.random() * 100) * scale}ms`,
        '--pvp-hud-shake-delay': `${Math.random() * 45}ms`,
      }
      isShaking.value = false
      void nextTick(() => {
        const target = targetRef.value
        if (target) void target.offsetWidth
        isShaking.value = true
      })
    })
  }

  return { setTarget, isShaking, style }
}
