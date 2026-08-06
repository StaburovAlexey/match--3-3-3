import { describe, expect, it } from 'vitest'
import { BoardGrid } from '../board/BoardGrid.ts'
import type { BoardItem, BoardPiece, GridPosition } from '../model/Board.ts'
import type { ElementType } from '../model/Element.ts'
import { AbilityPlanner } from './AbilityPlanner.ts'

function item(id: string, position: GridPosition, elementType: ElementType = 'ice'): BoardItem {
  return {
    piece: { id, elementType, special: null, active: true },
    position,
  }
}

function createGrid(items: readonly BoardItem[]): BoardGrid {
  return new BoardGrid(items)
}

function findChange(
  changes: readonly { piece: BoardPiece; to: GridPosition }[],
  pieceId: string,
): GridPosition {
  const change = changes.find(({ piece }) => piece.id === pieceId)
  if (!change) throw new Error(`Change for ${pieceId} not found`)
  return change.to
}

describe('AbilityPlanner', () => {
  it('строит превращение без изменения исходного поля', () => {
    const first = item('first', { x: 0, y: 0, z: 0 }, 'ice')
    const second = item('second', { x: 1, y: 0, z: 0 }, 'fire')
    const grid = createGrid([first, second])
    const planner = new AbilityPlanner(grid)

    const plan = planner.create({
      type: 'convert',
      pieceIds: ['first', 'second'],
      elementType: 'light',
    })

    expect(plan.typeChanges.map(({ piece, from, to }) => [piece.id, from, to])).toEqual([
      ['first', 'ice', 'light'],
      ['second', 'fire', 'light'],
    ])
    expect(first.piece.elementType).toBe('ice')
    expect(second.piece.elementType).toBe('fire')
  })

  it('разрешает обмен любых двух кубов', () => {
    const first = item('first', { x: 0, y: 0, z: 0 })
    const second = item('second', { x: 3, y: 0, z: 0 })
    const grid = createGrid([first, second])
    const plan = new AbilityPlanner(grid).create({
      type: 'swap',
      pieceIds: ['first', 'second'],
    })

    expect(plan.positionChanges).toEqual([
      { piece: first.piece, from: { x: 0, y: 0, z: 0 }, to: { x: 3, y: 0, z: 0 } },
      { piece: second.piece, from: { x: 3, y: 0, z: 0 }, to: { x: 0, y: 0, z: 0 } },
    ])
  })

  it('поворачивает сегменты y1, x2 и z2 целиком', () => {
    const createRing = (axis: 'x' | 'y' | 'z', coordinate: number): BoardItem[] => {
      const items: BoardItem[] = []
      for (let first = 0; first < 4; first += 1) {
        for (let second = 0; second < 4; second += 1) {
          if (first !== 0 && first !== 3 && second !== 0 && second !== 3) continue
          const position =
            axis === 'x'
              ? { x: coordinate, y: first, z: second }
              : axis === 'y'
                ? { x: first, y: coordinate, z: second }
                : { x: first, y: second, z: coordinate }
          items.push(item(`${position.x}:${position.y}:${position.z}`, position))
        }
      }
      return items
    }

    const yPlan = new AbilityPlanner(createGrid(createRing('y', 1))).create({
      type: 'rotateSegment',
      axis: 'y',
      segments: [{ coordinate: 1, quarterTurns: 1, direction: 1 }],
    })
    expect(yPlan.pieces).toHaveLength(12)
    expect(findChange(yPlan.positionChanges, '0:1:0')).toEqual({ x: 0, y: 1, z: 3 })

    const xPlan = new AbilityPlanner(createGrid(createRing('x', 2))).create({
      type: 'rotateSegment',
      axis: 'x',
      segments: [{ coordinate: 2, quarterTurns: 1, direction: 1 }],
    })
    expect(findChange(xPlan.positionChanges, '2:0:0')).toEqual({ x: 2, y: 0, z: 3 })

    const zPlan = new AbilityPlanner(createGrid(createRing('z', 2))).create({
      type: 'rotateSegment',
      axis: 'z',
      segments: [{ coordinate: 2, quarterTurns: 1, direction: 1 }],
    })
    expect(findChange(zPlan.positionChanges, '0:0:2')).toEqual({ x: 0, y: 3, z: 2 })
  })

  it('одновременно поворачивает несколько сегментов и поддерживает обратное направление', () => {
    const items = Array.from({ length: 27 }, (_, index) => {
      const x = index % 3
      const y = Math.floor(index / 3) % 3
      const z = Math.floor(index / 9)
      return item(`${x}:${y}:${z}`, { x, y, z })
    })
    const planner = new AbilityPlanner(createGrid(items))

    const parallelPlan = planner.create({
      type: 'rotateSegment',
      axis: 'y',
      segments: [
        { coordinate: 0, quarterTurns: 1, direction: 1 },
        { coordinate: 2, quarterTurns: 1, direction: 1 },
      ],
    })
    expect(parallelPlan.rotationGroups).toHaveLength(2)
    expect(parallelPlan.pieces).toHaveLength(18)
    expect(findChange(parallelPlan.positionChanges, '0:0:0')).toEqual({ x: 0, y: 0, z: 2 })
    expect(findChange(parallelPlan.positionChanges, '0:2:0')).toEqual({ x: 0, y: 2, z: 2 })

    const mirrorPlan = planner.create({
      type: 'rotateSegment',
      axis: 'y',
      segments: [
        { coordinate: 0, quarterTurns: 1, direction: 1 },
        { coordinate: 2, quarterTurns: 1, direction: -1 },
      ],
    })
    expect(findChange(mirrorPlan.positionChanges, '2:2:0')).toEqual({ x: 2, y: 2, z: 2 })
    expect(mirrorPlan.rotationGroups?.map(({ direction }) => direction)).toEqual([1, -1])
  })
})
