import * as THREE from 'three'
import type { BoardItem, BoardPiece } from '../../../core/model/Board.ts'
import type { SpecialState, SpecialType } from '../../../core/model/Element.ts'
import { textureLoader } from '../loaders/TextureLoader.ts'
import type { Cube } from './Cube.ts'

export type OuterFace =
  'positiveX' | 'negativeX' | 'positiveY' | 'negativeY' | 'positiveZ' | 'negativeZ'

export interface PositionBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

interface SpecialIconOverlay {
  readonly cube: Cube
  readonly faces: Map<OuterFace, THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>
  specialType: SpecialType
}

const outerFaces: readonly OuterFace[] = [
  'positiveX',
  'negativeX',
  'positiveY',
  'negativeY',
  'positiveZ',
  'negativeZ',
]

export function getSpecialIconFaces(
  position: Readonly<THREE.Vector3Like>,
  bounds: Readonly<PositionBounds>,
  tolerance = 0.001,
): OuterFace[] {
  const faces: OuterFace[] = []

  if (Math.abs(position.x - bounds.maxX) <= tolerance) faces.push('positiveX')
  if (Math.abs(position.x - bounds.minX) <= tolerance) faces.push('negativeX')
  if (Math.abs(position.y - bounds.maxY) <= tolerance) faces.push('positiveY')
  if (Math.abs(position.y - bounds.minY) <= tolerance) faces.push('negativeY')
  if (Math.abs(position.z - bounds.maxZ) <= tolerance) faces.push('positiveZ')
  if (Math.abs(position.z - bounds.minZ) <= tolerance) faces.push('negativeZ')

  return faces
}

export function selectVisibleSpecialIconFaces(
  faces: readonly OuterFace[],
  _specialType: SpecialType,
): OuterFace[] {
  return [...faces]
}

export function getSpecialIconFaceRotation(face: OuterFace, special: SpecialState): number {
  return special.type === 'bomb' && face === 'positiveY' ? Math.PI : 0
}

export class CubeSpecialIconRenderer {
  private readonly geometry = new THREE.PlaneGeometry(1, 1)
  private readonly materials: Record<SpecialType, THREE.MeshBasicMaterial>
  private readonly cubesByPieceId: Map<string, Cube>
  private readonly overlays = new Map<string, SpecialIconOverlay>()
  private readonly bounds: PositionBounds
  private readonly faceOffset: number
  private readonly faceTolerance: number

  constructor(items: readonly BoardItem[], cubes: readonly Cube[], cubeAxis: number) {
    this.cubesByPieceId = new Map(cubes.map((cube) => [cube.pieceId, cube]))
    this.bounds = this.createBounds(cubes)
    this.faceOffset = cubeAxis / 2 + 0.004
    this.faceTolerance = cubeAxis * 0.25
    this.materials = {
      bomb: this.createMaterial('special-bomb'),
      lightning: this.createMaterial('special-lightning'),
    }

    items.forEach(({ piece }) => this.syncPiece(piece))
  }

  syncPiece(piece: BoardPiece): void {
    if (!piece.special) {
      this.removeOverlay(piece.id)
      return
    }

    const overlay = this.overlays.get(piece.id) ?? this.createOverlay(piece.id)
    this.applySpecial(overlay, piece.special)
    this.updateOverlay(overlay)
  }

  update(): void {
    this.overlays.forEach((overlay) => this.updateOverlay(overlay))
  }

  dispose(): void {
    Array.from(this.overlays.keys()).forEach((pieceId) => this.removeOverlay(pieceId))
    this.geometry.dispose()
    Object.values(this.materials).forEach((material) => material.dispose())
    this.cubesByPieceId.clear()
  }

  private createMaterial(textureKey: string): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      map: textureLoader.get(textureKey),
      transparent: true,
      alphaTest: 0.01,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.FrontSide,
    })
  }

  private createOverlay(pieceId: string): SpecialIconOverlay {
    const cube = this.cubesByPieceId.get(pieceId)
    if (!cube) throw new Error(`Cube for special icon ${pieceId} not found`)

    const faces = new Map<OuterFace, THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>()

    outerFaces.forEach((face) => {
      const mesh = new THREE.Mesh(this.geometry, this.materials.lightning)
      mesh.name = `special-icon:${pieceId}:${face}`
      mesh.renderOrder = 10
      this.placeOnFace(mesh, face)
      cube.add(mesh)
      faces.set(face, mesh)
    })

    const overlay: SpecialIconOverlay = { cube, faces, specialType: 'lightning' }
    this.overlays.set(pieceId, overlay)
    return overlay
  }

  private applySpecial(overlay: SpecialIconOverlay, special: SpecialState): void {
    overlay.specialType = special.type
    const size =
      special.type === 'bomb'
        ? overlay.cube.cubeGeometry.axis * 0.9
        : overlay.cube.cubeGeometry.axis * 1.15

    overlay.faces.forEach((mesh, face) => {
      mesh.material = this.materials[special.type]
      mesh.scale.setScalar(size)
      this.placeOnFace(mesh, face)
      mesh.rotateZ(getSpecialIconFaceRotation(face, special))
    })
  }

  private updateOverlay(overlay: SpecialIconOverlay): void {
    const visibleFaces = new Set(
      selectVisibleSpecialIconFaces(
        getSpecialIconFaces(overlay.cube.position, this.bounds, this.faceTolerance),
        overlay.specialType,
      ),
    )
    overlay.faces.forEach((mesh, face) => {
      mesh.visible = visibleFaces.has(face)
    })
  }

  private placeOnFace(
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>,
    face: OuterFace,
  ): void {
    mesh.rotation.set(0, 0, 0)

    switch (face) {
      case 'positiveX':
        mesh.position.set(this.faceOffset, 0, 0)
        mesh.rotation.y = Math.PI / 2
        break
      case 'negativeX':
        mesh.position.set(-this.faceOffset, 0, 0)
        mesh.rotation.y = -Math.PI / 2
        break
      case 'positiveY':
        mesh.position.set(0, this.faceOffset, 0)
        mesh.rotation.x = -Math.PI / 2
        break
      case 'negativeY':
        mesh.position.set(0, -this.faceOffset, 0)
        mesh.rotation.x = Math.PI / 2
        break
      case 'positiveZ':
        mesh.position.set(0, 0, this.faceOffset)
        break
      case 'negativeZ':
        mesh.position.set(0, 0, -this.faceOffset)
        mesh.rotation.y = Math.PI
        break
    }
  }

  private removeOverlay(pieceId: string): void {
    const overlay = this.overlays.get(pieceId)
    if (!overlay) return
    overlay.faces.forEach((mesh) => mesh.removeFromParent())
    this.overlays.delete(pieceId)
  }

  private createBounds(cubes: readonly Cube[]): PositionBounds {
    if (cubes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 }
    }

    return cubes.reduce<PositionBounds>(
      (bounds, cube) => ({
        minX: Math.min(bounds.minX, cube.position.x),
        maxX: Math.max(bounds.maxX, cube.position.x),
        minY: Math.min(bounds.minY, cube.position.y),
        maxY: Math.max(bounds.maxY, cube.position.y),
        minZ: Math.min(bounds.minZ, cube.position.z),
        maxZ: Math.max(bounds.maxZ, cube.position.z),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
        minZ: Number.POSITIVE_INFINITY,
        maxZ: Number.NEGATIVE_INFINITY,
      },
    )
  }
}
