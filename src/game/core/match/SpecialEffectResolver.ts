import type { BoardPiece, GridPosition, MatchGroup } from '../model/Board.ts'
import type { SpecialState } from '../model/Element.ts'
import { BoardGrid } from '../board/BoardGrid.ts'
import { isWithinRadius } from '../board/GridPosition.ts'

export class SpecialEffectResolver {
  private readonly grid: BoardGrid
  private readonly bombRadius: number

  constructor(grid: BoardGrid, bombRadius = 2) {
    this.grid = grid
    this.bombRadius = bombRadius
  }

  enrich(matches: readonly MatchGroup[]): MatchGroup[] {
    const groups = matches.map((group) => ({
      ...group,
      pieces: [...group.pieces],
      effects: group.effects?.map((effect) => ({
        ...effect,
        pieces: [...effect.pieces],
      })),
    }))
    const activated = new Set<BoardPiece>()
    const queue: BoardPiece[] = []

    groups.forEach((group) => {
      group.pieces.forEach((piece) => {
        if (piece.special) queue.push(piece)
      })
      if (group.pieces.length < 4 || group.pieces.some((piece) => piece.special)) return
      const special: SpecialState =
        group.pieces.length === 4
          ? {
              type: 'arrow',
              orientation: group.direction === 'y' ? 'vertical' : 'horizontal',
            }
          : { type: 'bomb' }
      group.createdSpecial = { piece: group.startPiece, special }
    })

    while (queue.length > 0) {
      const specialPiece = queue.shift()
      if (!specialPiece || activated.has(specialPiece)) continue
      activated.add(specialPiece)
      const owner = groups.find((group) => group.pieces.includes(specialPiece))
      if (!owner || !specialPiece.special) continue
      const effectPieces = this.getEffectPieces(specialPiece, specialPiece.special)
      owner.effects ??= []
      owner.effects.push({
        source: specialPiece,
        type: specialPiece.special.type,
        orientation:
          specialPiece.special.type === 'arrow' ? specialPiece.special.orientation : undefined,
        pieces: effectPieces,
      })
      effectPieces.forEach((piece) => {
        if (!owner.pieces.includes(piece)) owner.pieces.push(piece)
        if (piece.special && !activated.has(piece)) queue.push(piece)
      })
    }

    return groups
  }

  private getEffectPieces(piece: BoardPiece, special: SpecialState): BoardPiece[] {
    const position = this.grid.getPosition(piece)
    if (!position) return []
    return special.type === 'arrow'
      ? this.getArrowPieces(position, special.orientation)
      : this.getBombPieces(position)
  }

  private getArrowPieces(
    position: GridPosition,
    orientation: SpecialState['orientation'],
  ): BoardPiece[] {
    if (!orientation) return []
    return this.grid.items
      .filter(({ piece, position: candidate }) => {
        const inSegment =
          orientation === 'vertical' ? candidate.x === position.x : candidate.y === position.y
        return piece.active && inSegment
      })
      .map(({ piece }) => piece)
  }

  private getBombPieces(position: GridPosition): BoardPiece[] {
    return this.grid.items
      .filter(
        ({ piece, position: candidate }) =>
          piece.active && isWithinRadius(position, candidate, this.bombRadius),
      )
      .map(({ piece }) => piece)
  }
}
