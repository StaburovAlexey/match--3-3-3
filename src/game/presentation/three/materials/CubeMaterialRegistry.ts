import * as THREE from 'three'
import type { ElementType, SpecialType } from '../../../core/model/Element.ts'
import { elementTypes } from '../../../core/model/Element.ts'
import { textureLoader } from '../loaders/TextureLoader.ts'
import { applyProceduralCracks, type CrackUniforms } from './ProceduralCracks.ts'
import {
  crackPalettes,
  elementCrackSettings,
  specialCrackSettings,
  type TransformCrack,
} from './CrackMaterialConfig.ts'

export class CubeMaterialRegistry {
  private readonly baseMaterials = new Map<ElementType, THREE.MeshMatcapMaterial>()
  private readonly specialMaterials = new Map<string, THREE.MeshMatcapMaterial>()
  private readonly uniforms = new Set<CrackUniforms>()

  constructor() {
    elementTypes.forEach((type) => {
      this.baseMaterials.set(type, this.createMaterial(type, elementCrackSettings[type]))
    })
  }

  getBase(type: ElementType): THREE.MeshMatcapMaterial {
    const material = this.baseMaterials.get(type)
    if (!material) throw new Error(`Cube material ${type} not found`)
    return material
  }

  getSpecial(type: ElementType, special: SpecialType): THREE.MeshMatcapMaterial {
    const key = `${type}:${special}`
    const existing = this.specialMaterials.get(key)
    if (existing) return existing
    const material = this.createMaterial(type, specialCrackSettings[special])
    this.specialMaterials.set(key, material)
    return material
  }

  update(time: number): void {
    this.uniforms.forEach((uniforms) => {
      uniforms.uCrackTime.value = time
    })
  }

  dispose(): void {
    const materials = new Set([...this.baseMaterials.values(), ...this.specialMaterials.values()])
    materials.forEach((material) => material.dispose())
    this.baseMaterials.clear()
    this.specialMaterials.clear()
    this.uniforms.clear()
  }

  private createMaterial(type: ElementType, settings: TransformCrack): THREE.MeshMatcapMaterial {
    const palette = crackPalettes[type]
    const material = new THREE.MeshMatcapMaterial({
      matcap: textureLoader.get(type),
      color: palette.materialColor,
      depthTest: true,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    this.uniforms.add(
      applyProceduralCracks(material, {
        ...settings,
        color: new THREE.Color(palette.crackColor),
        fillColor: new THREE.Color(palette.fillColor),
        highlightColor: new THREE.Color(palette.highlightColor),
      }),
    )
    return material
  }
}
