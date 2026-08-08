<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { usePressFeedback } from '../composables/usePressFeedback.ts'

defineOptions({ inheritAttrs: false })

const buttonElement = useTemplateRef<HTMLButtonElement>('button')
const pressFeedback = usePressFeedback()
let lastTouchAt = 0

function handlePointerDown(event: PointerEvent): void {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  pressFeedback.press()
  const target = event.currentTarget
  if (target instanceof HTMLButtonElement && target.setPointerCapture) {
    try {
      target.setPointerCapture(event.pointerId)
    } catch {
      // The pointer may already have been cancelled by the browser.
    }
  }
}

function handlePointerUp(event: PointerEvent): void {
  pressFeedback.release()
  releasePointerCapture(event)
}

function handlePointerCancel(event: PointerEvent): void {
  pressFeedback.release()
  releasePointerCapture(event)
}

function handleLostPointerCapture(): void {
  pressFeedback.release()
}

function handlePointerLeave(event: PointerEvent): void {
  // A mouse can leave the button without producing a matching pointerup.
  if (event.pointerType === 'mouse' && event.buttons === 0) pressFeedback.release()
}

function handleTouchStart(): void {
  if (supportsPointerEvents()) return
  lastTouchAt = Date.now()
  pressFeedback.press()
}

function handleTouchEnd(): void {
  if (supportsPointerEvents()) return
  lastTouchAt = Date.now()
  pressFeedback.release()
}

function handleMouseDown(event: MouseEvent): void {
  if (supportsPointerEvents() || event.button !== 0 || isSyntheticMouseAfterTouch()) return
  pressFeedback.press()
}

function handleMouseUp(): void {
  if (supportsPointerEvents() || isSyntheticMouseAfterTouch()) return
  pressFeedback.release()
}

function handleMouseLeave(): void {
  if (!supportsPointerEvents() && !isSyntheticMouseAfterTouch()) pressFeedback.release()
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
  pressFeedback.press()
}

function handleKeyUp(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') pressFeedback.release()
}

function handleBlur(): void {
  pressFeedback.release()
}

function releasePointerCapture(event: PointerEvent): void {
  const target = event.currentTarget
  if (target instanceof HTMLButtonElement && target.hasPointerCapture?.(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }
}

function supportsPointerEvents(): boolean {
  return typeof window !== 'undefined' && 'PointerEvent' in window
}

function isSyntheticMouseAfterTouch(): boolean {
  return lastTouchAt > 0 && Date.now() - lastTouchAt < 500
}

defineExpose({ buttonElement })
</script>

<template>
  <button
    ref="button"
    v-bind="$attrs"
    class="ui-button"
    :class="{ 'ui-button--pressed': pressFeedback.isPressed.value }"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerCancel"
    @lostpointercapture="handleLostPointerCapture"
    @pointerleave="handlePointerLeave"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    @blur="handleBlur"
  >
    <slot />
  </button>
</template>
