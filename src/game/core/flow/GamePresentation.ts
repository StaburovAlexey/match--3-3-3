import type { BoardPiece, MatchResolution } from '../model/Board.ts'
import type { RefillPlan } from '../board/BoardRefillPlanner.ts'
import type { AbilityPlan } from '../ability/AbilityPlanner.ts'

export type AnimationResult = 'completed' | 'cancelled'

export interface GamePresentation {
  spawn(pieces: readonly BoardPiece[]): Promise<AnimationResult>
  select(piece: BoardPiece): void
  deselect(piece: BoardPiece): void
  animateRejectedSwap(first: BoardPiece, second: BoardPiece): Promise<AnimationResult>
  animateSwap(first: BoardPiece, second: BoardPiece): Promise<AnimationResult>
  animateMatches(resolution: MatchResolution): Promise<AnimationResult>
  animateRefill(plan: RefillPlan): Promise<AnimationResult>
  previewAbility(plan: AbilityPlan, mode?: 'selection' | 'rotation'): Promise<AnimationResult>
  clearAbilityPreview(): void
  animateAbility(plan: AbilityPlan): Promise<AnimationResult>
  hideForRebuild(pieces: readonly BoardPiece[]): Promise<AnimationResult>
  showAfterRebuild(pieces: readonly BoardPiece[]): Promise<AnimationResult>
  syncPieces(pieces: readonly BoardPiece[]): void
}
