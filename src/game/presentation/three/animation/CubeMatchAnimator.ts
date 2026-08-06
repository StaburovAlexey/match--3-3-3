import { gsap } from 'gsap'
import type { AnimationResult } from '../../../core/flow/GamePresentation.ts'
import type {
  BoardPiece,
  DestroyedCube,
  MatchEffect,
  MatchGroup,
  MatchResolution,
} from '../../../core/model/Board.ts'
import { getPlayerCubeReward, type PlayerCubeReward } from '../../../core/model/RewardTarget.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { BombExplosionAnimator } from '../effects/BombExplosionAnimator.ts'
import {
  ColorLightningAnimator,
  type LightningEffectTiming,
} from '../effects/ColorLightningAnimator.ts'
import { CubeClearGlowAnimator, type CubeClearGlowEntry } from '../effects/CubeClearGlowAnimator.ts'
import { SparkBurstAnimator } from '../effects/SparkBurstAnimator.ts'
import { SpecialClearAnimator } from './SpecialClearAnimator.ts'
import { SpecialIdleAnimator } from './SpecialIdleAnimator.ts'
import { TimelineScope } from './TimelineScope.ts'

type ScheduledCubeClearGlowEntry = Omit<CubeClearGlowEntry, 'start' | 'reward'> & {
  start: number
  reward: PlayerCubeReward
}

export class CubeMatchAnimator {
  private readonly scope = new TimelineScope()
  private readonly idle = new SpecialIdleAnimator()
  private readonly specialClear: SpecialClearAnimator
  private readonly growScale = 1.12
  private readonly growDuration = 0.07
  private readonly shrinkDuration = 0.14
  private readonly staggerDuration = 0.11
  private readonly board: CubeBoardView
  private readonly lightning: ColorLightningAnimator
  private readonly bombExplosion: BombExplosionAnimator
  private readonly sparks: SparkBurstAnimator
  private readonly clearGlow: CubeClearGlowAnimator

  constructor(
    board: CubeBoardView,
    specialClear: SpecialClearAnimator,
    lightning: ColorLightningAnimator,
    bombExplosion: BombExplosionAnimator,
    sparks: SparkBurstAnimator,
    clearGlow: CubeClearGlowAnimator,
  ) {
    this.board = board
    this.specialClear = specialClear
    this.lightning = lightning
    this.bombExplosion = bombExplosion
    this.sparks = sparks
    this.clearGlow = clearGlow
  }

