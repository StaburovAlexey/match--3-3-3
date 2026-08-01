import type { ElementType } from '../model/Element.ts'
import type { BoardPiece, GridPosition } from '../model/Board.ts'
import { addPosition, axisDirections } from '../board/GridPosition.ts'
import { BoardGrid } from '../board/BoardGrid.ts'

export class MatchValidator {
  private readonly grid: BoardGrid

  constructor(grid: BoardGrid) {
    this.grid = grid
  }

  canSwap(first: BoardPiece, second: BoardPiece): boolean {
    if (first.elementType === second.elementType) return false
    const firstPosition = this.grid.getPosition(first)
    const secondPosition = this.grid.getPosition(second)
    if (!firstPosition || !secondPosition) return false
    return (
      this.hasMatchAfterSwap(firstPosition, second.elementType, first, second) ||
      this.hasMatchAfterSwap(secondPosition, first.elementType, first, second)
    )
  }

  hasAvailableSwap(): boolean {
    return this.grid.items.some(({ piece, position }) => {
      if (!piece.active) return false
      return axisDirections.some(({ vector }) => {
        const neighbor = this.grid.getPieceAt(addPosition(position, vector))
        return Boolean(neighbor?.active && this.canSwap(piece, neighbor))
      })
    })
  }

  private hasMatchAfterSwap(
    origin: GridPosition,
    type: ElementType,
    first: BoardPiece,
    second: BoardPiece,
  ): boolean {
    return axisDirections.some(({ vector }) => {
      const opposite = { x: -vector.x, y: -vector.y, z: -vector.z }
      return (
        1 +
          this.countDirection(origin, vector, type, first, second) +
          this.countDirection(origin, opposite, type, first, second) >=
        3
      )
    })
  }

  private countDirection(
    origin: GridPosition,
    direction: GridPosition,
    type: ElementType,
    first: BoardPiece,
    second: BoardPiece,
  ): number {
    let count = 0
    let position = addPosition(origin, direction)
    while (true) {
      const piece = this.grid.getPieceAt(position)
      if (!piece?.active || this.getTypeAfterSwap(piece, first, second) !== type) return count
      count += 1
      position = addPosition(position, direction)
    }
  }

  private getTypeAfterSwap(piece: BoardPiece, first: BoardPiece, second: BoardPiece): ElementType {
    if (piece === first) return second.elementType
    if (piece === second) return first.elementType
    return piece.elementType
  }
}
