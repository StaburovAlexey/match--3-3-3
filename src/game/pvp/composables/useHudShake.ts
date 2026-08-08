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
import { createHudShakeStyle, getHudShakeScale } from '../config/HudEffectsConfig.ts'

interface HudShakeContext {
  pulseId: Ref<number>
  reason: Ref<HudShakeReason>
  multiplier: Ref<number>
}

interface ButtonComponentInstance extends ComponentPublicInstance {
  buttonElement?: HTMLElement | null
}

const hudShakeContextKey: InjectionKey<HudShakeContext> = Symbol('pvp-hud-shake')

export function provideHudShake(
  pulseId: Ref<number>,
  reason: Ref<HudShakeReason>,
  multiplier: Ref<number>,
): void {
  provide(hudShakeContextKey, { pulseId, reason, multiplier })
}

export function useHudShake() {
  const context = inject(hudShakeContextKey, null)
  const targetRef = shallowRef<HTMLElement | null>(null)
  const isShaking = shallowRef(false)
  const style = shallowRef<Record<string, string>>({})
  const setTarget = (element: Element | ComponentPublicInstance | null): void => {
    if (typeof HTMLElement === 'undefined') {
      targetRef.value = null
      return
    }

    if (element instanceof HTMLElement) {
      targetRef.value = element
      return
    }

    const component = element as ButtonComponentInstance | null
    targetRef.value =
      component?.buttonElement instanceof HTMLElement ? component.buttonElement : null
  }

  if (context) {
    watch(context.pulseId, () => {
      const scale = getHudShakeScale(context.reason.value, context.multiplier.value)
      if (scale === null) {
        isShaking.value = false
        return
      }
      style.value = createHudShakeStyle(scale)
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
