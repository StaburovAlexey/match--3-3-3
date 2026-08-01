import { gsap } from 'gsap'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { Cube } from '../objects/Cube.ts'

export class CubeBombIdleAnimator {
  private readonly timelines = new Map<Cube, gsap.core.Timeline>()
  private readonly unsubscribeRebuild: () => void
  private readonly firstPulseScale = 1.16
  private readonly secondPulseScale = 1.1

  constructor() {
    this.unsubscribeRebuild = gameEvents.on('board-rebuild-requested', this.stopAll)
  }

  start(cube: Cube): void {
    this.stop(cube)

    const timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.45,
    })

    timeline
      .to(cube.scale, {
        x: this.firstPulseScale,
        y: this.firstPulseScale,
        z: this.firstPulseScale,
        duration: 0.12,
        ease: 'back.out(2)',
      })
      .to(cube.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.16,
        ease: 'power2.inOut',
      })
      .to(cube.scale, {
        x: this.secondPulseScale,
        y: this.secondPulseScale,
        z: this.secondPulseScale,
        duration: 0.1,
        ease: 'power2.out',
      })
      .to(cube.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.18,
        ease: 'power2.inOut',
      })

    this.timelines.set(cube, timeline)
  }

  stop(cube: Cube): void {
    this.timelines.get(cube)?.kill()
    this.timelines.delete(cube)
    cube.scale.set(1, 1, 1)
  }

  destroy(): void {
    this.unsubscribeRebuild()
    this.stopAll()
  }

  private stopAll = (): void => {
    Array.from(this.timelines.keys()).forEach((cube) => this.stop(cube))
  }
}
