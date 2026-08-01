import type { ArrowOrientation, Cube, MatchDirection } from '../../three/objects/Cube.ts'
import type { ElementType, SuperElementType } from '../../three/materials/ElementMaterialConfig.ts'
import { Emitter } from './Emitter'

export interface CubeEventPayload {
  cube: Cube
}

export interface SwapEventPayload {
  first: Cube
  second: Cube
}

export interface MatchGroup {
  elementType: ElementType
  direction: MatchDirection
  startCube: Cube
  cubes: Cube[]
  specialCube?: Cube
  specialType?: SuperElementType
  specialOrientation?: ArrowOrientation
}

export interface MatchesEventPayload {
  matches: MatchGroup[]
}

export interface RefillEventPayload {
  cubes: Cube[]
}

export interface BoardRebuildEventPayload {
  reason: 'deadlock' | 'manual'
}

export type IsFieldReady = boolean

export interface GameEventMap {
  'cube-click': CubeEventPayload
  'cube-selected': CubeEventPayload
  'cube-deselected': CubeEventPayload
  'swap-requested': SwapEventPayload
  'swap-rejected': SwapEventPayload
  'swap-completed': SwapEventPayload
  'matches-found': MatchesEventPayload
  'matches-cleared': undefined
  'field-refilled': RefillEventPayload
  'board-rebuild-requested': BoardRebuildEventPayload
  'field-ready-changed': IsFieldReady
}

export const gameEvents = new Emitter<GameEventMap>()
