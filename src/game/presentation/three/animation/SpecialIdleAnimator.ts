import { gsap } from 'gsap'
import type { ArrowOrientation } from '../../../core/model/Element.ts'
import type { Cube } from '../board/Cube.ts'

interface ScaleValue {
  x: number
  y: number
  z: number
}

export class SpecialIdleAnimator {
  private readonly timelines = new Map<Cube, gsap.core.Timeline>()

  startArrow(cube: Cube, orientation: ArrowOrientation): void {
    this.stop(cube)
    const base = this.arrowScale(orientation, 0.68, 1)
    cube.scale.set(base.x, base.y, base.z)
    const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.55 })
    timeline
      .to(cube.scale, {
        ...this.arrowScale(orientation, 0.71, 1.025),
        duration: 0.09,
        ease: 'power2.out',
      })
      .to(cube.scale, { ...base, duration: 0.12, ease: 'sine.inOut' })
      .to(cube.scale, {
        ...this.arrowScale(orientation, 0.695, 1.015),
        duration: 0.08,
        ease: 'power2.out',
      })
      .to(cube.scale, { ...base, duration: 0.14, ease: 'sine.inOut' })
    this.timelines.set(cube, timeline)
  }

  startBomb(cube: Cube): void {
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

  private arrowScale(
    orientation: ArrowOrientation,
    compressed: number,
    expanded: number,
  ): ScaleValue {
    return orientation === 'vertical'
      ? { x: compressed, y: expanded, z: expanded }
      : { x: expanded, y: compressed, z: expanded }
  }
}
