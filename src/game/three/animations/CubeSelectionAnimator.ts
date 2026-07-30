import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { CubeEventPayload } from '../../logic/events/GameEvents.ts'
import type { Cube } from '../objects/Cube.ts'
import { CubeShakeAnimator } from './CubeShakeAnimator.ts'

export class CubeSelectionAnimator {
  private readonly unsubscribeSelected: () => void
  private readonly unsubscribeDeselected: () => void
  private readonly shakeAnimator: CubeShakeAnimator
  private selectedCube: Cube | null = null

  constructor(shakeAnimator: CubeShakeAnimator) {
    this.shakeAnimator = shakeAnimator
    this.unsubscribeSelected = gameEvents.on('cube-selected', this.handleCubeSelected)
    this.unsubscribeDeselected = gameEvents.on('cube-deselected', this.handleCubeDeselected)
  }

  private handleCubeSelected = ({ cube }: CubeEventPayload): void => {
    if (this.selectedCube && this.selectedCube !== cube) {
      this.deselect(this.selectedCube)
    }

    this.selectedCube = cube
    this.select(cube)
  }

  private handleCubeDeselected = ({ cube }: CubeEventPayload): void => {
    if (this.selectedCube !== cube) {
      return
    }

    this.deselect(cube)
    this.selectedCube = null
  }

  private select(cube: Cube): void {
    this.shakeAnimator.startLoop(cube, 0.08)
  }

  private deselect(cube: Cube): void {
    this.shakeAnimator.stop(cube)
  }

  destroy(): void {
    this.unsubscribeSelected()
    this.unsubscribeDeselected()

    if (this.selectedCube) {
      this.deselect(this.selectedCube)
      this.selectedCube = null
    }
  }
}
