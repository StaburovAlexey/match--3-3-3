import { describe, expect, it } from 'vitest'
import type { BoardItem, BoardPiece, GridPosition } from '../model/Board.ts'
import type { ElementType } from '../model/Element.ts'
import { BoardGrid } from './BoardGrid.ts'

function createItem(id: string, type: ElementType, position: GridPosition): BoardItem {
  return {
    piece: { id, elementType: type, special: null, active: true },
    position,
  }
}

describe('BoardGrid', () => {
  it('определяет только соседей по общей стороне', () => {
    const first = createItem('first', 'ice', { x: 0, y: 0, z: 0 })
    const side = createItem('side', 'fire', { x: 1, y: 0, z: 0 })
    const diagonal = createItem('diagonal', 'earth', { x: 1, y: 1, z: 0 })
    const grid = new BoardGrid([first, side, diagonal])

    expect(grid.areAdjacent(first.piece, side.piece)).toBe(true)
    expect(grid.areAdjacent(first.piece, diagonal.piece)).toBe(false)
  })

  it('атомарно меняет позиции двух кубов', () => {
    const first = createItem('first', 'ice', { x: 0, y: 0, z: 0 })
    const second = createItem('second', 'fire', { x: 1, y: 0, z: 0 })
    const grid = new BoardGrid([first, second])

    grid.swap(first.piece, second.piece)

    expect(grid.getPieceAt({ x: 0, y: 0, z: 0 })).toBe(second.piece)
    expect(grid.getPieceAt({ x: 1, y: 0, z: 0 })).toBe(first.piece)
  })

  it('не допускает двух кубов в одной позиции', () => {
    const first = createItem('first', 'ice', { x: 0, y: 0, z: 0 })
    const second = createItem('second', 'fire', { x: 1, y: 0, z: 0 })
    const grid = new BoardGrid([first, second])

    expect(() => grid.reposition([{ piece: first.piece, position: { x: 1, y: 0, z: 0 } }])).toThrow(
      'Duplicate board position after move',
    )
  })
})

export function pieceAt(grid: BoardGrid, position: GridPosition): BoardPiece {
  const piece = grid.getPieceAt(position)
  if (!piece) throw new Error('Test piece not found')
  return piece
}
