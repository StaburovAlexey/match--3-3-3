import { gsap } from 'gsap'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { Cube } from '../objects/Cube.ts'

export class CubeSpawnAnimator {
  private readonly timeline = gsap.timeline()
  private readonly firstDuration = 0.08
  private readonly secondDuration = 0.1

  play(cubes: Cube[]): void {
    this.timeline.clear()
    gameEvents.emit('field-ready-changed', false)

    cubes.forEach((cube, index) => {
      const startTime = index * this.firstDuration

      this.timeline.to(
        cube.scale,
        {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: this.firstDuration,
          ease: 'power2.out',
        },
        startTime,
      )

      if (index > 0) {
        this.timeline.to(
          cubes[index - 1].scale,
          {
            x: 1,
            y: 1,
            z: 1,
            duration: this.secondDuration,
            ease: 'power2.out',
          },
          startTime,
        )
      }
    })

    const lastCube = cubes[cubes.length - 1]

    if (lastCube) {
      this.timeline.to(
        lastCube.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: this.secondDuration,
          ease: 'power2.out',
        },
        cubes.length * this.firstDuration,
      )
    }

    this.timeline.eventCallback('onComplete', () => {
      gameEvents.emit('field-ready-changed', true)
    })
  }

  destroy(): void {
    this.timeline.kill()
  }
}
