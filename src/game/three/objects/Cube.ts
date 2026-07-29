import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ElementType } from '../materials/ElementMaterialConfig.ts'

export interface CubeGeometryConfig {
  axis: number
  segments: number
  radius: number
}

export class Cube extends THREE.Mesh<THREE.BufferGeometry, THREE.MeshMatcapMaterial> {
  readonly elementType: ElementType
  readonly cubeGeometry: CubeGeometryConfig
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
}
