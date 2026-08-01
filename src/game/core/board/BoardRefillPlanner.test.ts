import { describe, expect, it } from 'vitest'
import type { BoardItem } from '../model/Board.ts'
import { BoardGrid } from './BoardGrid.ts'
import { BoardRefillPlanner } from './BoardRefillPlanner.ts'
import { RandomElementSource } from './RandomElementSource.ts'

describe('BoardRefillPlanner', () => {
  it('опускает активные кубы и переиспользует пустые для spawn', () => {
    const items: BoardItem[] = Array.from({ length: 4 }, (_, y) => ({
      piece: {
        id: `piece-${y}`,
        elementType: 'fire',
        special: null,
        active: y === 1 || y === 3,
      },
      position: { x: 0, y, z: 0 },
    }))
    const grid = new BoardGrid(items)
    const plan = new BoardRefillPlanner(grid, new RandomElementSource(() => 0)).createPlan()

    expect(plan.moves.map(({ from, to }) => [from.y, to.y])).toEqual([
      [1, 0],
      [3, 1],
    ])
    expect(plan.spawns.map(({ from, to, elementType }) => [from.y, to.y, elementType])).toEqual([
      [4, 2, 'ice'],
      [4, 3, 'ice'],
    ])

    expect(() => grid.reposition(plan.assignments)).not.toThrow()
    expect(new Set(grid.items.map(({ position }) => position.y))).toEqual(new Set([0, 1, 2, 3]))
  })
})
