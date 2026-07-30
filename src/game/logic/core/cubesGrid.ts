import type { Cube } from '../../three/objects/Cube.ts'
import { gameEvents } from '../events/GameEvents.ts'
import type { CubeEventPayload } from '../events/GameEvents.ts'
interface PositionItemGrid {
  x: number
  y: number
  z: number
}

interface ItemGrid {
  cube: Cube
  position: PositionItemGrid
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
      const uuid = crypto.randomUUID()
      cube.setUuid(uuid)
      const item: ItemGrid = { position: cube.position, cube: cube }
      this.cubesGrid.set(uuid, item)
    }
  }

  get cubes(): Map<string, ItemGrid> {
    return this.cubesGrid
  }
  destroy(): void {
    this.unsubscribe()
  }
}
