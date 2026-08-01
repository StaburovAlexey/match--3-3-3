import type { BoardPiece, GridPosition, MatchDirection, MatchGroup } from '../model/Board.ts'
import { BoardGrid } from '../board/BoardGrid.ts'
import {
  addPosition,
  axisDirections,
  manhattanDistance,
  subtractPosition,
} from '../board/GridPosition.ts'

interface MatchLine {
  pieces: BoardPiece[]
  direction: MatchDirection
}

export class MatchFinder {
  private readonly grid: BoardGrid

  constructor(grid: BoardGrid) {
    this.grid = grid
  }

  findMatchesFrom(pieces: readonly BoardPiece[]): MatchGroup[] {
    const queue = [...pieces]
    const seedPieces = new Set(pieces)
    const checkedPieces = new Set<BoardPiece>()
    const lines: MatchLine[] = []
    const lineKeys = new Set<string>()

    while (queue.length > 0) {
      const piece = queue.shift()
      if (!piece || checkedPieces.has(piece)) continue
      checkedPieces.add(piece)
      if (!piece.active) continue
      const position = this.grid.getPosition(piece)
      if (!position) continue

      axisDirections.forEach(({ axis, vector }) => {
        const start = this.findLineStart(position, vector, piece.elementType)
        const line = this.collectLine(start, vector, piece.elementType)
        const key = line.map(({ id }) => id).join('|')
        if (line.length < 3 || lineKeys.has(key)) return
        lineKeys.add(key)
        lines.push({ pieces: line, direction: axis })
        line.forEach((linePiece) => {
          if (!checkedPieces.has(linePiece)) queue.push(linePiece)
        })
      })
    }

    return this.createMatchGroups(lines, seedPieces)
  }

  private createMatchGroups(lines: MatchLine[], seeds: Set<BoardPiece>): MatchGroup[] {
    const groups: Array<{
      pieces: Set<BoardPiece>
      startPiece: BoardPiece
      direction: MatchDirection
    }> = []

    lines.forEach((line) => {
      const matching = groups.filter((group) =>
        line.pieces.some((piece) => group.pieces.has(piece)),
      )
      const startPiece = line.pieces.find((piece) => seeds.has(piece)) ?? line.pieces[0]
      if (matching.length === 0) {
        groups.push({ pieces: new Set(line.pieces), startPiece, direction: line.direction })
        return
      }
      const first = matching[0]
      line.pieces.forEach((piece) => first.pieces.add(piece))
      if (line.pieces.includes(first.startPiece)) first.direction = line.direction
      matching.slice(1).forEach((group) => {
        group.pieces.forEach((piece) => first.pieces.add(piece))
        if (seeds.has(group.startPiece)) {
          first.startPiece = group.startPiece
          first.direction = group.direction
        }
        groups.splice(groups.indexOf(group), 1)
      })
    })

    return groups.map((group) => ({
      elementType: group.startPiece.elementType,
      direction: group.direction,
      startPiece: group.startPiece,
      pieces: this.orderGroupPieces(group.pieces, group.startPiece),
    }))
  }

  private orderGroupPieces(pieces: Set<BoardPiece>, start: BoardPiece): BoardPiece[] {
    const ordered: BoardPiece[] = []
    const queue = [start]
    const remaining = new Set(pieces)
    while (queue.length > 0) {
      const piece = queue.shift()
      if (!piece || !remaining.has(piece)) continue
      remaining.delete(piece)
      ordered.push(piece)
      const position = this.grid.getPosition(piece)
      if (!position) continue
      const neighbors = Array.from(remaining).filter((candidate) => {
        const candidatePosition = this.grid.getPosition(candidate)
        return Boolean(candidatePosition && manhattanDistance(position, candidatePosition) === 1)
      })
      neighbors.sort((first, second) => this.comparePositions(first, second))
      queue.push(...neighbors)
    }
    return ordered
  }

  private comparePositions(first: BoardPiece, second: BoardPiece): number {
    const a = this.grid.getPosition(first)
    const b = this.grid.getPosition(second)
    if (!a || !b) return 0
    return a.x - b.x || a.y - b.y || a.z - b.z
  }

  private findLineStart(
    origin: GridPosition,
    direction: GridPosition,
    type: BoardPiece['elementType'],
  ): GridPosition {
    let position = { ...origin }
    while (true) {
      const previous = subtractPosition(position, direction)
      const piece = this.grid.getPieceAt(previous)
      if (!piece?.active || piece.elementType !== type) return position
      position = previous
    }
  }

  private collectLine(
    origin: GridPosition,
    direction: GridPosition,
    type: BoardPiece['elementType'],
  ): BoardPiece[] {
    const pieces: BoardPiece[] = []
    let position = { ...origin }
    while (true) {
      const piece = this.grid.getPieceAt(position)
      if (!piece?.active || piece.elementType !== type) return pieces
      pieces.push(piece)
      position = addPosition(position, direction)
    }
  }
}
