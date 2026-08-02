import { gsap } from 'gsap'
import type { AnimationResult } from '../../../core/flow/GamePresentation.ts'
import type { BoardPiece, MatchGroup, MatchResolution } from '../../../core/model/Board.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { ArrowLightningAnimator } from '../effects/ArrowLightningAnimator.ts'
import { BombExplosionAnimator } from '../effects/BombExplosionAnimator.ts'
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
  private readonly lightning: ArrowLightningAnimator
  private readonly bombExplosion: BombExplosionAnimator

  constructor(
    board: CubeBoardView,
    specialClear: SpecialClearAnimator,
    lightning: ArrowLightningAnimator,
    bombExplosion: BombExplosionAnimator,
  ) {
    this.board = board
    this.specialClear = specialClear
    this.lightning = lightning
    this.bombExplosion = bombExplosion
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
          ? this.createSpecialTimeline(group, groupPieces, specialGroupCubes)
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
    this.lightning.destroy()
    this.bombExplosion.destroy()
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
    group: MatchGroup,
    pieces: readonly BoardPiece[],
    cubes: Set<ReturnType<CubeBoardView['getCube']>>,
  ): gsap.core.Timeline {
    const groupCubes = pieces.map((piece) => this.board.getCube(piece))
    groupCubes.forEach((cube) => cubes.add(cube))
    const timeline = gsap.timeline()
    const arrowEffects = group.effects?.filter((effect) => effect.type === 'arrow') ?? []
    const lightning = this.lightning.createTimeline(arrowEffects)
    const arrowSparkPieces = arrowEffects.flatMap((effect) => effect.pieces)
    const bombEffects = group.effects?.filter((effect) => effect.type === 'bomb') ?? []
    const bombActivationOffset = this.bombExplosion.getLastActivationOffset(bombEffects)
    timeline.add(lightning, 0)
    timeline.add(this.specialClear.createTimeline(groupCubes, bombActivationOffset), 0)
    if (bombEffects.length > 0) {
      timeline.call(
        () => {
          this.bombExplosion.createSequence(bombEffects)
        },
        [],
        this.specialClear.peakTime,
      )
    }
    if (arrowSparkPieces.length > 0) {
      timeline.call(
        () => {
          this.bombExplosion.createClearSparkTimeline(arrowSparkPieces)
        },
        [],
        this.specialClear.peakTime,
      )
    }
    return timeline
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
