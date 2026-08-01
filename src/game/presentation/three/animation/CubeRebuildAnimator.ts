import { gsap } from 'gsap'
import type { AnimationResult } from '../../../core/flow/GamePresentation.ts'
import type { Cube } from '../board/Cube.ts'
import { TimelineScope } from './TimelineScope.ts'

export class CubeRebuildAnimator {
  private readonly scope = new TimelineScope()
  private readonly hideDuration = 0.3
  private readonly showDuration = 0.4

  hide(cubes: readonly Cube[]): Promise<AnimationResult> {
    const timeline = gsap.timeline({ paused: true })
    cubes.forEach((cube) => {
      timeline.to(
        cube.scale,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: this.hideDuration,
          ease: 'power2.in',
          onComplete: () => {
            cube.visible = false
          },
        },
        0,
      )
    })
    return this.scope.play(timeline)
  }

  show(cubes: readonly Cube[]): Promise<AnimationResult> {
    const timeline = gsap.timeline({ paused: true })
    cubes.forEach((cube) => {
      timeline.to(
        cube.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: this.showDuration,
          ease: 'back.out(1.4)',
          onStart: () => {
            cube.visible = true
          },
        },
        0,
      )
    })
    return this.scope.play(timeline)
  }

  destroy(): void {
    this.scope.dispose()
  }
}
