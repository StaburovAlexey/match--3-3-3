import type { Cube, GridPosition } from '../../three/objects/Cube.ts'
import { gameEvents } from '../events/GameEvents.ts'
import type { CubeEventPayload } from '../events/GameEvents.ts'

interface ItemGrid {
  cube: Cube
  position: GridPosition
}

export default class CubesGrid {
  private cubesGrid: Map<string, ItemGrid>
  private unsubscribe: () => void
  constructor() {
    this.unsubscribe = gameEvents.on('cube-selected', this.cubeClick)
    this.cubesGrid = new Map()
  }
  private cubeClick = ({ cube }: CubeEventPayload): void => {
    const gridItem = this.cubesGrid.get(cube.getUuidGrid)
    if (gridItem) {
      console.log('нашел в грид', gridItem)
    }
  }
  createGrid(cubes: Cube[]) {
    for (let i = 0; i < cubes.length; i++) {
      const cube: Cube = cubes[i]
      const { x, y, z } = cube.positionOnGrid
      const uuid = `${x}:${y}:${z}`
      cube.setUuid(uuid)
      const item: ItemGrid = {
        position: cube.positionOnGrid,
        cube,
      }
      this.cubesGrid.set(uuid, item)
    }
  }

  areAdjacent(first: Cube, second: Cube): boolean {
    const firstItem = this.cubesGrid.get(first.getUuidGrid)
    const secondItem = this.cubesGrid.get(second.getUuidGrid)

    if (!firstItem || !secondItem) {
      return false
    }

    const firstPosition = firstItem.position
    const secondPosition = secondItem.position
    const distance =
      Math.abs(firstPosition.x - secondPosition.x) +
      Math.abs(firstPosition.y - secondPosition.y) +
      Math.abs(firstPosition.z - secondPosition.z)

    return distance === 1
  }

  getCubeAt(position: GridPosition): Cube | null {
    for (const item of this.cubesGrid.values()) {
      if (
        item.position.x === position.x &&
        item.position.y === position.y &&
        item.position.z === position.z
      ) {
        return item.cube
      }
    }

    return null
  }

  getGridPosition(cube: Cube): GridPosition | null {
    return this.cubesGrid.get(cube.getUuidGrid)?.position ?? null
  }

  swap(first: Cube, second: Cube): void {
    const firstItem = this.cubesGrid.get(first.getUuidGrid)
    const secondItem = this.cubesGrid.get(second.getUuidGrid)

    if (!firstItem || !secondItem) {
      return
    }

    const firstPosition = firstItem.position
    firstItem.position = secondItem.position
    secondItem.position = firstPosition
    first.setGridPosition(firstItem.position)
    second.setGridPosition(secondItem.position)
  }

  get cubes(): Map<string, ItemGrid> {
    return this.cubesGrid
  }
  destroy(): void {
    this.unsubscribe()
  }
}
