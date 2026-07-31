import { gsap } from 'gsap'
import { elementTypes } from '../materials/ElementMaterialConfig.ts'
import type { GridPosition } from '../objects/Cube.ts'
import GroupCubes from '../objects/groupCubes.ts'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import CubesGrid from '../../logic/core/cubesGrid.ts'
import type { ItemGrid } from '../../logic/core/cubesGrid.ts'

interface GridSlot {
  cube: ItemGrid['cube']
  position: GridPosition
}

export class CubeRefillAnimator {
  private readonly unsubscribe: () => void
  private readonly grid: CubesGrid
  private readonly cubesGroup: GroupCubes
  private timeline: gsap.core.Timeline | null = null
  private readonly fallDuration = 0.6
  private readonly spawnScaleDelay = 0.2
  private readonly spawnScaleDuration = 0.35

  constructor(grid: CubesGrid, cubesGroup: GroupCubes) {
    this.grid = grid
    this.cubesGroup = cubesGroup
    this.unsubscribe = gameEvents.on('matches-cleared', this.handleMatchesCleared)
  }

  private handleMatchesCleared = (): void => {
    if (this.timeline) {
      return
    }

    gameEvents.emit('field-ready-changed', false)

    const affectedCubes = new Set<GridSlot['cube']>()
    const timeline = gsap.timeline({
      onComplete: () => {
        this.timeline = null
        gameEvents.emit('field-refilled', {
          cubes: Array.from(affectedCubes),
        })
      },
      onInterrupt: () => {
        this.timeline = null
        gameEvents.emit('field-ready-changed', true)
      },
    })

    this.timeline = timeline

    this.getColumns().forEach((slots) => {
      this.refillColumn(slots, affectedCubes, timeline)
    })
  }

  private getColumns(): GridSlot[][] {
    const columns = new Map<string, GridSlot[]>()

    this.grid.items.forEach((item) => {
      const position = { ...item.position }
      const key = `${position.x}:${position.z}`
      const column = columns.get(key) ?? []

      column.push({
        cube: item.cube,
        position,
      })
      columns.set(key, column)
    })

    return Array.from(columns.values()).map((column) =>
      column.sort((first, second) => first.position.y - second.position.y),
    )
  }

  private refillColumn(
    slots: GridSlot[],
    affectedCubes: Set<GridSlot['cube']>,
    timeline: gsap.core.Timeline,
  ): void {
    const visibleSlots = slots
      .filter(({ cube }) => cube.visible)
      .sort((first, second) => first.position.y - second.position.y)
    const targetSlots = [...slots].sort((first, second) => first.position.y - second.position.y)

    visibleSlots.forEach(({ cube, position }, index) => {
      const target = targetSlots[index].position

      if (this.samePosition(position, target)) {
        return
      }

      affectedCubes.add(cube)
      this.grid.moveCube(cube, target)
      this.animateFall(cube, target, timeline)
    })

    const emptySlots = targetSlots.slice(visibleSlots.length)
    const hiddenCubes = slots.filter(({ cube }) => !cube.visible)
    const highestY = targetSlots[targetSlots.length - 1].position.y

    hiddenCubes.forEach(({ cube }, index) => {
      const target = emptySlots[index]?.position

      if (!target) {
        return
      }

      affectedCubes.add(cube)
      this.grid.moveCube(cube, target)
      const type = this.getRandomElementType()
      cube.setElement(type, this.cubesGroup.getMaterial(type))
      cube.visible = true
      cube.scale.setScalar(0)
      this.cubesGroup.setLocalPosition(cube, {
        x: target.x,
        y: highestY + 1,
        z: target.z,
      })

      timeline
        .to(
          cube.position,
          {
            x: this.cubesGroup.getLocalPosition(target).x,
            y: this.cubesGroup.getLocalPosition(target).y,
            z: this.cubesGroup.getLocalPosition(target).z,
            duration: this.fallDuration,
            ease: 'power2.out',
          },
          0,
        )
        .to(
          cube.scale,
          {
            x: 1,
            y: 1,
            z: 1,
            duration: this.spawnScaleDuration,
            ease: 'back.out(1.4)',
          },
          this.spawnScaleDelay,
        )
    })
  }

  private animateFall(
    cube: GridSlot['cube'],
    target: GridPosition,
    timeline: gsap.core.Timeline,
  ): void {
    const targetPosition = this.cubesGroup.getLocalPosition(target)

    timeline.to(
      cube.position,
      {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: this.fallDuration,
        ease: 'power2.out',
      },
      0,
    )
  }

  private getRandomElementType(): (typeof elementTypes)[number] {
    return elementTypes[Math.floor(Math.random() * elementTypes.length)]
  }

  private samePosition(first: GridPosition, second: GridPosition): boolean {
    return first.x === second.x && first.y === second.y && first.z === second.z
  }

  destroy(): void {
    this.unsubscribe()
    this.timeline?.kill()
    this.timeline = null
  }
}
