// SelectionController.ts

import { gameEvents } from '../events/GameEvents.ts'
import type { CubeEventPayload, IsFieldReady } from '../events/GameEvents.ts'
import type { Cube } from '../../three/objects/Cube.ts'
import CubesGrid from './cubesGrid.ts'
import MatchValidator from './MatchValidator.ts'

export class SelectionController {
  private readonly unsubscribeCubeClick: () => void
  private readonly unsubscribeCreateField: () => void
  private readonly grid: CubesGrid
  private readonly matchValidator: MatchValidator
  private isDoneField = false
  private selectedCube: Cube | null = null

  constructor(grid: CubesGrid) {
    this.grid = grid
    this.matchValidator = new MatchValidator(grid)
    this.unsubscribeCubeClick = gameEvents.on('cube-click', this.handleCubeClick)
    this.unsubscribeCreateField = gameEvents.on('field-ready-changed', this.handlerFieldReady)
  }

  private handleCubeClick = (cube: CubeEventPayload): void => {
    if (!this.isDoneField) {
      return
    }

    if (this.selectedCube === cube.cube) {
      gameEvents.emit('cube-deselected', cube)
      this.selectedCube = null
      return
    }

    if (this.selectedCube) {
      const firstCube = this.selectedCube

      if (this.grid.areAdjacent(firstCube, cube.cube)) {
        if (!this.matchValidator.canSwap(firstCube, cube.cube)) {
          gameEvents.emit('swap-rejected', {
            first: firstCube,
            second: cube.cube,
          })
          return
        }

        this.selectedCube = null
        gameEvents.emit('swap-requested', {
          first: firstCube,
          second: cube.cube,
        })
        return
      }

      gameEvents.emit('cube-deselected', { cube: firstCube })
    }

    this.selectedCube = cube.cube
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
