import type { BoardPiece, MatchResolution } from '../model/Board.ts'
import type { RefillPlan } from '../board/BoardRefillPlanner.ts'

export type AnimationResult = 'completed' | 'cancelled'

export interface GamePresentation {
  spawn(pieces: readonly BoardPiece[]): Promise<AnimationResult>
  select(piece: BoardPiece): void
  deselect(piece: BoardPiece): void
  animateRejectedSwap(first: BoardPiece, second: BoardPiece): Promise<AnimationResult>
  animateSwap(first: BoardPiece, second: BoardPiece): Promise<AnimationResult>
  animateMatches(resolution: MatchResolution): Promise<AnimationResult>
  animateRefill(plan: RefillPlan): Promise<AnimationResult>
  hideForRebuild(pieces: readonly BoardPiece[]): Promise<AnimationResult>
  showAfterRebuild(pieces: readonly BoardPiece[]): Promise<AnimationResult>
  syncPieces(pieces: readonly BoardPiece[]): void
}
