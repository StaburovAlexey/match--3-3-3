import * as THREE from 'three'
import type { BoardItem, BoardPiece, GridPosition } from '../../../core/model/Board.ts'
import type { CrackRenderMode } from '../materials/CrackRenderMode.ts'
import { CubeMaterialRegistry } from '../materials/CubeMaterialRegistry.ts'
import { createCubeGeometry, Cube, type CubeGeometryConfig } from './Cube.ts'
import { CubeSpecialIconRenderer } from './CubeSpecialIconRenderer.ts'

export class CubeBoardView {
  private readonly cubeGeometry: CubeGeometryConfig = {
    axis: 0.2,
    segments: 1,
    radius: 0.02,
  }
  private readonly geometry = createCubeGeometry(this.cubeGeometry)
  private readonly step = this.cubeGeometry.axis + 0.05
  private readonly materials: CubeMaterialRegistry
  private readonly group = new THREE.Group()
  private readonly cubesByPieceId = new Map<string, Cube>()
  private readonly specialIcons: CubeSpecialIconRenderer

  constructor(items: readonly BoardItem[], crackMode: CrackRenderMode = 'static') {
    this.materials = new CubeMaterialRegistry(crackMode)
    items.forEach(({ piece, position }) => {
      const cube = new Cube(
        piece.id,
        this.materials.getBase(piece.elementType),
        this.cubeGeometry,
        this.geometry,
      )
      cube.position.copy(this.getLocalPosition(position))
      cube.scale.setScalar(0)
      cube.visible = piece.active
      this.cubesByPieceId.set(piece.id, cube)
      this.group.add(cube)
    })
    const box = new THREE.Box3().setFromObject(this.group)
    this.group.position.sub(box.getCenter(new THREE.Vector3()))
    this.specialIcons = new CubeSpecialIconRenderer(items, this.cubes, this.cubeGeometry.axis)
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

  getWorldPosition(piece: BoardPiece): THREE.Vector3 {
    return this.getCube(piece).getWorldPosition(new THREE.Vector3())
  }

  syncPiece(piece: BoardPiece): void {
    const cube = this.getCube(piece)
    cube.material = piece.special
      ? this.materials.getSpecial(piece.elementType, piece.special.type)
      : this.materials.getBase(piece.elementType)
    cube.visible = piece.active
    this.specialIcons.syncPiece(piece)
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
    this.specialIcons.update()
  }

  dispose(): void {
    this.specialIcons.dispose()
    this.geometry.dispose()
    this.materials.dispose()
    this.group.removeFromParent()
    this.cubesByPieceId.clear()
  }
}
