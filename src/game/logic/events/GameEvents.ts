import type { Cube } from '../../three/objects/Cube.ts'
import { Emitter } from './Emitter'

export interface CubeEventPayload {
  cube: Cube
}

export interface SwapEventPayload {
  first: Cube
  second: Cube
}

export type IsFieldReady = boolean

export interface GameEventMap {
  'cube-click': CubeEventPayload
  'cube-selected': CubeEventPayload
  'cube-deselected': CubeEventPayload
  'swap-requested': SwapEventPayload
  'swap-rejected': SwapEventPayload
  'field-ready-changed': IsFieldReady
}

export const gameEvents = new Emitter<GameEventMap>()
