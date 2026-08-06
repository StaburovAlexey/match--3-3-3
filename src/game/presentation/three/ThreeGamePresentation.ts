import * as THREE from 'three'
import type { RefillPlan } from '../../core/board/BoardRefillPlanner.ts'
import type { AnimationResult, GamePresentation } from '../../core/flow/GamePresentation.ts'
import type { BoardPiece, MatchResolution } from '../../core/model/Board.ts'
import type { AbilityPlan } from '../../core/ability/AbilityPlanner.ts'
import { AbilityAnimator } from './animation/AbilityAnimator.ts'
import { CubeMatchAnimator } from './animation/CubeMatchAnimator.ts'
import { CubeRebuildAnimator } from './animation/CubeRebuildAnimator.ts'
import { CubeRefillAnimator } from './animation/CubeRefillAnimator.ts'
import { CubeShakeAnimator } from './animation/CubeShakeAnimator.ts'
import { CubeSwapAnimator } from './animation/CubeSwapAnimator.ts'
import { SpecialClearAnimator } from './animation/SpecialClearAnimator.ts'
import type { CubeBoardView } from './board/CubeBoardView.ts'
import { BombExplosionAnimator } from './effects/BombExplosionAnimator.ts'
import { createBombExplosionConfig } from './effects/BombExplosionConfig.ts'
import { ColorLightningAnimator } from './effects/ColorLightningAnimator.ts'
import { CubeClearGlowAnimator } from './effects/CubeClearGlowAnimator.ts'
import type { CubeStarEmitter } from './effects/CubeStarEmitter.ts'
import { SparkBurstAnimator } from './effects/SparkBurstAnimator.ts'

export class ThreeGamePresentation implements GamePresentation {
  private readonly shake = new CubeShakeAnimator()
  private readonly swapAnimator = new CubeSwapAnimator(this.shake)
  private readonly matchAnimator: CubeMatchAnimator
  private readonly refillAnimator: CubeRefillAnimator
  private readonly rebuildAnimator = new CubeRebuildAnimator()
  private readonly abilityAnimator: AbilityAnimator
  private readonly board: CubeBoardView
  private readonly stars: CubeStarEmitter

  constructor(
    board: CubeBoardView,
    stars: CubeStarEmitter,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ) {
    this.board = board
    this.stars = stars
    this.abilityAnimator = new AbilityAnimator(board, this.shake)
    const explosionConfig = createBombExplosionConfig()
    const sparks = new SparkBurstAnimator(scene, board, explosionConfig)
    this.matchAnimator = new CubeMatchAnimator(
      board,
      new SpecialClearAnimator(this.shake),
      new ColorLightningAnimator(scene, board),
      new BombExplosionAnimator(scene, board, sparks, explosionConfig),
      sparks,
      new CubeClearGlowAnimator(scene, camera, board),
    )
    this.refillAnimator = new CubeRefillAnimator(board)
  }

  spawn(pieces: readonly BoardPiece[]): Promise<AnimationResult> {
    return this.refillAnimator.playInitial(pieces.map((piece) => this.board.getCube(piece)))
  }

  select(piece: BoardPiece): void {
    this.shake.startLoop(this.board.getCube(piece), 0.08)
  }

  deselect(piece: BoardPiece): void {
    this.shake.stop(this.board.getCube(piece))
  }

  animateRejectedSwap(first: BoardPiece, second: BoardPiece): Promise<AnimationResult> {
    const firstCube = this.board.getCube(first)
    const secondCube = this.board.getCube(second)
    this.stars.playRejected(firstCube, secondCube)
    return this.swapAnimator.playRejected(firstCube, secondCube)
  }

  animateSwap(first: BoardPiece, second: BoardPiece): Promise<AnimationResult> {
    const firstCube = this.board.getCube(first)
    const secondCube = this.board.getCube(second)
    this.stars.playSwap(firstCube, secondCube)
    return this.swapAnimator.play(firstCube, secondCube)
  }

  animateMatches(resolution: MatchResolution): Promise<AnimationResult> {
    return this.matchAnimator.play(resolution)
  }

  animateRefill(plan: RefillPlan): Promise<AnimationResult> {
    return this.refillAnimator.play(plan)
  }

  previewAbility(
    plan: AbilityPlan,
    mode: 'selection' | 'rotation' = 'rotation',
  ): Promise<AnimationResult> {
    return this.abilityAnimator.preview(plan, mode)
  }

  clearAbilityPreview(): void {
    this.abilityAnimator.clearPreview()
  }

  animateAbility(plan: AbilityPlan): Promise<AnimationResult> {
    return this.abilityAnimator.play(plan)
  }

  hideForRebuild(pieces: readonly BoardPiece[]): Promise<AnimationResult> {
    this.matchAnimator.stopIdleAnimations()
    return this.rebuildAnimator.hide(pieces.map((piece) => this.board.getCube(piece)))
  }

  showAfterRebuild(pieces: readonly BoardPiece[]): Promise<AnimationResult> {
    return this.rebuildAnimator.show(pieces.map((piece) => this.board.getCube(piece)))
  }

  syncPieces(pieces: readonly BoardPiece[]): void {
    this.board.syncPieces(pieces)
  }

  dispose(): void {
    this.rebuildAnimator.destroy()
    this.refillAnimator.destroy()
    this.abilityAnimator.destroy()
    this.matchAnimator.destroy()
    this.swapAnimator.destroy()
    this.shake.destroy()
  }
}
