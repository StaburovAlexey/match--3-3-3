import { gsap } from 'gsap'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { CubeEventPayload } from '../../logic/events/GameEvents.ts'
import type { Cube } from '../objects/Cube.ts'

export class CubeSelectionAnimator {
  private readonly unsubscribeSelected: () => void
  private readonly unsubscribeDeselected: () => void
  private selectedCube: Cube | null = null

  constructor() {
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
    gsap.killTweensOf(cube.rotation)

    gsap
      .timeline({
        repeat: -1,
        repeatRefresh: true,
      })
      .to(cube.rotation, {
        x: () => gsap.utils.random(-0.05, 0.05),
        y: () => gsap.utils.random(-0.025, 0.025),
        z: () => gsap.utils.random(-0.05, 0.05),
        duration: 0.08,
        ease: 'sine.inOut',
      })
      .to(cube.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.06,
        ease: 'power1.out',
      })
  }

  private deselect(cube: Cube): void {
    gsap.killTweensOf(cube.rotation)

    gsap.to(cube.rotation, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.12,
      ease: 'power2.out',
    })
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
