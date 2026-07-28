import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ElementType } from './ElementMaterialConfig.ts'

export class Cube extends THREE.Mesh<THREE.BufferGeometry, THREE.MeshMatcapMaterial> {
  readonly elementType: ElementType

  constructor(type: ElementType, material: THREE.MeshMatcapMaterial) {
    const cubeGeometry: Record<string, number> = { axis: 0.2, s: 1, r: 0.02 }
    const geometry = new RoundedBoxGeometry(
      cubeGeometry.axis,
      cubeGeometry.axis,
      cubeGeometry.axis,
      cubeGeometry.s,
      cubeGeometry.r,
    )
    super(geometry, material)

    this.elementType = type
  }
}