  play(resolution: MatchResolution, rewardMultiplier = 1): Promise<AnimationResult> {
    const timeline = gsap.timeline({ paused: true })
    const claimedIds = new Set<string>()
    const destroyedByPieceId = new Map(
      resolution.destroyedCubes.map((destroyedCube) => [destroyedCube.piece.id, destroyedCube]),
    )
    const glowStarts = new Map<string, ScheduledCubeClearGlowEntry>()
    const specialGroupCubes = new Set<ReturnType<CubeBoardView['getCube']>>()
    const specialClearedCubes = new Set(
      resolution.groups
        .flatMap((group) => this.getActivatedSpecials(group))
        .map((piece) => this.board.getCube(piece)),
    )

    specialClearedCubes.forEach((cube) => this.idle.stop(cube))

    resolution.groups.forEach((group) => {
      const groupPieces = group.pieces.filter((piece) => {
        if (claimedIds.has(piece.id)) return false
        claimedIds.add(piece.id)
        return true
      })
      if (groupPieces.length === 0) return

      const activatedSpecials = this.getActivatedSpecials(group)
      const groupTimeline =
        activatedSpecials.length > 0
          ? this.createSpecialTimeline(
              group,
              groupPieces,
              specialGroupCubes,
              destroyedByPieceId,
              glowStarts,
              rewardMultiplier,
            )
          : this.createSequentialTimeline(
              group,
              groupPieces,
              destroyedByPieceId,
              glowStarts,
              rewardMultiplier,
            )
      timeline.add(groupTimeline, 0)
    })

    resolution.destroyedCubes.forEach((destroyedCube) => {
      if (!glowStarts.has(destroyedCube.piece.id)) {
        glowStarts.set(destroyedCube.piece.id, {
          piece: destroyedCube.piece,
          start: this.growDuration,
          reward: getPlayerCubeReward(destroyedCube.elementType, rewardMultiplier),
        })
      }
    })
    const glowEntries = Array.from(glowStarts.values())
    timeline.call(() => this.clearGlow.createTimeline(glowEntries), [], 0)

    const result = this.scope.play(timeline)
    return result.then((status) => {
      this.specialClear.finish(Array.from(specialGroupCubes))
      if (status === 'completed') {
        resolution.destroyedCubes.forEach(({ piece }) => {
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
    this.sparks.destroy()
    this.clearGlow.destroy()
  }

  private createSequentialTimeline(
    group: MatchGroup,
    pieces: readonly BoardPiece[],
    destroyedByPieceId: ReadonlyMap<string, DestroyedCube>,
    glowStarts: Map<string, ScheduledCubeClearGlowEntry>,
    rewardMultiplier: number,
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
      const destroyedCube = destroyedByPieceId.get(piece.id)
      if (destroyedCube) {
        this.setGlowStart(glowStarts, destroyedCube, start + this.growDuration, rewardMultiplier)
      }
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
    destroyedByPieceId: ReadonlyMap<string, DestroyedCube>,
    glowStarts: Map<string, ScheduledCubeClearGlowEntry>,
    rewardMultiplier: number,
  ): gsap.core.Timeline {
    const groupCubes = pieces.map((piece) => this.board.getCube(piece))
    groupCubes.forEach((cube) => cubes.add(cube))
    const timeline = gsap.timeline()
    const effects = group.effects ?? []
    const schedule = this.createSpecialSchedule(effects, pieces)
    const bombEffects = effects.filter((effect) => effect.type === 'bomb')
    pieces.forEach((piece) => {
      const destroyedCube = destroyedByPieceId.get(piece.id)
      if (!destroyedCube) return
      this.setGlowStart(
        glowStarts,
        destroyedCube,
        (schedule.clearStarts.get(piece.id) ?? 0) + this.specialClear.peakTime,
        rewardMultiplier,
      )
    })
    timeline.add(this.lightning.createTimeline(schedule.lightning), 0)
    timeline.add(
      this.specialClear.createStaggeredTimeline(
        pieces.map((piece) => ({
          cube: this.board.getCube(piece),
          start: schedule.clearStarts.get(piece.id) ?? 0,
        })),
      ),
      0,
    )
    if (bombEffects.length > 0) {
      timeline.call(
        () => {
          this.bombExplosion.createSequence(bombEffects, schedule.bombExplosions)
        },
        [],
        0,
      )
    }
    const sparksByTime = new Map<number, BoardPiece[]>()
    const bombSourceIds = new Set(bombEffects.map(({ source }) => source.id))
    pieces.forEach((piece) => {
      if (bombSourceIds.has(piece.id)) return
      const time = (schedule.clearStarts.get(piece.id) ?? 0) + this.specialClear.peakTime
      const key = Math.round(time * 1000) / 1000
      const atTime = sparksByTime.get(key) ?? []
      atTime.push(piece)
      sparksByTime.set(key, atTime)
    })
    sparksByTime.forEach((sparkPieces, time) => {
      timeline.call(
        () => {
          this.sparks.createTimeline(sparkPieces.map((piece) => ({ piece })))
        },
        [],
        time,
      )
    })
    return timeline
  }

  private createSpecialSchedule(
    effects: readonly MatchEffect[],
    pieces: readonly BoardPiece[],
  ): {
    lightning: LightningEffectTiming[]
    clearStarts: Map<string, number>
    bombExplosions: Map<string, number>
  } {
    const effectBySourceId = new Map(effects.map((effect) => [effect.source.id, effect]))
    const activationBySourceId = new Map<string, number>()
    const lightningHitByPieceId = new Map<string, number>()
    const clearStarts = new Map<string, number>()
    const bombExplosions = new Map<string, number>()
    const lightning: LightningEffectTiming[] = []
    const effectPieceIds = new Set(effects.flatMap((effect) => effect.pieces.map(({ id }) => id)))

    pieces.forEach((piece) => {
      if (!effectPieceIds.has(piece.id)) clearStarts.set(piece.id, 0)
    })

    effects.forEach((effect) => {
      const parent = effect.triggeredBy ? effectBySourceId.get(effect.triggeredBy.id) : undefined
      let activation = 0

      if (parent?.type === 'lightning') {
        activation = lightningHitByPieceId.get(effect.source.id) ?? 0
      } else if (parent?.type === 'bomb') {
        const parentActivation = activationBySourceId.get(parent.source.id) ?? 0
        activation =
          effect.type === 'bomb'
            ? parentActivation + this.bombExplosion.chainDelay
            : parentActivation + this.specialClear.peakTime
      }

      activationBySourceId.set(effect.source.id, activation)

      const sourceClearStart =
        parent?.type === 'bomb' && effect.type === 'lightning'
          ? (activationBySourceId.get(parent.source.id) ?? 0)
          : activation
      this.setEarliest(clearStarts, effect.source.id, sourceClearStart)

      if (effect.type === 'lightning') {
        const timing = this.lightning.createEffectTiming(effect, activation)
        lightning.push(timing)
        timing.targets.forEach(({ piece, hitAt }) => {
          this.setEarliest(lightningHitByPieceId, piece.id, hitAt)
          this.setEarliest(clearStarts, piece.id, hitAt)
        })
        return
      }

      bombExplosions.set(effect.source.id, activation + this.specialClear.peakTime)
      effect.pieces.forEach((piece) => {
        const child = effectBySourceId.get(piece.id)
        const start =
          child?.triggeredBy === effect.source && child.type === 'bomb'
            ? activation + this.bombExplosion.chainDelay
            : activation
        this.setEarliest(clearStarts, piece.id, start)
      })
    })

    return { lightning, clearStarts, bombExplosions }
  }

  private setEarliest(target: Map<string, number>, id: string, value: number): void {
    const current = target.get(id)
    if (current === undefined || value < current) target.set(id, value)
  }

  private setGlowStart(
    target: Map<string, ScheduledCubeClearGlowEntry>,
    destroyedCube: DestroyedCube,
    start: number,
    rewardMultiplier: number,
  ): void {
    const { piece } = destroyedCube
    const current = target.get(piece.id)
    if (!current || start < current.start) {
      target.set(piece.id, {
        piece,
        start,
        reward: getPlayerCubeReward(destroyedCube.elementType, rewardMultiplier),
      })
    }
  }

  private getActivatedSpecials(group: MatchGroup): BoardPiece[] {
    return group.pieces.filter((piece) => piece.special && piece !== group.createdSpecial?.piece)
  }

  private startIdle(piece: BoardPiece): void {
    if (!piece.special) return
    this.idle.start(this.board.getCube(piece))
  }
}
