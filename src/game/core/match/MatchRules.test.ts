import { describe, expect, it } from 'vitest'
import { BoardGrid } from '../board/BoardGrid.ts'
import type { BoardItem, GridPosition, MatchGroup } from '../model/Board.ts'
import type { ElementType, SpecialState } from '../model/Element.ts'
import { MatchFinder } from './MatchFinder.ts'
import { MatchValidator } from './MatchValidator.ts'
import { SpecialEffectResolver } from './SpecialEffectResolver.ts'

function createGrid(
  definitions: Array<{
    position: GridPosition
    type?: ElementType
    special?: SpecialState | null
  }>,
): BoardGrid {
  const items: BoardItem[] = definitions.map((definition, index) => ({
    piece: {
      id: `piece-${index}`,
      elementType: definition.type ?? 'ice',
      special: definition.special ?? null,
      active: true,
    },
    position: definition.position,
  }))
  return new BoardGrid(items)
}

function requirePiece(grid: BoardGrid, position: GridPosition) {
  const piece = grid.getPieceAt(position)
  if (!piece) throw new Error('Test piece not found')
  return piece
}

function groupFrom(grid: BoardGrid, positions: GridPosition[]): MatchGroup {
  const pieces = positions.map((position) => requirePiece(grid, position))
  return {
    elementType: pieces[0].elementType,
    direction: 'x',
    startPiece: pieces[0],
    pieces,
  }
}

describe('MatchFinder', () => {
  it('объединяет пересекающиеся линии в один T/L match', () => {
    const grid = createGrid([
      { position: { x: 0, y: 0, z: 0 } },
      { position: { x: 1, y: 0, z: 0 } },
      { position: { x: 2, y: 0, z: 0 } },
      { position: { x: 1, y: 1, z: 0 } },
      { position: { x: 1, y: 2, z: 0 } },
    ])
    const center = requirePiece(grid, { x: 1, y: 0, z: 0 })

    const groups = new MatchFinder(grid).findMatchesFrom([center])

    expect(groups).toHaveLength(1)
    expect(groups[0].pieces).toHaveLength(5)
    expect(new Set(groups[0].pieces)).toEqual(new Set(grid.allPieces))
    expect(groups[0].startPiece).toBe(center)
  })

  it('не ищет независимый match вне переданных seed-кубов', () => {
    const grid = createGrid([
      { position: { x: 0, y: 0, z: 0 }, type: 'ice' },
      { position: { x: 1, y: 0, z: 0 }, type: 'ice' },
      { position: { x: 2, y: 0, z: 0 }, type: 'ice' },
      { position: { x: 0, y: 2, z: 0 }, type: 'fire' },
      { position: { x: 1, y: 2, z: 0 }, type: 'fire' },
      { position: { x: 2, y: 2, z: 0 }, type: 'fire' },
    ])

    const groups = new MatchFinder(grid).findMatchesFrom([requirePiece(grid, { x: 0, y: 0, z: 0 })])

    expect(groups).toHaveLength(1)
    expect(groups[0].elementType).toBe('ice')
  })

  it('собирает H-образный match от передвинутого центрального куба', () => {
    const grid = createGrid([
      { position: { x: 0, y: 0, z: 0 } },
      { position: { x: 0, y: 1, z: 0 } },
      { position: { x: 0, y: 2, z: 0 } },
      { position: { x: 1, y: 1, z: 0 } },
      { position: { x: 2, y: 0, z: 0 } },
      { position: { x: 2, y: 1, z: 0 } },
      { position: { x: 2, y: 2, z: 0 } },
    ])

    const groups = new MatchFinder(grid).findMatchesFrom([requirePiece(grid, { x: 1, y: 1, z: 0 })])

    expect(groups).toHaveLength(1)
    expect(groups[0].pieces).toHaveLength(7)
    expect(new Set(groups[0].pieces)).toEqual(new Set(grid.allPieces))
  })
})

