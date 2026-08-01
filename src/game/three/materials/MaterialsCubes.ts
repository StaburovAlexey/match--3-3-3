import * as THREE from 'three'
import {
  elementTypes,
  crackPalettes,
  SettingCrack,
  type ElementType,
  type SuperElementType,
} from './ElementMaterialConfig.ts'
export type Cracks = Map<string, CrackUniforms>
export type MaterialsCubesTypes = Map<ElementType, THREE.MeshMatcapMaterial>
type SpecialMaterialsCubesTypes = Map<string, THREE.MeshMatcapMaterial>
import { textureLoader } from '../loaders/TextureLoader.ts'
import { applyProceduralCracks, type CrackUniforms } from './ProceduralCracks.ts'
export class MaterialsCubes {
  private readonly materials: MaterialsCubesTypes
  private readonly specialMaterials: SpecialMaterialsCubesTypes
  private readonly crackUniforms: Cracks
  constructor() {
    this.materials = new Map()
    this.specialMaterials = new Map()
    this.crackUniforms = new Map()
    this.init()
  }
  init() {
    elementTypes.forEach((type) => {
      const { material, uniforms } = this.createMaterial(type, type)
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

  getSpecialMaterial(
    elementType: ElementType,
    specialType: SuperElementType,
  ): THREE.MeshMatcapMaterial {
    const key = `${elementType}:${specialType}`
    const existingMaterial = this.specialMaterials.get(key)

    if (existingMaterial) {
      return existingMaterial
    }

    const { material, uniforms } = this.createMaterial(elementType, specialType)
    this.specialMaterials.set(key, material)
    this.crackUniforms.set(key, uniforms)
    return material
  }

  private createMaterial(
    elementType: ElementType,
    settingsType: ElementType | SuperElementType,
  ): { material: THREE.MeshMatcapMaterial; uniforms: CrackUniforms } {
    const palette = crackPalettes[elementType]
    const material = new THREE.MeshMatcapMaterial({
      matcap: textureLoader.get(elementType),
      color: palette.materialColor,
      depthTest: true,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    const uniforms = applyProceduralCracks(material, {
      ...SettingCrack[settingsType],
      color: new THREE.Color(palette.crackColor),
      fillColor: new THREE.Color(palette.fillColor),
      highlightColor: new THREE.Color(palette.highlightColor),
    })

    return { material, uniforms }
  }
}
