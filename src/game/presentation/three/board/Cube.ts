import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export interface CubeGeometryConfig {
  axis: number
  segments: number
  radius: number
}

export function createCubeGeometry(config: CubeGeometryConfig): THREE.BufferGeometry {
  return new RoundedBoxGeometry(
    config.axis,
    config.axis,
    config.axis,
    config.segments,
    config.radius,
  )
}

export class Cube extends THREE.Mesh<THREE.BufferGeometry, THREE.MeshMatcapMaterial> {
  readonly pieceId: string
  readonly cubeGeometry: CubeGeometryConfig

  constructor(
    pieceId: string,
    material: THREE.MeshMatcapMaterial,
    cubeGeometry: CubeGeometryConfig = {
      axis: 0.2,
      segments: 1,
      radius: 0.02,
    },
    geometry: THREE.BufferGeometry = createCubeGeometry(cubeGeometry),
  ) {
    super(geometry, material)
    this.pieceId = pieceId
    this.cubeGeometry = cubeGeometry
  }
}
