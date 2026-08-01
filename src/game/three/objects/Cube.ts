import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ElementType, SuperElementType } from '../materials/ElementMaterialConfig.ts'

export interface CubeGeometryConfig {
  axis: number
  segments: number
  radius: number
}

export interface GridPosition {
  x: number
  y: number
  z: number
}

export type MatchDirection = 'x' | 'y' | 'z'
export type ArrowOrientation = 'horizontal' | 'vertical'

export class Cube extends THREE.Mesh<THREE.BufferGeometry, THREE.MeshMatcapMaterial> {
  public elementType: ElementType
  private specialType: SuperElementType | null = null
  private specialOrientation: ArrowOrientation | null = null
  private specialVisual: THREE.Group | null = null
  readonly cubeGeometry: CubeGeometryConfig
  private gridPosition!: GridPosition
  private uuidGrid: string = ''
  constructor(
    type: ElementType,
    material: THREE.MeshMatcapMaterial,
    cubeGeometry: CubeGeometryConfig = {
      axis: 0.2,
      segments: 1,
      radius: 0.02,
    },
  ) {
    const geometry = new RoundedBoxGeometry(
      cubeGeometry.axis,
      cubeGeometry.axis,
      cubeGeometry.axis,
      cubeGeometry.segments,
      cubeGeometry.radius,
    )
    super(geometry, material)
    this.cubeGeometry = cubeGeometry
    this.elementType = type
  }
  setUuid(uuid: string) {
    this.uuidGrid = uuid
  }

  setGridPosition(position: GridPosition): void {
    this.gridPosition = position
  }

  setElement(type: ElementType, material: THREE.MeshMatcapMaterial): void {
    this.setSpecialType(null)
    this.elementType = type
    this.material = material
  }

  setSpecialType(type: SuperElementType | null, orientation: ArrowOrientation | null = null): void {
    this.clearSpecialVisual()
    this.specialType = type
    this.specialOrientation = type === 'arrow' ? orientation : null

    if (!type || type === 'arrow') {
      return
    }

    const visual = new THREE.Group()
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd54f,
      depthTest: false,
      depthWrite: false,
    })
    const markerSize = this.cubeGeometry.axis
    const bomb = new THREE.Mesh(new THREE.SphereGeometry(markerSize * 0.25, 10, 8), material)
    visual.add(bomb)

    visual.renderOrder = 2
    this.add(visual)
    this.specialVisual = visual
  }

  get getSpecialType(): SuperElementType | null {
    return this.specialType
  }

  get getSpecialOrientation(): ArrowOrientation | null {
    return this.specialOrientation
  }

  private clearSpecialVisual(): void {
    if (!this.specialVisual) {
      return
    }

    this.specialVisual.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return
      }

      object.geometry.dispose()
      const material = object.material
      material.dispose()
    })
    this.specialVisual.removeFromParent()
    this.specialVisual = null
  }

  get positionOnGrid(): GridPosition {
    return this.gridPosition
  }

  get getUuidGrid(): string {
    return this.uuidGrid
  }
}
