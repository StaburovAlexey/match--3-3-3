import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export interface CubeGeometryConfig {
  axis: number
  segments: number
  radius: number
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
  ) {
    super(
      new RoundedBoxGeometry(
        cubeGeometry.axis,
        cubeGeometry.axis,
        cubeGeometry.axis,
        cubeGeometry.segments,
        cubeGeometry.radius,
      ),
      material,
    )
    this.pieceId = pieceId
    this.cubeGeometry = cubeGeometry
  }
}
