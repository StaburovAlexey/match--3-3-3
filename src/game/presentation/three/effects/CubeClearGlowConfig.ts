import type { ElementType } from '../../../core/model/Element.ts'

export type CubeClearGlowColors = Record<ElementType, string>

export interface CubeClearGlowConfig {
  duration: number
  fadeDelay: number
  fadeDuration: number
  coreSize: number
  haloSize: number
  endScale: number
  coreOpacity: number
  haloOpacity: number
  coreWhiteMix: number
  arcOutward: number
  endOutward: number
  controlYProgress: number
  endY: number
  colors: CubeClearGlowColors
  alphaTest: number
  depthTest: boolean
  depthWrite: boolean
  additiveBlending: boolean
  toneMapped: boolean
  renderOrderBase: number
}

export function createCubeClearGlowConfig(): CubeClearGlowConfig {
  return {
    duration: 0.71,
    fadeDelay: 1.29,
    fadeDuration: 0.27,
    coreSize: 0.119,
    haloSize: 0.26,
    endScale: 0,
    coreOpacity: 0.77,
    haloOpacity: 1,
    coreWhiteMix: 1,
    arcOutward: 0.95,
    endOutward: -0.01,
    controlYProgress: 0,
    endY: -1.32,
    colors: {
      ice: '#57dbff',
      fire: '#ff5a3d',
      earth: '#45d65a',
      dark: '#8b3dff',
      light: '#fff1a8',
    },
    alphaTest: 0.01,
    depthTest: false,
    depthWrite: false,
    additiveBlending: true,
    toneMapped: false,
    renderOrderBase: 50,
  }
}
