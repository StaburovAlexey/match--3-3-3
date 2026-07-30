import type { Cube } from '../../three/objects/Cube.ts'
import { Emitter } from './Emitter'

export interface CubeEventPayload {
  cube: Cube
}
export type IsFieldReady = boolean

export interface GameEventMap {
  'cube-click': CubeEventPayload
  'cube-selected': CubeEventPayload
  'field-ready-changed': IsFieldReady
}

export const gameEvents = new Emitter<GameEventMap>()
