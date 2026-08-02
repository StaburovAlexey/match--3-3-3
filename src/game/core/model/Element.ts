export const elementTypes = ['ice', 'fire', 'earth', 'dark', 'light'] as const
export const specialTypes = ['bomb', 'arrow'] as const

export type ElementType = (typeof elementTypes)[number]
export type SpecialType = (typeof specialTypes)[number]
export type ArrowOrientation = 'horizontal' | 'vertical'

export interface SpecialState {
  type: SpecialType
  orientation?: ArrowOrientation
}
