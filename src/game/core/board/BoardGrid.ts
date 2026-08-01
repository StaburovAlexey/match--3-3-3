import type { BoardItem, BoardPiece, GridPosition } from '../model/Board.ts'
import { clonePosition, manhattanDistance, positionKey } from './GridPosition.ts'

export interface PositionAssignment {
  piece: BoardPiece
  position: GridPosition
}

export class BoardGrid {
  private readonly piecesById = new Map<string, BoardPiece>()
  private readonly positionsByPieceId = new Map<string, GridPosition>()
  private readonly piecesByPosition = new Map<string, BoardPiece>()

  constructor(items: readonly BoardItem[]) {
    items.forEach(({ piece, position }) => {
      if (this.piecesById.has(piece.id)) {
        throw new Error(`Duplicate board piece id: ${piece.id}`)
      }

      const key = positionKey(position)
      if (this.piecesByPosition.has(key)) {
        throw new Error(`Duplicate board position: ${key}`)
      }

      this.piecesById.set(piece.id, piece)
      this.positionsByPieceId.set(piece.id, clonePosition(position))
      this.piecesByPosition.set(key, piece)
    })
  }

  get items(): BoardItem[] {
    return this.allPieces.map((piece) => ({
      piece,
      position: this.requirePosition(piece),
    }))
  }

  get allPieces(): BoardPiece[] {
    return Array.from(this.piecesById.values())
  }

  getPieceById(id: string): BoardPiece | null {
    return this.piecesById.get(id) ?? null
  }

  getPieceAt(position: GridPosition): BoardPiece | null {
    return this.piecesByPosition.get(positionKey(position)) ?? null
  }

  getPosition(piece: BoardPiece): GridPosition | null {
    const position = this.positionsByPieceId.get(piece.id)
    return position ? clonePosition(position) : null
  }

  areAdjacent(first: BoardPiece, second: BoardPiece): boolean {
    const firstPosition = this.positionsByPieceId.get(first.id)
    const secondPosition = this.positionsByPieceId.get(second.id)
    return Boolean(
      firstPosition && secondPosition && manhattanDistance(firstPosition, secondPosition) === 1,
    )
  }

  swap(first: BoardPiece, second: BoardPiece): void {
    const firstPosition = this.requirePosition(first)
    const secondPosition = this.requirePosition(second)
    this.reposition([
      { piece: first, position: secondPosition },
      { piece: second, position: firstPosition },
    ])
  }

  reposition(assignments: readonly PositionAssignment[]): void {
    const nextPositions = new Map<string, GridPosition>()
    this.positionsByPieceId.forEach((position, pieceId) => {
      nextPositions.set(pieceId, clonePosition(position))
    })
    assignments.forEach(({ piece, position }) => {
      if (!this.piecesById.has(piece.id)) {
        throw new Error(`Unknown board piece: ${piece.id}`)
      }
      nextPositions.set(piece.id, clonePosition(position))
    })

    const nextPiecesByPosition = new Map<string, BoardPiece>()
    nextPositions.forEach((position, pieceId) => {
      const piece = this.piecesById.get(pieceId)
      if (!piece) return
      const key = positionKey(position)
      if (nextPiecesByPosition.has(key)) {
        throw new Error(`Duplicate board position after move: ${key}`)
      }
      nextPiecesByPosition.set(key, piece)
    })

    this.positionsByPieceId.clear()
    nextPositions.forEach((position, pieceId) => {
      this.positionsByPieceId.set(pieceId, position)
    })
    this.piecesByPosition.clear()
    nextPiecesByPosition.forEach((piece, key) => {
      this.piecesByPosition.set(key, piece)
    })
  }

  private requirePosition(piece: BoardPiece): GridPosition {
    const position = this.positionsByPieceId.get(piece.id)
    if (!position) {
      throw new Error(`Position for piece ${piece.id} not found`)
    }
    return clonePosition(position)
  }
}
