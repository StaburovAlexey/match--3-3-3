import { gsap } from 'gsap'
import type { Cube } from '../board/Cube.ts'
import { CubeShakeAnimator } from './CubeShakeAnimator.ts'

export class SpecialClearAnimator {
  private readonly activeCubes = new Set<Cube>()
  private readonly shakeDuration = 0.05
  private readonly growDuration = 1.25
  private readonly shrinkDuration = 0.18
  private readonly shake: CubeShakeAnimator

  constructor(shake: CubeShakeAnimator) {
    this.shake = shake
  }

  get peakTime(): number {
    return this.growDuration
  }

  createTimeline(cubes: readonly Cube[], peakHoldDuration = 0): gsap.core.Timeline {
    cubes.forEach((cube) => this.activeCubes.add(cube))
    const timeline = gsap.timeline()
    timeline.call(() => {
      cubes.forEach((cube) => this.shake.startLoop(cube, this.shakeDuration))
    })
    timeline.to(
      cubes.map((cube) => cube.scale),
      {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: this.growDuration,
        ease: 'sine.inOut',
      },
      0,
    )
    timeline.call(() => cubes.forEach((cube) => this.shake.stop(cube, 0)), [], this.growDuration)
    timeline.to(
      cubes.map((cube) => cube.scale),
      { x: 0, y: 0, z: 0, duration: this.shrinkDuration, ease: 'power2.in' },
      this.growDuration + Math.max(0, peakHoldDuration),
    )
    return timeline
  }

  finish(cubes: readonly Cube[]): void {
    cubes.forEach((cube) => {
      this.shake.stop(cube, 0)
      this.activeCubes.delete(cube)
    })
  }

  destroy(): void {
    this.finish(Array.from(this.activeCubes))
  }
}