describe('MatchValidator', () => {
  it('разрешает swap только когда он создаёт линию минимум из трёх кубов', () => {
    const grid = createGrid([
      { position: { x: 0, y: 0, z: 0 }, type: 'ice' },
      { position: { x: 1, y: 0, z: 0 }, type: 'fire' },
      { position: { x: 2, y: 0, z: 0 }, type: 'ice' },
      { position: { x: 3, y: 0, z: 0 }, type: 'ice' },
    ])
    const validator = new MatchValidator(grid)

    expect(
      validator.canSwap(
        requirePiece(grid, { x: 0, y: 0, z: 0 }),
        requirePiece(grid, { x: 1, y: 0, z: 0 }),
      ),
    ).toBe(true)
    expect(
      validator.canSwap(
        requirePiece(grid, { x: 2, y: 0, z: 0 }),
        requirePiece(grid, { x: 3, y: 0, z: 0 }),
      ),
    ).toBe(false)
  })
})

describe('SpecialEffectResolver', () => {
  it('создаёт горизонтальную стрелку для линии по X и вертикальную для линии по Y', () => {
    const horizontalGrid = createGrid(
      Array.from({ length: 4 }, (_, x) => ({ position: { x, y: 0, z: 0 } })),
    )
    const verticalGrid = createGrid(
      Array.from({ length: 4 }, (_, y) => ({ position: { x: 0, y, z: 0 } })),
    )
    const horizontal = groupFrom(
      horizontalGrid,
      Array.from({ length: 4 }, (_, x) => ({ x, y: 0, z: 0 })),
    )
    const vertical = groupFrom(
      verticalGrid,
      Array.from({ length: 4 }, (_, y) => ({ x: 0, y, z: 0 })),
    )
    vertical.direction = 'y'

    expect(
      new SpecialEffectResolver(horizontalGrid).enrich([horizontal])[0].createdSpecial,
    ).toMatchObject({ special: { type: 'arrow', orientation: 'horizontal' } })
    expect(
      new SpecialEffectResolver(verticalGrid).enrich([vertical])[0].createdSpecial,
    ).toMatchObject({ special: { type: 'arrow', orientation: 'vertical' } })
  })

  it('горизонтальная стрелка уничтожает весь сегмент с одинаковым Y', () => {
    const grid = createGrid([
      { position: { x: 0, y: 1, z: 0 }, special: { type: 'arrow', orientation: 'horizontal' } },
      { position: { x: 1, y: 1, z: 0 } },
      { position: { x: 1, y: 1, z: 1 } },
      { position: { x: 0, y: 2, z: 0 } },
    ])
    const arrow = requirePiece(grid, { x: 0, y: 1, z: 0 })
    const match = groupFrom(grid, [
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 1, z: 1 },
    ])

    const [resolved] = new SpecialEffectResolver(grid).enrich([match])

    expect(resolved.pieces).toContain(arrow)
    expect(resolved.pieces).toContain(requirePiece(grid, { x: 1, y: 1, z: 1 }))
    expect(resolved.pieces).not.toContain(requirePiece(grid, { x: 0, y: 2, z: 0 }))
  })

  it('бомба уничтожает кубы в радиусе двух ячеек по всем осям', () => {
    const grid = createGrid([
      { position: { x: 0, y: 0, z: 0 }, special: { type: 'bomb' } },
      { position: { x: 2, y: 2, z: 2 } },
      { position: { x: 3, y: 0, z: 0 } },
    ])
    const match = groupFrom(grid, [{ x: 0, y: 0, z: 0 }])

    const [resolved] = new SpecialEffectResolver(grid).enrich([match])

    expect(resolved.pieces).toContain(requirePiece(grid, { x: 2, y: 2, z: 2 }))
    expect(resolved.pieces).not.toContain(requirePiece(grid, { x: 3, y: 0, z: 0 }))
  })
})
