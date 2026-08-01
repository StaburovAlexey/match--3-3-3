import { gsap } from 'gsap'
import type { RefillPlan } from '../../../core/board/BoardRefillPlanner.ts'
import type { AnimationResult } from '../../../core/flow/GamePresentation.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { TimelineScope } from './TimelineScope.ts'

export class CubeRefillAnimator {
  private readonly scope = new TimelineScope()
  private readonly fallDuration = 0.6
  private readonly spawnScaleDelay = 0.2
  private readonly spawnScaleDuration = 0.35
  private readonly board: CubeBoardView

  constructor(board: CubeBoardView) {
    this.board = board
  }

  play(plan: RefillPlan): Promise<AnimationResult> {
    const timeline = gsap.timeline({ paused: true })

    plan.moves.forEach(({ piece, to }) => {
      const cube = this.board.getCube(piece)
      const target = this.board.getLocalPosition(to)
      timeline.to(
        cube.position,
        {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: this.fallDuration,
          ease: 'power2.out',
        },
        0,
      )
    })

    plan.spawns.forEach(({ piece, from, to }) => {
      const cube = this.board.getCube(piece)
      const target = this.board.getLocalPosition(to)
      cube.position.copy(this.board.getLocalPosition(from))
      cube.scale.setScalar(0)
      cube.visible = true
      timeline
        .to(
          cube.position,
          {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: this.fallDuration,
            ease: 'power2.out',
          },
          0,
        )
        .to(
          cube.scale,
          {
            x: 1,
            y: 1,
            z: 1,
            duration: this.spawnScaleDuration,
            ease: 'back.out(1.4)',
          },
          this.spawnScaleDelay,
        )
    })

    return this.scope.play(timeline)
  }

  destroy(): void {
    this.scope.dispose()
  }
}
