import { gsap } from 'gsap'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { ArrowOrientation, Cube } from '../objects/Cube.ts'

export class CubeArrowIdleAnimator {
  private readonly timelines = new Map<Cube, gsap.core.Timeline>()
  private readonly unsubscribeRebuild: () => void
  private readonly compressedScale = 0.68
  private readonly firstPulseScale = 1.025
  private readonly secondPulseScale = 1.015

  constructor() {
    this.unsubscribeRebuild = gameEvents.on('board-rebuild-requested', this.stopAll)
  }

  start(cube: Cube, orientation: ArrowOrientation): void {
    this.stop(cube)

    const baseScale = this.getScale(orientation, this.compressedScale, 1)
    const firstPulse = this.getScale(orientation, this.compressedScale + 0.03, this.firstPulseScale)
    const secondPulse = this.getScale(
      orientation,
      this.compressedScale + 0.015,
      this.secondPulseScale,
    )

    cube.scale.set(baseScale.x, baseScale.y, baseScale.z)

    const timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.55,
    })

    timeline
      .to(cube.scale, { ...firstPulse, duration: 0.09, ease: 'power2.out' })
      .to(cube.scale, { ...baseScale, duration: 0.12, ease: 'sine.inOut' })
      .to(cube.scale, { ...secondPulse, duration: 0.08, ease: 'power2.out' })
      .to(cube.scale, { ...baseScale, duration: 0.14, ease: 'sine.inOut' })

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

  private getScale(
    orientation: ArrowOrientation,
    compressed: number,
    expanded: number,
  ): { x: number; y: number; z: number } {
    return orientation === 'vertical'
      ? { x: compressed, y: expanded, z: expanded }
      : { x: expanded, y: compressed, z: expanded }
  }
}
