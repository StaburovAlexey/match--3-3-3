import type { ElementType, SpecialState, SpecialType } from './Element.ts'

export interface GridPosition {
  x: number
  y: number
  z: number
}

export type MatchDirection = 'x' | 'y' | 'z'

export interface BoardPiece {
  readonly id: string
  elementType: ElementType
  special: SpecialState | null
  active: boolean
}

export interface BoardItem {
  piece: BoardPiece
  position: GridPosition
}

export interface MatchGroup {
  elementType: ElementType
  direction: MatchDirection
  startPiece: BoardPiece
  pieces: BoardPiece[]
  effects?: MatchEffect[]
  createdSpecial?: {
    piece: BoardPiece
    special: SpecialState
  }
}

export interface MatchEffect {
  source: BoardPiece
  type: SpecialType
  orientation?: SpecialState['orientation']
  pieces: BoardPiece[]
}

export interface MatchResolution {
  groups: MatchGroup[]
  clearedPieces: BoardPiece[]
  createdSpecials: Array<{
    piece: BoardPiece
    special: SpecialState
  }>
}
