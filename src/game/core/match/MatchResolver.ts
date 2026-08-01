import type { BoardPiece, MatchResolution } from '../model/Board.ts'
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
    const preserved = new Set(createdSpecials.map(({ piece }) => piece))
    const cleared = new Set<BoardPiece>()
    groups.forEach((group) => {
      group.pieces.forEach((piece) => {
        if (!preserved.has(piece)) cleared.add(piece)
      })
    })
    return { groups, clearedPieces: Array.from(cleared), createdSpecials }
  }
}
