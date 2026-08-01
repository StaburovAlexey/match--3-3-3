export const elementTypes = ['ice', 'fire', 'earth', 'dark'] as const
export const superElementTypes = ['bomb', 'arrow'] as const

export type ElementType = (typeof elementTypes)[number]
export type SuperElementType = (typeof superElementTypes)[number]
export interface CrackPalette {
  materialColor: number
  crackColor: number
  fillColor: number
  highlightColor: number
}

export type TransformCrack = {
  scale: number
  width: number
  strength: number
  fillStrength: number
  highlightStrength: number
  highlightSpeed: number
  highlightGlow: number
  deformStrength: number
  deformSpeed: number
}
export type CrackPalettes = Record<ElementType | SuperElementType, CrackPalette>
export type SettingCrack = Record<ElementType | SuperElementType, TransformCrack>
export const crackPalettes: CrackPalettes = {
  ice: {
    materialColor: 0x5c92ff,
    crackColor: 0x85deff,
    fillColor: 0x57dbff,
    highlightColor: 0x0008ff,
  },
  fire: {
    materialColor: 0xbe3737,
    crackColor: 0x220c0c,
    fillColor: 0xea6262,
    highlightColor: 0xd75050,
  },
  earth: {
    materialColor: 0xc3bbac,
    crackColor: 0x0b931d,
    fillColor: 0xffe1b8,
    highlightColor: 0x25cb4f,
  },
  dark: {
    materialColor: 0x7a5fb4,
    crackColor: 0x9e42ff,
    fillColor: 0x6528e,
    highlightColor: 0xffffff,
  },
  light: {
    materialColor: 0xffffff,
    crackColor: 0xccd5ff,
    fillColor: 0xfffbf0,
    highlightColor: 0xffffff,
  },
  bomb: {
    materialColor: 0xffb300,
    crackColor: 0x6d4600,
    fillColor: 0xffd54f,
    highlightColor: 0xffffff,
  },
  arrow: {
    materialColor: 0x80deea,
    crackColor: 0x006064,
    fillColor: 0xb2ebf2,
    highlightColor: 0xffffff,
  },
}

export const SettingCrack: SettingCrack = {
  ice: {
    scale: 9.4,
    width: 0.2,
    strength: 0.58,
    fillStrength: 1,
    highlightStrength: 0.8,
    highlightSpeed: 2,
    highlightGlow: 2.8,
    deformStrength: 0.08,
    deformSpeed: 0.8,
  },
  fire: {
    scale: 9.4,
    width: 0.1,
    strength: 0.84,
    fillStrength: 1.5,
    highlightStrength: 0.76,
    highlightSpeed: 2,
    highlightGlow: 4.2,
    deformStrength: 0.06,
    deformSpeed: 1.5,
  },
  earth: {
    scale: 9.4,
    width: 0.2,
    strength: 0.58,
    fillStrength: 1,
    highlightStrength: 1,
    highlightSpeed: 2,
    highlightGlow: 5,
    deformStrength: 0.04,
    deformSpeed: 1.5,
  },
  light: {
    scale: 9.4,
    width: 0.2,
    strength: 0.58,
    fillStrength: 1,
    highlightStrength: 0.8,
    highlightSpeed: 2,
    highlightGlow: 3,
    deformStrength: 0.07,
    deformSpeed: 1,
  },
  dark: {
    scale: 9.4,
    width: 0.2,
    strength: 0.58,
    fillStrength: 1,
    highlightStrength: 0.8,
    highlightSpeed: 2,
    highlightGlow: 2.9,
    deformStrength: 0.1,
    deformSpeed: 0.7,
  },
  bomb: {
    scale: 19.4,
    width: 0.2,
    strength: 0.58,
    fillStrength: 1,
    highlightStrength: 0.8,
    highlightSpeed: 2,
    highlightGlow: 3,
    deformStrength: 1.08,
    deformSpeed: 1,
  },
  arrow: {
    scale: 19.4,
    width: 0.2,
    strength: 0.58,
    fillStrength: 1,
    highlightStrength: 0.8,
    highlightSpeed: 2,
    highlightGlow: 3,
    deformStrength: 1.08,
    deformSpeed: 1,
  },
}
