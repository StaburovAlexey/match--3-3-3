import type { Cube } from '../../three/objects/Cube.ts'
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
  constructor() {
    this.cubesGrid = new Map()
  }

  createGrid(cubes: Cube[]) {
    for (let i = 0; i < cubes.length; i++) {
      const cube: Cube = cubes[i]
      const uuid = crypto.randomUUID()
      const item: ItemGrid = { position: cube.position, cube: cube }
      this.cubesGrid.set(uuid, item)
    }
  }

  get cubes(): Map<string, ItemGrid> {
    return this.cubesGrid
  }
}
