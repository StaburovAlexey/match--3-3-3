import { gsap } from 'gsap'
import type { Cube } from '../board/Cube.ts'

export class CubeShakeAnimator {
  private readonly amplitude = 0.15
  private readonly onceRepeat = 5
  private readonly timelines = new Map<Cube, gsap.core.Timeline>()

  startLoop(cube: Cube, duration: number): void {
    this.start(cube, duration, -1)
  }

  startOnce(cube: Cube, duration: number): void {
    this.start(cube, duration, this.onceRepeat)
  }

  stop(cube: Cube, resetDuration = 0.12): void {
    this.timelines.get(cube)?.kill()
    this.timelines.delete(cube)
    gsap.killTweensOf(cube.rotation)
    gsap.to(cube.rotation, {
      x: 0,
      y: 0,
      z: 0,
      duration: resetDuration,
      ease: 'power2.out',
    })
  }

  destroy(): void {
    Array.from(this.timelines.keys()).forEach((cube) => {
      this.stop(cube, 0)
      cube.rotation.set(0, 0, 0)
    })
  }

  private start(cube: Cube, duration: number, repeat: number): void {
    this.stop(cube, 0)
    const timeline = gsap.timeline({
      repeat,
      repeatRefresh: true,
      onComplete: () => this.timelines.delete(cube),
      onInterrupt: () => this.timelines.delete(cube),
    })
    timeline
      .to(cube.rotation, {
        x: () => gsap.utils.random(-this.amplitude, this.amplitude),
        z: () => gsap.utils.random(-this.amplitude, this.amplitude),
        duration,
        ease: 'sine.inOut',
      })
      .to(cube.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: duration * 0.85,
        ease: 'power1.out',
      })
    this.timelines.set(cube, timeline)
  }
}
