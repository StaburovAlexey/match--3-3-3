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
  private baseMaterial: THREE.MeshMatcapMaterial
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
    this.baseMaterial = material
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
    this.baseMaterial = material
    this.material = material
  }

  setSpecialType(
    type: SuperElementType | null,
    orientation: ArrowOrientation | null = null,
    specialMaterial?: THREE.MeshMatcapMaterial,
  ): void {
    this.specialType = type
    this.specialOrientation = type === 'arrow' ? orientation : null
    this.material = type && specialMaterial ? specialMaterial : this.baseMaterial
  }

  get getSpecialType(): SuperElementType | null {
    return this.specialType
  }

  get getSpecialOrientation(): ArrowOrientation | null {
    return this.specialOrientation
  }

  get positionOnGrid(): GridPosition {
    return this.gridPosition
  }

  get getUuidGrid(): string {
    return this.uuidGrid
  }
}
