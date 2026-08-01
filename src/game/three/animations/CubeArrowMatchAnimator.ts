import { gsap } from 'gsap'
import type { Cube } from '../objects/Cube.ts'
import { CubeShakeAnimator } from './CubeShakeAnimator.ts'

export class CubeArrowMatchAnimator {
  private readonly shakeAnimator: CubeShakeAnimator
  private readonly activeCubes = new Set<Cube>()
  private readonly shakeDuration = 0.05
  private readonly growScale = 1.2
  private readonly growDuration = 1.25
  private readonly shrinkDuration = 0.18

  constructor(shakeAnimator: CubeShakeAnimator) {
    this.shakeAnimator = shakeAnimator
  }

  createTimeline(cubes: Cube[]): gsap.core.Timeline {
    cubes.forEach((cube) => this.activeCubes.add(cube))

    const timeline = gsap.timeline({
      onComplete: () => this.finish(cubes),
      onInterrupt: () => this.finish(cubes),
    })

    timeline.call(
      () => {
        cubes.forEach((cube) => this.shakeAnimator.startLoop(cube, this.shakeDuration))
      },
      [],
      0,
    )

    timeline.to(
      cubes.map((cube) => cube.scale),
      {
        x: this.growScale,
        y: this.growScale,
        z: this.growScale,
        duration: this.growDuration,
        ease: 'sine.inOut',
      },
      0,
    )
    timeline.call(
      () => {
        cubes.forEach((cube) => this.shakeAnimator.stop(cube, 0))
      },
      [],
      this.growDuration,
    )
    timeline.to(
      cubes.map((cube) => cube.scale),
      {
        x: 0,
        y: 0,
        z: 0,
        duration: this.shrinkDuration,
        ease: 'power2.in',
      },
      this.growDuration,
    )

    return timeline
  }

  destroy(): void {
    this.activeCubes.forEach((cube) => this.cleanupCube(cube))
    this.activeCubes.clear()
  }

  private finish(cubes: Cube[]): void {
    cubes.forEach((cube) => {
      this.cleanupCube(cube)
      this.activeCubes.delete(cube)
    })
  }

  private cleanupCube(cube: Cube): void {
    this.shakeAnimator.stop(cube)
    cube.setSpecialType(null)
    cube.visible = false
  }
}
