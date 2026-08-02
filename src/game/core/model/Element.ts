export const elementTypes = ['ice', 'fire', 'earth', 'dark', 'light'] as const
export const specialTypes = ['bomb', 'lightning'] as const

export type ElementType = (typeof elementTypes)[number]
export type SpecialType = (typeof specialTypes)[number]

export interface SpecialState {
  type: SpecialType
}
