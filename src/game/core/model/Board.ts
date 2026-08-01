import type { ElementType, SpecialState } from './Element.ts'

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
  createdSpecial?: {
    piece: BoardPiece
    special: SpecialState
  }
}

export interface MatchResolution {
  groups: MatchGroup[]
  clearedPieces: BoardPiece[]
  createdSpecials: Array<{
    piece: BoardPiece
    special: SpecialState
  }>
}
