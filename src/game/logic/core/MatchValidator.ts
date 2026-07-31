import type { ElementType } from '../../three/materials/ElementMaterialConfig.ts'
import type { Cube, GridPosition } from '../../three/objects/Cube.ts'
import CubesGrid from './cubesGrid.ts'

const directions: GridPosition[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
]

export default class MatchValidator {
  private readonly grid: CubesGrid

  constructor(grid: CubesGrid) {
    this.grid = grid
  }

  canSwap(first: Cube, second: Cube): boolean {
    if (first.elementType === second.elementType) {
      return false
    }

    const firstPosition = this.grid.getGridPosition(first)
    const secondPosition = this.grid.getGridPosition(second)

    if (!firstPosition || !secondPosition) {
      return false
    }

    return (
      this.hasMatchAfterSwap(firstPosition, second.elementType, first, second) ||
      this.hasMatchAfterSwap(secondPosition, first.elementType, first, second)
    )
  }

  hasAvailableSwap(): boolean {
    const directions: GridPosition[] = [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ]

    return this.grid.items.some(({ cube }) => {
      if (!cube.visible) {
        return false
      }

      const position = this.grid.getGridPosition(cube)

      if (!position) {
        return false
      }

      return directions.some((direction) => {
        const neighbor = this.grid.getCubeAt({
          x: position.x + direction.x,
          y: position.y + direction.y,
          z: position.z + direction.z,
        })

        return neighbor?.visible === true && this.canSwap(cube, neighbor)
      })
    })
  }

  private hasMatchAfterSwap(
    origin: GridPosition,
    type: ElementType,
    first: Cube,
    second: Cube,
  ): boolean {
    return directions.some((direction) => {
      const count =
        1 +
        this.countDirection(origin, direction, type, first, second) +
        this.countDirection(
          origin,
          { x: -direction.x, y: -direction.y, z: -direction.z },
          type,
          first,
          second,
        )

      return count >= 3
    })
  }

  private countDirection(
    origin: GridPosition,
    direction: GridPosition,
    type: ElementType,
    first: Cube,
    second: Cube,
  ): number {
    let count = 0
    let position = {
      x: origin.x + direction.x,
      y: origin.y + direction.y,
      z: origin.z + direction.z,
    }

    while (true) {
      const cube = this.grid.getCubeAt(position)

      if (!cube || this.getTypeAfterSwap(cube, first, second) !== type) {
        return count
      }

      count += 1
      position = {
        x: position.x + direction.x,
        y: position.y + direction.y,
        z: position.z + direction.z,
      }
    }
  }

  private getTypeAfterSwap(cube: Cube, first: Cube, second: Cube): ElementType {
    if (cube === first) {
      return second.elementType
    }

    if (cube === second) {
      return first.elementType
    }

    return cube.elementType
  }
}
