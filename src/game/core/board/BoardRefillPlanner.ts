import type { BoardPiece, GridPosition } from '../model/Board.ts'
import { clonePosition, isSamePosition } from './GridPosition.ts'
import { BoardGrid, type PositionAssignment } from './BoardGrid.ts'
import { RandomElementSource } from './RandomElementSource.ts'
import type { ElementType } from '../model/Element.ts'

export interface RefillMove {
  piece: BoardPiece
  from: GridPosition
  to: GridPosition
}

export interface RefillSpawn {
  piece: BoardPiece
  from: GridPosition
  to: GridPosition
  elementType: ElementType
}

export interface RefillPlan {
  moves: RefillMove[]
  spawns: RefillSpawn[]
  assignments: PositionAssignment[]
  affectedPieces: BoardPiece[]
}

export class BoardRefillPlanner {
  private readonly grid: BoardGrid
  private readonly elements: RandomElementSource

  constructor(grid: BoardGrid, elements: RandomElementSource) {
    this.grid = grid
    this.elements = elements
  }

  createPlan(): RefillPlan {
    const moves: RefillMove[] = []
    const spawns: RefillSpawn[] = []
    const assignments: PositionAssignment[] = []
    const affectedPieces = new Set<BoardPiece>()

    this.getColumns().forEach((slots) => {
      const activeSlots = slots
        .filter(({ piece }) => piece.active)
        .sort((first, second) => first.position.y - second.position.y)
      const targetSlots = [...slots].sort((first, second) => first.position.y - second.position.y)

      activeSlots.forEach(({ piece, position }, index) => {
        const target = targetSlots[index].position
        if (isSamePosition(position, target)) return
        moves.push({ piece, from: clonePosition(position), to: clonePosition(target) })
        assignments.push({ piece, position: clonePosition(target) })
        affectedPieces.add(piece)
      })

      const emptyTargets = targetSlots.slice(activeSlots.length)
      const inactiveSlots = slots.filter(({ piece }) => !piece.active)
      const highestY = targetSlots[targetSlots.length - 1].position.y

      inactiveSlots.forEach(({ piece }, index) => {
        const target = emptyTargets[index]?.position
        if (!target) return
        const spawn: RefillSpawn = {
          piece,
          from: { x: target.x, y: highestY + 1, z: target.z },
          to: clonePosition(target),
          elementType: this.elements.next(),
        }
        spawns.push(spawn)
        assignments.push({ piece, position: clonePosition(target) })
        affectedPieces.add(piece)
      })
    })

    return {
      moves,
      spawns,
      assignments,
      affectedPieces: Array.from(affectedPieces),
    }
  }

  private getColumns(): Array<Array<{ piece: BoardPiece; position: GridPosition }>> {
    const columns = new Map<string, Array<{ piece: BoardPiece; position: GridPosition }>>()
    this.grid.items.forEach((item) => {
      const key = `${item.position.x}:${item.position.z}`
      const column = columns.get(key) ?? []
      column.push(item)
      columns.set(key, column)
    })
    return Array.from(columns.values())
  }
}
