import * as THREE from 'three'
import {
  elementTypes,
  crackPalettes,
  SettingCrack,
  type ElementType,
} from './ElementMaterialConfig.ts'
export type Cracks = Map<ElementType, CrackUniforms>
export type MaterialsCubesTypes = Map<ElementType, THREE.MeshMatcapMaterial>
import { textureLoader } from './TextureLoader.ts'
import { applyProceduralCracks, type CrackUniforms } from './ProceduralCracks.ts'
export class MaterialsCubes {
  private readonly materials: MaterialsCubesTypes
  private readonly crackUniforms: Cracks
  constructor() {
    this.materials = new Map()
    this.crackUniforms = new Map()
    this.init()
  }
  init() {
    elementTypes.forEach((type) => {
      const palette = crackPalettes[type]
      const material = new THREE.MeshMatcapMaterial({
        matcap: textureLoader.get(type),
        color: palette.materialColor,
        depthTest: true,
        depthWrite: true,
        side: THREE.FrontSide,
      })

      const uniforms = applyProceduralCracks(material, {
        ...SettingCrack[type],
        color: new THREE.Color(palette.crackColor),
        fillColor: new THREE.Color(palette.fillColor),
        highlightColor: new THREE.Color(palette.highlightColor),
      })
      this.materials.set(type, material)
      this.crackUniforms.set(type, uniforms)
    })
  }
  get cracks(): Cracks {
    return this.crackUniforms
  }

  get all(): MaterialsCubesTypes {
    return this.materials
  }
  getMaterialsCube(type: ElementType): THREE.MeshMatcapMaterial {
    const material = this.materials.get(type)
    if (!material) {
      throw new Error(`THREE.MeshMatcapMaterial ${type} not found`)
    }
    return material
  }
}
