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
    active?: boolean
  }>,
): BoardGrid {
  const items: BoardItem[] = definitions.map((definition, index) => ({
    piece: {
      id: `piece-${index}`,
      elementType: definition.type ?? 'ice',
      special: definition.special ?? null,
      active: definition.active ?? true,
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
  it('создаёт lightning за match из четырёх и bomb за match из пяти и более кубов', () => {
    const lightningGrid = createGrid(
      Array.from({ length: 4 }, (_, x) => ({ position: { x, y: 0, z: 0 } })),
    )
    const bombGrid = createGrid(
      Array.from({ length: 6 }, (_, x) => ({ position: { x, y: 0, z: 0 } })),
    )

    const lightningMatch = groupFrom(
      lightningGrid,
      Array.from({ length: 4 }, (_, x) => ({ x, y: 0, z: 0 })),
    )
    const bombMatch = groupFrom(
      bombGrid,
      Array.from({ length: 6 }, (_, x) => ({ x, y: 0, z: 0 })),
    )

    expect(
      new SpecialEffectResolver(lightningGrid).enrich([lightningMatch])[0].createdSpecial,
    ).toMatchObject({ special: { type: 'lightning' } })
    expect(new SpecialEffectResolver(bombGrid).enrich([bombMatch])[0].createdSpecial).toMatchObject(
      { special: { type: 'bomb' } },
    )
  })

  it('lightning уничтожает все активные кубы своего цвета по всему полю', () => {
    const grid = createGrid([
      { position: { x: 0, y: 0, z: 0 }, type: 'ice', special: { type: 'lightning' } },
      { position: { x: 3, y: 2, z: 1 }, type: 'ice' },
      { position: { x: 1, y: 1, z: 1 }, type: 'fire' },
      { position: { x: 2, y: 2, z: 2 }, type: 'ice', active: false },
    ])
    const lightning = requirePiece(grid, { x: 0, y: 0, z: 0 })
    const match = groupFrom(grid, [{ x: 0, y: 0, z: 0 }])

    const [resolved] = new SpecialEffectResolver(grid).enrich([match])

    expect(resolved.pieces).toContain(lightning)
    expect(resolved.pieces).toContain(requirePiece(grid, { x: 3, y: 2, z: 1 }))
    expect(resolved.pieces).not.toContain(requirePiece(grid, { x: 1, y: 1, z: 1 }))
    expect(resolved.pieces).not.toContain(requirePiece(grid, { x: 2, y: 2, z: 2 }))
    expect(resolved.effects).toHaveLength(1)
    expect(resolved.effects?.[0]).toMatchObject({ source: lightning, type: 'lightning' })
  })

  it('бомба, задев lightning, запускает очистку цвета lightning', () => {
    const grid = createGrid([
      { position: { x: 0, y: 0, z: 0 }, type: 'fire', special: { type: 'bomb' } },
      { position: { x: 1, y: 0, z: 0 }, type: 'ice', special: { type: 'lightning' } },
      { position: { x: 4, y: 3, z: 2 }, type: 'ice' },
      { position: { x: 4, y: 3, z: 3 }, type: 'earth' },
    ])
    const bomb = requirePiece(grid, { x: 0, y: 0, z: 0 })

    const [resolved] = new SpecialEffectResolver(grid).enrich([
      groupFrom(grid, [{ x: 0, y: 0, z: 0 }]),
    ])

    expect(resolved.pieces).toContain(requirePiece(grid, { x: 4, y: 3, z: 2 }))
    expect(resolved.pieces).not.toContain(requirePiece(grid, { x: 4, y: 3, z: 3 }))
    expect(resolved.effects).toHaveLength(2)
    expect(resolved.effects?.[1]).toMatchObject({
      type: 'lightning',
      triggeredBy: bomb,
    })
  })

  it('не запускает повторный веер у lightning того же цвета', () => {
    const grid = createGrid([
      { position: { x: 0, y: 0, z: 0 }, type: 'dark', special: { type: 'lightning' } },
      { position: { x: 2, y: 2, z: 2 }, type: 'dark', special: { type: 'lightning' } },
      { position: { x: 3, y: 3, z: 3 }, type: 'dark' },
    ])

    const [resolved] = new SpecialEffectResolver(grid).enrich([
      groupFrom(grid, [{ x: 0, y: 0, z: 0 }]),
    ])

    expect(resolved.pieces).toEqual(expect.arrayContaining(grid.allPieces))
    expect(resolved.effects?.filter((effect) => effect.type === 'lightning')).toHaveLength(1)
  })

  it('бомба уничтожает кубы в манхэттенском радиусе двух ячеек', () => {
    const grid = createGrid([
      { position: { x: 0, y: 0, z: 0 }, special: { type: 'bomb' } },
      { position: { x: 2, y: 0, z: 0 } },
      { position: { x: 1, y: 1, z: 0 } },
      { position: { x: 1, y: 1, z: 1 } },
      { position: { x: 2, y: 2, z: 2 } },
      { position: { x: 3, y: 0, z: 0 } },
    ])
    const match = groupFrom(grid, [{ x: 0, y: 0, z: 0 }])

    const [resolved] = new SpecialEffectResolver(grid).enrich([match])

    expect(resolved.pieces).toContain(requirePiece(grid, { x: 2, y: 0, z: 0 }))
    expect(resolved.pieces).toContain(requirePiece(grid, { x: 1, y: 1, z: 0 }))
    expect(resolved.pieces).not.toContain(requirePiece(grid, { x: 1, y: 1, z: 1 }))
    expect(resolved.pieces).not.toContain(requirePiece(grid, { x: 2, y: 2, z: 2 }))
    expect(resolved.pieces).not.toContain(requirePiece(grid, { x: 3, y: 0, z: 0 }))
  })
})
