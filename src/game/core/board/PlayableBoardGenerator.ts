import type { BoardPiece } from '../model/Board.ts'
import { axisDirections, addPosition } from './GridPosition.ts'
import { BoardGrid } from './BoardGrid.ts'
import { RandomElementSource } from './RandomElementSource.ts'
import { MatchValidator } from '../match/MatchValidator.ts'
import { elementTypes } from '../model/Element.ts'

export class PlayableBoardGenerator {
  private readonly grid: BoardGrid
  private readonly validator: MatchValidator
  private readonly elements: RandomElementSource
  private readonly maxAttempts: number

  constructor(
    grid: BoardGrid,
    validator: MatchValidator,
    elements: RandomElementSource,
    maxAttempts = 100,
  ) {
    this.grid = grid
    this.validator = validator
    this.elements = elements
    this.maxAttempts = maxAttempts
  }

  generate(): void {
    for (let attempt = 0; attempt < this.maxAttempts; attempt += 1) {
      this.randomize()
      if (this.validator.hasAvailableSwap()) return
    }
    this.applyFallbackMove()
  }

  private randomize(): void {
    this.grid.allPieces.forEach((piece) => {
      piece.elementType = this.elements.next()
      piece.special = null
      piece.active = true
    })
  }

  private applyFallbackMove(): void {
    const line = this.findFourPieceLine()
    if (!line) return
    const [first, second, third, fourth] = line
    first.elementType = elementTypes[0]
    second.elementType = elementTypes[1]
    third.elementType = elementTypes[0]
    fourth.elementType = elementTypes[0]
    line.forEach((piece) => {
      piece.special = null
      piece.active = true
    })
  }

  private findFourPieceLine(): [BoardPiece, BoardPiece, BoardPiece, BoardPiece] | null {
    for (const { piece, position } of this.grid.items) {
      for (const { vector } of axisDirections) {
        const second = this.grid.getPieceAt(addPosition(position, vector, 1))
        const third = this.grid.getPieceAt(addPosition(position, vector, 2))
        const fourth = this.grid.getPieceAt(addPosition(position, vector, 3))
        if (second && third && fourth) return [piece, second, third, fourth]
      }
    }
    return null
  }
}
