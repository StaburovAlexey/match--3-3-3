import * as THREE from 'three'
import type { ElementType, SpecialType } from '../../../core/model/Element.ts'
import { elementTypes } from '../../../core/model/Element.ts'
import { textureLoader } from '../loaders/TextureLoader.ts'
import type { CrackRenderMode } from './CrackRenderMode.ts'
import { applyProceduralCracks, type CrackUniforms } from './ProceduralCracks.ts'
import {
  crackPalettes,
  elementCrackSettings,
  specialCrackSettings,
  type TransformCrack,
} from './CrackMaterialConfig.ts'

const crackHighlightSpeed = 2

export class CubeMaterialRegistry {
  private readonly baseMaterials = new Map<ElementType, THREE.MeshMatcapMaterial>()
  private readonly specialMaterials = new Map<string, THREE.MeshMatcapMaterial>()
  private readonly crackUniforms = new Set<CrackUniforms>()
  private readonly crackMode: CrackRenderMode

  constructor(crackMode: CrackRenderMode = 'static') {
    this.crackMode = crackMode
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
    const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * crackHighlightSpeed))
    this.crackUniforms.forEach((uniforms) => {
      uniforms.uCrackPulse.value = pulse
    })
  }

  dispose(): void {
    const materials = new Set([...this.baseMaterials.values(), ...this.specialMaterials.values()])
    materials.forEach((material) => material.dispose())
    this.baseMaterials.clear()
    this.specialMaterials.clear()
    this.crackUniforms.clear()
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
    if (this.crackMode === 'static') {
      const uniforms = applyProceduralCracks(material, {
        ...settings,
        color: new THREE.Color(palette.crackColor),
        fillColor: new THREE.Color(palette.fillColor),
        highlightColor: new THREE.Color(palette.highlightColor),
      })
      this.crackUniforms.add(uniforms)
    }
    return material
  }
}
