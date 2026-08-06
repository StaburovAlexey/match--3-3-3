import type { BoardPiece, DestroyedCube, MatchResolution } from '../model/Board.ts'
import { MatchFinder } from './MatchFinder.ts'
import { SpecialEffectResolver } from './SpecialEffectResolver.ts'

export class MatchResolver {
  private readonly finder: MatchFinder
  private readonly specials: SpecialEffectResolver

  constructor(finder: MatchFinder, specials: SpecialEffectResolver) {
    this.finder = finder
    this.specials = specials
  }

  resolveFrom(pieces: readonly BoardPiece[]): MatchResolution {
    const groups = this.specials.enrich(this.finder.findMatchesFrom(pieces))
    const createdSpecials = groups.flatMap((group) =>
      group.createdSpecial ? [group.createdSpecial] : [],
    )
    const preservedIds = new Set(createdSpecials.map(({ piece }) => piece.id))
    const destroyedByPieceId = new Map<string, DestroyedCube>()
    groups.forEach((group) => {
      group.pieces.forEach((piece) => {
        if (!preservedIds.has(piece.id) && !destroyedByPieceId.has(piece.id)) {
          destroyedByPieceId.set(piece.id, { piece, elementType: piece.elementType })
        }
      })
    })
    return { groups, destroyedCubes: Array.from(destroyedByPieceId.values()), createdSpecials }
  }
}
