import * as THREE from 'three'
import { gsap } from 'gsap'
import { elementTypes } from '../materials/ElementMaterialConfig.ts'
import { Cube, type CubeGeometryConfig } from './Cube.ts'
import { MaterialsCubes, type Cracks } from '../materials/MaterialsCubes.ts'

export default class GroupCubes {
  private readonly timeline: gsap.core.Timeline
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
  private readonly firstDuration = 0.08
  private readonly secondDuration = 0.1

  constructor() {
    this.timeline = gsap.timeline()
    this.materials = new MaterialsCubes()
    this.crackUniforms = this.materials.cracks
    this.group = new THREE.Group()
    this.init()
  }

  private init(): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        for (let z = 0; z < this.size; z++) {
          const type = elementTypes[Math.floor(Math.random() * elementTypes.length)]
          const material = this.materials.getMaterialsCube(type)
          const cube = new Cube(type, material, this.cubeGeometry)

          cube.position.set((x - 1) * this.step, y * this.step, (z - 1) * this.step)
          cube.scale.setScalar(0)
          this.group.add(cube)
        }
      }
    }

    const box = new THREE.Box3().setFromObject(this.group)
    const centerGroup = box.getCenter(new THREE.Vector3())
    this.group.position.sub(centerGroup)

    const children = this.group.children

    children.forEach((child, index) => {
      const startTime = index * this.firstDuration

      this.timeline.to(
        child.scale,
        {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: this.firstDuration,
          ease: 'power2.out',
        },
        startTime,
      )

      if (index > 0) {
        this.timeline.to(
          children[index - 1].scale,
          {
            x: 1,
            y: 1,
            z: 1,
            duration: this.secondDuration,
            ease: 'power2.out',
          },
          startTime,
        )
      }
    })

    const lastChild = children[children.length - 1]

    if (lastChild) {
      this.timeline.to(
        lastChild.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: this.secondDuration,
          ease: 'power2.out',
        },
        children.length * this.firstDuration,
      )
    }
  }

  get object(): THREE.Group {
    return this.group
  }

  get cracks(): Cracks {
    return this.crackUniforms
  }
}
