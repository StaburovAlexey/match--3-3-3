import { gsap } from 'gsap'
import { elementTypes, type ElementType } from '../materials/ElementMaterialConfig.ts'
import type { Cube, GridPosition } from '../objects/Cube.ts'
import GroupCubes from '../objects/groupCubes.ts'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { BoardRebuildEventPayload } from '../../logic/events/GameEvents.ts'
import CubesGrid from '../../logic/core/cubesGrid.ts'
import MatchValidator from '../../logic/core/MatchValidator.ts'

const directions: GridPosition[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
]

export class CubeRebuildAnimator {
  private readonly unsubscribe: () => void
  private readonly unsubscribeFieldReady: () => void
  private readonly grid: CubesGrid
  private readonly cubesGroup: GroupCubes
  private readonly validator: MatchValidator
  private isFieldReady = false
  private timeline: gsap.core.Timeline | null = null
  private readonly hideDuration = 0.3
  private readonly showDelay = 0.35
  private readonly showDuration = 0.4

  constructor(grid: CubesGrid, cubesGroup: GroupCubes, validator: MatchValidator) {
    this.grid = grid
    this.cubesGroup = cubesGroup
    this.validator = validator
    this.unsubscribe = gameEvents.on('board-rebuild-requested', this.handleRebuildRequested)
    this.unsubscribeFieldReady = gameEvents.on('field-ready-changed', this.handleFieldReadyChanged)
  }

  private handleFieldReadyChanged = (value: boolean): void => {
    this.isFieldReady = value
  }

  private handleRebuildRequested = ({ reason }: BoardRebuildEventPayload): void => {
    if (this.timeline) {
      return
    }

    if (reason === 'manual' && !this.isFieldReady) {
      return
    }

    const cubes = this.grid.allCubes
    gameEvents.emit('field-ready-changed', false)

    const timeline = gsap.timeline({
      onComplete: () => {
        this.timeline = null
        gameEvents.emit('field-ready-changed', true)
      },
      onInterrupt: () => {
        this.timeline = null
        gameEvents.emit('field-ready-changed', true)
      },
    })

    this.timeline = timeline

    cubes.forEach((cube) => {
      timeline.to(
        cube.scale,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: this.hideDuration,
          ease: 'power2.in',
          onComplete: () => {
            cube.visible = false
          },
        },
        0,
      )
    })

    timeline.call(() => this.generatePlayableBoard(cubes), [], this.hideDuration)

    cubes.forEach((cube) => {
      timeline.to(
        cube.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: this.showDuration,
          ease: 'back.out(1.4)',
          onStart: () => {
            cube.visible = true
          },
        },
        this.showDelay,
      )
    })
  }

  private generatePlayableBoard(cubes: Cube[]): void {
    const maxAttempts = 100

    cubes.forEach((cube) => {
      cube.visible = true
    })

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      this.randomizeTypes(cubes)

      if (this.validator.hasAvailableSwap()) {
        return
      }
    }

    this.applyFallbackMove()
  }

  private randomizeTypes(cubes: Cube[]): void {
    cubes.forEach((cube) => {
      const type = this.getRandomElementType()
      cube.setElement(type, this.cubesGroup.getMaterial(type))
    })
  }

  private applyFallbackMove(): void {
    const line = this.findFourCubeLine()

    if (!line) {
      return
    }

    const [first, second, third, fourth] = line
    const firstType: ElementType = elementTypes[0]
    const secondType: ElementType = elementTypes[1]

    first.setElement(firstType, this.cubesGroup.getMaterial(firstType))
    second.setElement(secondType, this.cubesGroup.getMaterial(secondType))
    third.setElement(firstType, this.cubesGroup.getMaterial(firstType))
    fourth.setElement(firstType, this.cubesGroup.getMaterial(firstType))
  }

  private findFourCubeLine(): [Cube, Cube, Cube, Cube] | null {
    for (const { cube, position } of this.grid.items) {
      for (const direction of directions) {
        const second = this.grid.getCubeAt({
          x: position.x + direction.x,
          y: position.y + direction.y,
          z: position.z + direction.z,
        })
        const third = this.grid.getCubeAt({
          x: position.x + direction.x * 2,
          y: position.y + direction.y * 2,
          z: position.z + direction.z * 2,
        })
        const fourth = this.grid.getCubeAt({
          x: position.x + direction.x * 3,
          y: position.y + direction.y * 3,
          z: position.z + direction.z * 3,
        })

        if (second && third && fourth) {
          return [cube, second, third, fourth]
        }
      }
    }

    return null
  }

  private getRandomElementType(): ElementType {
    return elementTypes[Math.floor(Math.random() * elementTypes.length)]
  }

  destroy(): void {
    this.unsubscribe()
    this.unsubscribeFieldReady()
    this.timeline?.kill()
    this.timeline = null
  }
}
