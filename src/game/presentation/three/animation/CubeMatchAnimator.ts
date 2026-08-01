import { gsap } from 'gsap'
import type { AnimationResult } from '../../../core/flow/GamePresentation.ts'
import type { BoardPiece, MatchGroup, MatchResolution } from '../../../core/model/Board.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { SpecialClearAnimator } from './SpecialClearAnimator.ts'
import { SpecialIdleAnimator } from './SpecialIdleAnimator.ts'
import { TimelineScope } from './TimelineScope.ts'

export class CubeMatchAnimator {
  private readonly scope = new TimelineScope()
  private readonly idle = new SpecialIdleAnimator()
  private readonly specialClear: SpecialClearAnimator
  private readonly growScale = 1.12
  private readonly growDuration = 0.07
  private readonly shrinkDuration = 0.14
  private readonly staggerDuration = 0.11
  private readonly board: CubeBoardView

  constructor(board: CubeBoardView, specialClear: SpecialClearAnimator) {
    this.board = board
    this.specialClear = specialClear
  }

  play(resolution: MatchResolution): Promise<AnimationResult> {
    const timeline = gsap.timeline({ paused: true })
    const claimed = new Set<BoardPiece>()
    const specialGroupCubes = new Set<ReturnType<CubeBoardView['getCube']>>()
    const specialClearedCubes = new Set(
      resolution.groups
        .flatMap((group) => this.getActivatedSpecials(group))
        .map((piece) => this.board.getCube(piece)),
    )

    specialClearedCubes.forEach((cube) => this.idle.stop(cube))

    resolution.groups.forEach((group) => {
      const groupPieces = group.pieces.filter((piece) => {
        if (claimed.has(piece)) return false
        claimed.add(piece)
        return true
      })
      if (groupPieces.length === 0) return

      const activatedSpecials = this.getActivatedSpecials(group)
      const groupTimeline =
        activatedSpecials.length > 0
          ? this.createSpecialTimeline(groupPieces, specialGroupCubes)
          : this.createSequentialTimeline(group, groupPieces)
      timeline.add(groupTimeline, 0)
    })

    const result = this.scope.play(timeline)
    return result.then((status) => {
      this.specialClear.finish(Array.from(specialGroupCubes))
      if (status === 'completed') {
        resolution.clearedPieces.forEach((piece) => {
          const cube = this.board.getCube(piece)
          cube.visible = false
          cube.scale.setScalar(0)
        })
      }
      return status
    })
  }

  stopIdleAnimations(): void {
    this.idle.stopAll()
  }

  destroy(): void {
    this.scope.dispose()
    this.idle.stopAll()
    this.specialClear.destroy()
  }

  private createSequentialTimeline(
    group: MatchGroup,
    pieces: readonly BoardPiece[],
  ): gsap.core.Timeline {
    const timeline = gsap.timeline()

    pieces.forEach((piece, index) => {
      const cube = this.board.getCube(piece)
      const created = group.createdSpecial?.piece === piece ? group.createdSpecial : null

      if (created) {
        cube.visible = true
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
              onComplete: () => this.startIdle(piece),
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
          },
          start + this.growDuration,
        )
    })

    return timeline
  }

  private createSpecialTimeline(
    pieces: readonly BoardPiece[],
    cubes: Set<ReturnType<CubeBoardView['getCube']>>,
  ): gsap.core.Timeline {
    const groupCubes = pieces.map((piece) => this.board.getCube(piece))
    groupCubes.forEach((cube) => cubes.add(cube))
    return this.specialClear.createTimeline(groupCubes)
  }

  private getActivatedSpecials(group: MatchGroup): BoardPiece[] {
    return group.pieces.filter((piece) => piece.special && piece !== group.createdSpecial?.piece)
  }

  private startIdle(piece: BoardPiece): void {
    if (!piece.special) return
    const cube = this.board.getCube(piece)
    if (piece.special.type === 'arrow') {
      if (piece.special.orientation) {
        this.idle.startArrow(cube, piece.special.orientation)
      }
      return
    }
    this.idle.startBomb(cube)
  }
}
