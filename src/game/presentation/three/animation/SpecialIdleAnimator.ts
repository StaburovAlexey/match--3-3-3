import { gsap } from 'gsap'
import type { Cube } from '../board/Cube.ts'

export class SpecialIdleAnimator {
  private readonly timelines = new Map<Cube, gsap.core.Timeline>()

  start(cube: Cube): void {
    this.stop(cube)
    const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.45 })
    timeline
      .to(cube.scale, { x: 1.16, y: 1.16, z: 1.16, duration: 0.12, ease: 'back.out(2)' })
      .to(cube.scale, { x: 1, y: 1, z: 1, duration: 0.16, ease: 'power2.inOut' })
      .to(cube.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.1, ease: 'power2.out' })
      .to(cube.scale, { x: 1, y: 1, z: 1, duration: 0.18, ease: 'power2.inOut' })
    this.timelines.set(cube, timeline)
  }

  stop(cube: Cube): void {
    this.timelines.get(cube)?.kill()
    this.timelines.delete(cube)
    cube.scale.set(1, 1, 1)
  }

  stopAll(): void {
    Array.from(this.timelines.keys()).forEach((cube) => this.stop(cube))
  }
}
