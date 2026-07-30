// SelectionController.ts

import { gameEvents } from '../events/GameEvents.ts'
import type { CubeEventPayload, IsFieldReady } from '../events/GameEvents.ts'

export class SelectionController {
  private readonly unsubscribeCubeClick: () => void
  private readonly unsubscribeCreateField: () => void
  private isDoneField = false
  constructor() {
    this.unsubscribeCubeClick = gameEvents.on('cube-click', this.handleCubeClick)
    this.unsubscribeCreateField = gameEvents.on('field-ready-changed', this.handlerFieldReady)
  }

  private handleCubeClick = (cube: CubeEventPayload): void => {
    if (!this.isDoneField) {
      return
    }
    gameEvents.emit('cube-selected', cube)
  }
  private handlerFieldReady = (value: IsFieldReady): void => {
    this.isDoneField = value
  }
  destroy(): void {
    this.unsubscribeCubeClick()
    this.unsubscribeCreateField()
  }
}
