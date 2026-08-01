import { gsap } from 'gsap'
import * as THREE from 'three'
import type { AnimationResult } from '../../../core/flow/GamePresentation.ts'
import type { Cube } from '../board/Cube.ts'
import { CubeShakeAnimator } from './CubeShakeAnimator.ts'
import { TimelineScope } from './TimelineScope.ts'

export class CubeSwapAnimator {
  private readonly scope = new TimelineScope()
  private readonly shake: CubeShakeAnimator

  constructor(shake: CubeShakeAnimator) {
    this.shake = shake
  }

  playRejected(first: Cube, second: Cube): Promise<AnimationResult> {
    const firstStart = first.position.clone()
    const secondStart = second.position.clone()
    const centerDistance = firstStart.distanceTo(secondStart)
    const contactDistance = first.cubeGeometry.axis
    const impactProgress =
      centerDistance > 0
        ? THREE.MathUtils.clamp((centerDistance - contactDistance) / centerDistance, 0, 1)
        : 0
    const firstImpact = firstStart.clone().lerp(secondStart, impactProgress)
    gsap.killTweensOf(first.position)
    this.shake.startOnce(first, 0.07)
    this.shake.startOnce(second, 0.03)
    const timeline = gsap.timeline({ paused: true })
    timeline
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
    return this.scope.play(timeline)
  }

  play(first: Cube, second: Cube): Promise<AnimationResult> {
    const firstTarget = second.position.clone()
    const secondTarget = first.position.clone()
    gsap.killTweensOf([first.position, second.position])
    this.shake.startOnce(second, 0.07)
    const timeline = gsap.timeline({ paused: true })
    timeline
      .call(() => this.shake.stop(second), [], 0.22)
      .call(
        () => {
          this.shake.stop(first, 0)
          this.shake.stop(second, 0)
        },
        [],
        0.35,
      )
      .to(
        first.position,
        {
          x: firstTarget.x,
          y: firstTarget.y,
          z: firstTarget.z,
          duration: 0.28,
          ease: 'power2.inOut',
        },
        0.35,
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
        0.35,
      )
    return this.scope.play(timeline)
  }

  destroy(): void {
    this.scope.dispose()
  }
}
