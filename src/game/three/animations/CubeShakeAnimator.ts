import { gsap } from 'gsap'
import type { Cube } from '../objects/Cube.ts'

export class CubeShakeAnimator {
  private readonly amplitude = 0.15
  private readonly onceRepeat = 5
  private readonly timelines = new Set<gsap.core.Timeline>()

  startLoop(cube: Cube, duration: number): void {
    this.stop(cube, 0)

    const timeline = this.createTimeline(cube, duration, -1)
    timeline.play()
  }

  startOnce(cube: Cube, duration: number): void {
    this.stop(cube, 0)

    const timeline = this.createTimeline(cube, duration, this.onceRepeat)
    timeline.play()
  }

  stop(cube: Cube, resetDuration = 0.12): void {
    gsap.killTweensOf(cube.rotation)

    gsap.to(cube.rotation, {
      x: 0,
      y: 0,
      z: 0,
      duration: resetDuration,
      ease: 'power2.out',
    })
  }

  private createTimeline(cube: Cube, duration: number, repeat: number): gsap.core.Timeline {
    const timeline = gsap.timeline({
      repeat,
      repeatRefresh: true,
      onComplete: () => this.timelines.delete(timeline),
      onInterrupt: () => this.timelines.delete(timeline),
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

    this.timelines.add(timeline)
    return timeline
  }

  destroy(): void {
    this.timelines.forEach((timeline) => timeline.kill())
    this.timelines.clear()
  }
}
