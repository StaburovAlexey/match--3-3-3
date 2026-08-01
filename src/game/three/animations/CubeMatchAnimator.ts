import { gsap } from 'gsap'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { MatchGroup, MatchesEventPayload } from '../../logic/events/GameEvents.ts'
import { CubeArrowIdleAnimator } from './CubeArrowIdleAnimator.ts'
import { CubeArrowMatchAnimator } from './CubeArrowMatchAnimator.ts'
import { CubeBombIdleAnimator } from './CubeBombIdleAnimator.ts'
import { CubeShakeAnimator } from './CubeShakeAnimator.ts'
import GroupCubes from '../objects/groupCubes.ts'

export class CubeMatchAnimator {
  private readonly unsubscribe: () => void
  private timeline: gsap.core.Timeline | null = null
  private readonly arrowIdleAnimator: CubeArrowIdleAnimator
  private readonly arrowMatchAnimator: CubeArrowMatchAnimator
  private readonly bombIdleAnimator: CubeBombIdleAnimator
  private readonly cubesGroup: GroupCubes
  private readonly growScale = 1.12
  private readonly growDuration = 0.07
  private readonly shrinkDuration = 0.14
  private readonly staggerDuration = 0.11

  constructor(shakeAnimator: CubeShakeAnimator, cubesGroup: GroupCubes) {
    this.arrowIdleAnimator = new CubeArrowIdleAnimator()
    this.arrowMatchAnimator = new CubeArrowMatchAnimator(shakeAnimator)
    this.bombIdleAnimator = new CubeBombIdleAnimator()
    this.cubesGroup = cubesGroup
    this.unsubscribe = gameEvents.on('matches-found', this.handleMatchesFound)
  }

  private handleMatchesFound = ({ matches }: MatchesEventPayload): void => {
    this.timeline?.kill()
    this.arrowMatchAnimator.destroy()
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
        this.arrowMatchAnimator.destroy()
        this.timeline = null
        gameEvents.emit('field-ready-changed', true)
      },
    })

    matches.forEach((group) => {
      const activatedArrows = group.cubes.filter((cube) => cube.getSpecialType === 'arrow')
      const activatedBombs = group.cubes.filter((cube) => cube.getSpecialType === 'bomb')
      const hasActivatedSpecial = activatedArrows.length > 0 || activatedBombs.length > 0
      activatedArrows.forEach((cube) => this.arrowIdleAnimator.stop(cube))
      activatedBombs.forEach((cube) => this.bombIdleAnimator.stop(cube))
      const groupTimeline = hasActivatedSpecial
        ? this.arrowMatchAnimator.createTimeline(group.cubes)
        : this.createGroupTimeline(group)
      this.timeline?.add(groupTimeline, 0)
    })
  }

  private createGroupTimeline(group: MatchGroup): gsap.core.Timeline {
    const timeline = gsap.timeline()

    group.cubes.forEach((cube, index) => {
      if (group.specialCube === cube && group.specialType) {
        cube.visible = true
        cube.setSpecialType(
          group.specialType,
          group.specialOrientation ?? null,
          this.cubesGroup.getSpecialMaterial(cube.elementType, group.specialType),
        )
        timeline
          .to(
            cube.scale,
            {
              x: 1.2,
              y: 1.2,
              z: 1.2,
              duration: this.growDuration,
              ease: 'back.out(1.7)',
            },
            0,
          )
          .to(
            cube.scale,
            {
              x: 1,
              y: 1,
              z: 1,
              duration: this.shrinkDuration,
              ease: 'power2.out',
              onComplete: () => {
                if (group.specialType === 'arrow' && group.specialOrientation) {
                  this.arrowIdleAnimator.start(cube, group.specialOrientation)
                } else if (group.specialType === 'bomb') {
                  this.bombIdleAnimator.start(cube)
                }
              },
            },
            this.growDuration,
          )
        return
      }

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
              cube.setSpecialType(null)
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
    this.arrowIdleAnimator.destroy()
    this.arrowMatchAnimator.destroy()
    this.bombIdleAnimator.destroy()
    this.timeline = null
  }
}
