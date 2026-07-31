import { gsap } from 'gsap'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { MatchGroup, MatchesEventPayload } from '../../logic/events/GameEvents.ts'

export class CubeMatchAnimator {
  private readonly unsubscribe: () => void
  private timeline: gsap.core.Timeline | null = null
  private readonly growScale = 1.12
  private readonly growDuration = 0.07
  private readonly shrinkDuration = 0.14
  private readonly staggerDuration = 0.11

  constructor() {
    this.unsubscribe = gameEvents.on('matches-found', this.handleMatchesFound)
  }

  private handleMatchesFound = ({ matches }: MatchesEventPayload): void => {
    this.timeline?.kill()
    this.timeline = null

    if (matches.length === 0) {
      gameEvents.emit('field-ready-changed', true)
      return
    }

    gameEvents.emit('field-ready-changed', false)

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.timeline = null
        gameEvents.emit('matches-cleared', undefined)
      },
      onInterrupt: () => {
        this.timeline = null
        gameEvents.emit('field-ready-changed', true)
      },
    })

    matches.forEach((group) => {
      const groupTimeline = this.createGroupTimeline(group)
      this.timeline?.add(groupTimeline, 0)
    })
  }

  private createGroupTimeline(group: MatchGroup): gsap.core.Timeline {
    const timeline = gsap.timeline()

    group.cubes.forEach((cube, index) => {
      const start = index * this.staggerDuration

      timeline
        .to(
          cube.scale,
          {
            x: this.growScale,
            y: this.growScale,
            z: this.growScale,
            duration: this.growDuration,
            ease: 'back.out(1.7)',
          },
          start,
        )
        .to(
          cube.scale,
          {
            x: 0,
            y: 0,
            z: 0,
            duration: this.shrinkDuration,
            ease: 'power2.in',
            onComplete: () => {
              cube.visible = false
            },
          },
          start + this.growDuration,
        )
    })

    return timeline
  }

  destroy(): void {
    this.unsubscribe()
    this.timeline?.kill()
    this.timeline = null
  }
}
