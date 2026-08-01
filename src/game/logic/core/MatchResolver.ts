import { gameEvents } from '../events/GameEvents.ts'
import type { MatchGroup, RefillEventPayload, SwapEventPayload } from '../events/GameEvents.ts'
import CubesGrid from './cubesGrid.ts'
import MatchFinder from './MatchFinder.ts'
import MatchValidator from './MatchValidator.ts'
import type { ArrowOrientation, Cube, GridPosition } from '../../three/objects/Cube.ts'
import type { SuperElementType } from '../../three/materials/ElementMaterialConfig.ts'

export default class MatchResolver {
  private readonly grid: CubesGrid
  private readonly finder: MatchFinder
  private readonly validator: MatchValidator
  private readonly unsubscribeSwapCompleted: () => void
  private readonly unsubscribeFieldRefilled: () => void

  constructor(grid: CubesGrid) {
    this.grid = grid
    this.finder = new MatchFinder(grid)
    this.validator = new MatchValidator(grid)
    this.unsubscribeSwapCompleted = gameEvents.on('swap-completed', this.handleSwapCompleted)
    this.unsubscribeFieldRefilled = gameEvents.on('field-refilled', this.handleFieldRefilled)
  }

  private handleSwapCompleted = ({ first, second }: SwapEventPayload): void => {
    this.emitMatches(this.enrichMatches(this.finder.findMatchesFrom([first, second])))
  }

  private handleFieldRefilled = ({ cubes }: RefillEventPayload): void => {
    const matches = this.enrichMatches(this.finder.findMatchesFrom(cubes))

    if (matches.length > 0) {
      this.emitMatches(matches)
      return
    }

    if (!this.validator.hasAvailableSwap()) {
      gameEvents.emit('board-rebuild-requested', { reason: 'deadlock' })
      return
    }

    this.emitMatches([])
  }

  private emitMatches(matches: MatchGroup[]): void {
    gameEvents.emit('matches-found', { matches })
  }

  private enrichMatches(matches: MatchGroup[]): MatchGroup[] {
    const enrichedMatches = matches.map((group) => ({
      ...group,
      cubes: [...group.cubes],
    }))
    const activatedSpecials = new Set<Cube>()
    const specialQueue: Cube[] = []

    enrichedMatches.forEach((group) => {
      group.cubes.forEach((cube) => {
        if (cube.getSpecialType) {
          specialQueue.push(cube)
        }
      })

      if (group.cubes.length === 4 || group.cubes.length === 5) {
        const hasExistingSpecial = group.cubes.some((cube) => cube.getSpecialType)

        if (!hasExistingSpecial) {
          group.specialCube = group.startCube
          group.specialType = group.cubes.length === 4 ? 'arrow' : 'bomb'
          group.specialOrientation =
            group.specialType === 'arrow'
              ? group.direction === 'y'
                ? 'vertical'
                : 'horizontal'
              : undefined
        }
      }
    })

    while (specialQueue.length > 0) {
      const specialCube = specialQueue.shift()

      if (!specialCube || activatedSpecials.has(specialCube)) {
        continue
      }

      activatedSpecials.add(specialCube)
      const ownerGroup = enrichedMatches.find((group) => group.cubes.includes(specialCube))

      if (!ownerGroup) {
        continue
      }

      this.getSpecialEffectCubes(
        specialCube,
        specialCube.getSpecialType,
        specialCube.getSpecialOrientation,
      ).forEach((cube) => {
        if (!ownerGroup.cubes.includes(cube)) {
          ownerGroup.cubes.push(cube)
        }

        if (cube.getSpecialType && !activatedSpecials.has(cube)) {
          specialQueue.push(cube)
        }
      })
    }

    return enrichedMatches
  }

  private getSpecialEffectCubes(
    cube: Cube,
    type: SuperElementType | null,
    orientation: ArrowOrientation | null,
  ): Cube[] {
    if (!type) {
      return []
    }

    const position = this.grid.getGridPosition(cube)

    if (!position) {
      return []
    }

    return type === 'arrow'
      ? orientation
        ? this.getArrowSegmentCubes(position, orientation)
        : []
      : this.getOuterFaceCubes(position)
  }

  private getArrowSegmentCubes(position: GridPosition, orientation: ArrowOrientation): Cube[] {
    const result = new Set<Cube>()

    this.grid.items.forEach(({ cube, position: candidate }) => {
      const isInSegment =
        orientation === 'vertical' ? candidate.x === position.x : candidate.y === position.y

      if (cube.visible && isInSegment) {
        result.add(cube)
      }
    })

    return Array.from(result)
  }

  private getOuterFaceCubes(position: GridPosition): Cube[] {
    const bounds = this.getGridBounds()
    const result = new Set<Cube>()
    const onXFace = this.isBoundary(position.x, bounds.x)
    const onYFace = this.isBoundary(position.y, bounds.y)
    const onZFace = this.isBoundary(position.z, bounds.z)

    this.grid.items.forEach(({ cube, position: candidate }) => {
      if (
        cube.visible &&
        ((onXFace && candidate.x === position.x) ||
          (onYFace && candidate.y === position.y) ||
          (onZFace && candidate.z === position.z))
      ) {
        result.add(cube)
      }
    })

    return Array.from(result)
  }

  private getGridBounds(): { x: [number, number]; y: [number, number]; z: [number, number] } {
    const positions = this.grid.items.map(({ position }) => position)

    return {
      x: this.getBoundsForAxis(positions.map(({ x }) => x)),
      y: this.getBoundsForAxis(positions.map(({ y }) => y)),
      z: this.getBoundsForAxis(positions.map(({ z }) => z)),
    }
  }

  private getBoundsForAxis(values: number[]): [number, number] {
    return [Math.min(...values), Math.max(...values)]
  }

  private isBoundary(value: number, bounds: [number, number]): boolean {
    return value === bounds[0] || value === bounds[1]
  }

  destroy(): void {
    this.unsubscribeSwapCompleted()
    this.unsubscribeFieldRefilled()
  }
}
