import { gsap } from 'gsap'
import * as THREE from 'three'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { SwapEventPayload } from '../../logic/events/GameEvents.ts'
import type CubesGrid from '../../logic/core/cubesGrid.ts'
import { CubeShakeAnimator } from './CubeShakeAnimator.ts'

export class CubeSwapAnimator {
  private readonly unsubscribe: () => void
  private readonly unsubscribeRejected: () => void
  private readonly grid: CubesGrid
  private readonly shakeAnimator: CubeShakeAnimator
  private readonly swapDelay = 0.35
  private timeline: gsap.core.Timeline | null = null

  constructor(grid: CubesGrid, shakeAnimator: CubeShakeAnimator) {
    this.grid = grid
    this.shakeAnimator = shakeAnimator
    this.unsubscribe = gameEvents.on('swap-requested', this.handleSwapRequested)
    this.unsubscribeRejected = gameEvents.on('swap-rejected', this.handleSwapRejected)
  }

  private handleSwapRejected = ({ first, second }: SwapEventPayload): void => {
    if (this.timeline) {
      return
    }

    const firstStart = first.position.clone()
    const secondStart = second.position.clone()
    const centerDistance = firstStart.distanceTo(secondStart)
    const contactDistance = first.cubeGeometry.axis
    const impactProgress =
      centerDistance > 0
        ? THREE.MathUtils.clamp((centerDistance - contactDistance) / centerDistance, 0, 1)
        : 0
    const firstImpact = firstStart.clone().lerp(secondStart, impactProgress)

    gameEvents.emit('field-ready-changed', false)

    gsap.killTweensOf(first.position)
    this.shakeAnimator.startOnce(first, 0.07)
    this.shakeAnimator.startOnce(second, 0.03)

    this.timeline = gsap
      .timeline({
        onComplete: () => {
          this.timeline = null
          gameEvents.emit('field-ready-changed', true)
          gameEvents.emit('cube-selected', { cube: first })
        },
        onInterrupt: () => {
          this.timeline = null
          gameEvents.emit('field-ready-changed', true)
        },
      })
      .to(
        first.position,
        {
          x: firstImpact.x,
          y: firstImpact.y,
          z: firstImpact.z,
          duration: 0.06,
          ease: 'power2.in',
        },
        0,
      )
      .to(
        first.position,
        {
          x: firstStart.x,
          y: firstStart.y,
          z: firstStart.z,
          duration: 0.3,
          ease: 'power2.out',
        },
        0.06,
      )
      .to(
        second.position,
        {
          x: secondStart.x,
          y: secondStart.y,
          z: secondStart.z,
          duration: 0.3,
          ease: 'power2.out',
        },
        0.06,
      )
  }

  private handleSwapRequested = ({ first, second }: SwapEventPayload): void => {
    if (this.timeline) {
      return
    }

    const firstTarget = second.position.clone()
    const secondTarget = first.position.clone()

    gameEvents.emit('field-ready-changed', false)

    gsap.killTweensOf([first.position, second.position])
    this.shakeAnimator.startOnce(second, 0.07)

    this.timeline = gsap
      .timeline({
        onComplete: () => {
          this.grid.swap(first, second)
          this.timeline = null
          gameEvents.emit('field-ready-changed', true)
        },
        onInterrupt: () => {
          this.timeline = null
          gameEvents.emit('field-ready-changed', true)
        },
      })
      .add(() => {
        this.shakeAnimator.stop(second)
      }, 0.22)
      .add(() => {
        gameEvents.emit('cube-deselected', { cube: first })
        this.shakeAnimator.stop(first, 0)
        this.shakeAnimator.stop(second, 0)
      }, this.swapDelay)
      .to(
        first.position,
        {
          x: firstTarget.x,
          y: firstTarget.y,
          z: firstTarget.z,
          duration: 0.28,
          ease: 'power2.inOut',
        },
        this.swapDelay,
      )
      .to(
        second.position,
        {
          x: secondTarget.x,
          y: secondTarget.y,
          z: secondTarget.z,
          duration: 0.28,
          ease: 'power2.inOut',
        },
        this.swapDelay,
      )
  }

  destroy(): void {
    this.unsubscribe()
    this.unsubscribeRejected()
    this.timeline?.kill()
    this.timeline = null
  }
}
