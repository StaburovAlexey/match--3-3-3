import * as THREE from 'three'
import { elementTypes } from '../materials/ElementMaterialConfig.ts'
import { Cube, type CubeGeometryConfig } from './Cube.ts'
import { MaterialsCubes, type Cracks } from '../materials/MaterialsCubes.ts'
export default class GroupCubes {
  private readonly cubeGeometry: CubeGeometryConfig = {
    axis: 0.2,
    segments: 1,
    radius: 0.02,
  }
  private readonly gap = 0.05
  private readonly step = this.cubeGeometry.axis + this.gap
  private readonly size = 4
  private readonly materials: MaterialsCubes
  private readonly crackUniforms: Cracks
  private readonly group: THREE.Group
  private cubes: Cube[] = []

  constructor() {
    this.materials = new MaterialsCubes()
    this.crackUniforms = this.materials.cracks
    this.group = new THREE.Group()
    this.init()
  }

  private init(): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        for (let z = 0; z < this.size; z++) {
          const isOuter =
            x === 0 ||
            x === this.size - 1 ||
            y === 0 ||
            y === this.size - 1 ||
            z === 0 ||
            z === this.size - 1

          if (isOuter) {
            const type = elementTypes[Math.floor(Math.random() * elementTypes.length)]
            const material = this.materials.getMaterialsCube(type)
            const cube = new Cube(type, material, this.cubeGeometry)
            cube.setGridPosition({ x, y, z })
            cube.position.set((x - 1) * this.step, y * this.step, (z - 1) * this.step)
            cube.scale.setScalar(0)
            this.cubes.push(cube)
            this.group.add(cube)
          }
        }
      }
    }

    const box = new THREE.Box3().setFromObject(this.group)
    const centerGroup = box.getCenter(new THREE.Vector3())
    this.group.position.sub(centerGroup)
  }

  get object(): THREE.Group {
    return this.group
  }

  get cracks(): Cracks {
    return this.crackUniforms
  }

  get getCubes(): Cube[] {
    return this.cubes
  }
}
