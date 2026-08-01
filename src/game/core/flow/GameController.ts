import { BoardGrid } from '../board/BoardGrid.ts'
import { BoardRefillPlanner } from '../board/BoardRefillPlanner.ts'
import { PlayableBoardGenerator } from '../board/PlayableBoardGenerator.ts'
import { MatchResolver } from '../match/MatchResolver.ts'
import { MatchValidator } from '../match/MatchValidator.ts'
import type { BoardPiece } from '../model/Board.ts'
import type { AnimationResult, GamePresentation } from './GamePresentation.ts'

export type GamePhase =
  'spawning' | 'idle' | 'swapping' | 'clearing' | 'refilling' | 'rebuilding' | 'disposed'

export class GameController {
  private currentPhase: GamePhase = 'spawning'
  private selectedPiece: BoardPiece | null = null
  private readonly grid: BoardGrid
  private readonly validator: MatchValidator
  private readonly matches: MatchResolver
  private readonly refill: BoardRefillPlanner
  private readonly generator: PlayableBoardGenerator
  private readonly presentation: GamePresentation

  constructor(
    grid: BoardGrid,
    validator: MatchValidator,
    matches: MatchResolver,
    refill: BoardRefillPlanner,
    generator: PlayableBoardGenerator,
    presentation: GamePresentation,
  ) {
    this.grid = grid
    this.validator = validator
    this.matches = matches
    this.refill = refill
    this.generator = generator
    this.presentation = presentation
  }

  get phase(): GamePhase {
    return this.currentPhase
  }

  async start(): Promise<void> {
    if (this.currentPhase === 'disposed') return
    this.currentPhase = 'spawning'
    const result = await this.presentation.spawn(this.grid.allPieces)
    if (this.canContinue(result)) this.currentPhase = 'idle'
  }

  async handlePieceClick(pieceId: string): Promise<void> {
    if (this.currentPhase !== 'idle') return
    const piece = this.grid.getPieceById(pieceId)
    if (!piece?.active) return

    if (this.selectedPiece === piece) {
      this.presentation.deselect(piece)
      this.selectedPiece = null
      return
    }

    if (this.selectedPiece) {
      const first = this.selectedPiece
      if (this.grid.areAdjacent(first, piece)) {
        if (!this.validator.canSwap(first, piece)) {
          this.currentPhase = 'swapping'
          const result = await this.presentation.animateRejectedSwap(first, piece)
          if (this.canContinue(result)) {
            this.presentation.select(first)
            this.currentPhase = 'idle'
          }
          return
        }

        this.selectedPiece = null
        this.currentPhase = 'swapping'
        const result = await this.presentation.animateSwap(first, piece)
        if (!this.canContinue(result)) return
        this.grid.swap(first, piece)
        await this.resolveBoard([first, piece])
        return
      }

      this.presentation.deselect(first)
    }

    this.selectedPiece = piece
    this.presentation.select(piece)
  }

  async requestRebuild(): Promise<void> {
    if (this.currentPhase !== 'idle') return
    await this.rebuildBoard()
  }

  dispose(): void {
    this.selectedPiece = null
    this.currentPhase = 'disposed'
  }

  private async resolveBoard(seedPieces: readonly BoardPiece[]): Promise<void> {
    let resolution = this.matches.resolveFrom(seedPieces)

    while (resolution.groups.length > 0) {
      this.currentPhase = 'clearing'
      resolution.createdSpecials.forEach(({ piece, special }) => {
        piece.special = { ...special }
      })
      this.presentation.syncPieces(resolution.createdSpecials.map(({ piece }) => piece))

      const clearResult = await this.presentation.animateMatches(resolution)
      if (!this.canContinue(clearResult)) return

      resolution.clearedPieces.forEach((piece) => {
        piece.active = false
        piece.special = null
      })
      this.presentation.syncPieces(resolution.clearedPieces)

      this.currentPhase = 'refilling'
      const refillPlan = this.refill.createPlan()
      this.grid.reposition(refillPlan.assignments)
      refillPlan.spawns.forEach(({ piece, elementType }) => {
        piece.elementType = elementType
        piece.special = null
        piece.active = true
      })
      this.presentation.syncPieces(refillPlan.spawns.map(({ piece }) => piece))

      const refillResult = await this.presentation.animateRefill(refillPlan)
      if (!this.canContinue(refillResult)) return
      resolution = this.matches.resolveFrom(refillPlan.affectedPieces)
    }

    if (!this.validator.hasAvailableSwap()) {
      await this.rebuildBoard()
      return
    }

    this.currentPhase = 'idle'
  }

  private async rebuildBoard(): Promise<void> {
    this.currentPhase = 'rebuilding'
    if (this.selectedPiece) {
      this.presentation.deselect(this.selectedPiece)
      this.selectedPiece = null
    }

    const pieces = this.grid.allPieces
    const hideResult = await this.presentation.hideForRebuild(pieces)
    if (!this.canContinue(hideResult)) return
    this.generator.generate()
    this.presentation.syncPieces(pieces)
    const showResult = await this.presentation.showAfterRebuild(pieces)
    if (this.canContinue(showResult)) this.currentPhase = 'idle'
  }

  private canContinue(result: AnimationResult): boolean {
    return result === 'completed' && this.currentPhase !== 'disposed'
  }
}
