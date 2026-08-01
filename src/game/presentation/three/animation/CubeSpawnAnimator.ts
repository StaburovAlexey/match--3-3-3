import { gsap } from 'gsap'
import type { AnimationResult } from '../../../core/flow/GamePresentation.ts'
import type { Cube } from '../board/Cube.ts'
import { TimelineScope } from './TimelineScope.ts'

export class CubeSpawnAnimator {
  private readonly scope = new TimelineScope()

  play(cubes: readonly Cube[]): Promise<AnimationResult> {
    const timeline = gsap.timeline({ paused: true })
    cubes.forEach((cube, index) => {
      const start = index * 0.08
      timeline.to(cube.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.08, ease: 'power2.out' }, start)
      if (index > 0) {
        timeline.to(
          cubes[index - 1].scale,
          { x: 1, y: 1, z: 1, duration: 0.1, ease: 'power2.out' },
          start,
        )
      }
    })
    const last = cubes[cubes.length - 1]
    if (last) {
      timeline.to(
        last.scale,
        { x: 1, y: 1, z: 1, duration: 0.1, ease: 'power2.out' },
        cubes.length * 0.08,
      )
    }
    return this.scope.play(timeline)
  }

  destroy(): void {
    this.scope.dispose()
  }
}
