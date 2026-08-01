import * as THREE from 'three'
import type { BoardItem, BoardPiece, GridPosition } from '../../../core/model/Board.ts'
import { CubeMaterialRegistry } from '../materials/CubeMaterialRegistry.ts'
import { Cube, type CubeGeometryConfig } from './Cube.ts'

export class CubeBoardView {
  private readonly cubeGeometry: CubeGeometryConfig = {
    axis: 0.2,
    segments: 1,
    radius: 0.02,
  }
  private readonly step = this.cubeGeometry.axis + 0.05
  private readonly materials = new CubeMaterialRegistry()
  private readonly group = new THREE.Group()
  private readonly cubesByPieceId = new Map<string, Cube>()

  constructor(items: readonly BoardItem[]) {
    items.forEach(({ piece, position }) => {
      const cube = new Cube(piece.id, this.materials.getBase(piece.elementType), this.cubeGeometry)
      cube.position.copy(this.getLocalPosition(position))
      cube.scale.setScalar(0)
      cube.visible = piece.active
      this.cubesByPieceId.set(piece.id, cube)
      this.group.add(cube)
    })
    const box = new THREE.Box3().setFromObject(this.group)
    this.group.position.sub(box.getCenter(new THREE.Vector3()))
  }

  get object(): THREE.Group {
    return this.group
  }

  get cubes(): Cube[] {
    return Array.from(this.cubesByPieceId.values())
  }

  getCube(piece: BoardPiece): Cube {
    const cube = this.cubesByPieceId.get(piece.id)
    if (!cube) throw new Error(`Cube for piece ${piece.id} not found`)
    return cube
  }

  syncPiece(piece: BoardPiece): void {
    const cube = this.getCube(piece)
    cube.material = piece.special
      ? this.materials.getSpecial(piece.elementType, piece.special.type)
      : this.materials.getBase(piece.elementType)
    cube.visible = piece.active
  }

  syncPieces(pieces: readonly BoardPiece[]): void {
    pieces.forEach((piece) => this.syncPiece(piece))
  }

  getLocalPosition(position: GridPosition): THREE.Vector3 {
    return new THREE.Vector3(
      (position.x - 1) * this.step,
      position.y * this.step,
      (position.z - 1) * this.step,
    )
  }

  update(time: number): void {
    this.materials.update(time)
  }

  dispose(): void {
    this.cubes.forEach((cube) => cube.geometry.dispose())
    this.materials.dispose()
    this.group.removeFromParent()
    this.cubesByPieceId.clear()
  }
}
