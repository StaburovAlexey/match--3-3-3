import { gsap } from 'gsap'
import * as THREE from 'three'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { SwapEventPayload } from '../../logic/events/GameEvents.ts'
import type CubesGrid from '../../logic/core/cubesGrid.ts'

export class CubeSwapAnimator {
  private readonly unsubscribe: () => void
  private readonly unsubscribeRejected: () => void
  private readonly grid: CubesGrid
  private readonly swapDelay = 1
  private timeline: gsap.core.Timeline | null = null

  constructor(grid: CubesGrid) {
    this.grid = grid
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

    gsap.killTweensOf([first.position, first.rotation])
    first.rotation.set(0, 0, 0)

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
        first.rotation,
        {
          x: () => gsap.utils.random(-0.06, 0.06),
          z: () => gsap.utils.random(-0.06, 0.06),
          duration: 0.07,
          repeat: 3,
          repeatRefresh: true,
          yoyo: true,
          ease: 'sine.inOut',
        },
        0,
      )
      .to(
        first.position,
        {
          x: firstImpact.x,
          y: firstImpact.y,
          z: firstImpact.z,
          duration: 0.06,
          ease: 'power2.in',
        },
        0.3,
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
        0.36,
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
        0.36,
      )
  }

  private handleSwapRequested = ({ first, second }: SwapEventPayload): void => {
    if (this.timeline) {
      return
    }

    const firstTarget = second.position.clone()
    const secondTarget = first.position.clone()

    gameEvents.emit('field-ready-changed', false)

    gsap.killTweensOf([first.position, second.position, second.rotation])

    second.rotation.set(0, 0, 0)

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
      .to(
        second.rotation,
        {
          x: () => gsap.utils.random(-0.06, 0.06),
          z: () => gsap.utils.random(-0.06, 0.06),
          duration: 0.07,
          yoyo: true,
          repeat: 9,
          repeatRefresh: true,
          ease: 'sine.inOut',
        },
        0,
      )
      .to(
        second.rotation,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.12,
          ease: 'power1.out',
        },
        0.82,
      )
      .add(() => {
        gameEvents.emit('cube-deselected', { cube: first })
        gsap.killTweensOf([first.rotation, second.rotation])
        first.rotation.set(0, 0, 0)
        second.rotation.set(0, 0, 0)
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
