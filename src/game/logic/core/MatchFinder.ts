import type { Cube, GridPosition } from '../../three/objects/Cube.ts'
import type { MatchGroup } from '../events/GameEvents.ts'
import CubesGrid from './cubesGrid.ts'

const directions: GridPosition[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
]

export default class MatchFinder {
  private readonly grid: CubesGrid

  constructor(grid: CubesGrid) {
    this.grid = grid
  }

  findMatchesFrom(cubes: readonly Cube[]): MatchGroup[] {
    const queue = [...cubes]
    const seedCubes = new Set(cubes)
    const checkedCubes = new Set<Cube>()
    const lines: Cube[][] = []
    const lineKeys = new Set<string>()

    while (queue.length > 0) {
      const cube = queue.shift()

      if (!cube || checkedCubes.has(cube)) {
        continue
      }

      checkedCubes.add(cube)

      if (!cube.visible) {
        continue
      }

      const position = this.grid.getGridPosition(cube)

      if (!position) {
        continue
      }

      for (const direction of directions) {
        const start = this.findLineStart(position, direction, cube.elementType)
        const line = this.collectLine(start, direction, cube.elementType)
        const lineKey = line.map((lineCube) => lineCube.getUuidGrid).join('|')

        if (line.length >= 3 && !lineKeys.has(lineKey)) {
          lineKeys.add(lineKey)
          lines.push(line)
          line.forEach((lineCube) => {
            if (!checkedCubes.has(lineCube)) {
              queue.push(lineCube)
            }
          })
        }
      }
    }

    return this.createMatchGroups(lines, seedCubes)
  }

  private createMatchGroups(lines: Cube[][], seedCubes: Set<Cube>): MatchGroup[] {
    const groups: Array<{ elementType: Cube['elementType']; cubes: Set<Cube>; startCube: Cube }> =
      []

    lines.forEach((line) => {
      const matchingGroups = groups.filter((group) => line.some((cube) => group.cubes.has(cube)))

      if (matchingGroups.length === 0) {
        groups.push({
          elementType: line[0].elementType,
          cubes: new Set(line),
          startCube: this.getStartCube(line, seedCubes),
        })
        return
      }

      const firstGroup = matchingGroups[0]
      line.forEach((cube) => firstGroup.cubes.add(cube))

      matchingGroups.slice(1).forEach((group) => {
        group.cubes.forEach((cube) => firstGroup.cubes.add(cube))

        if (seedCubes.has(group.startCube)) {
          firstGroup.startCube = group.startCube
        }

        const groupIndex = groups.indexOf(group)
        groups.splice(groupIndex, 1)
      })
    })

    return groups.map((group) => ({
      elementType: group.elementType,
      startCube: group.startCube,
      cubes: this.orderGroupCubes(group.cubes, group.startCube),
    }))
  }

  private getStartCube(line: Cube[], seedCubes: Set<Cube>): Cube {
    return line.find((cube) => seedCubes.has(cube)) ?? line[0]
  }

  private orderGroupCubes(cubes: Set<Cube>, startCube: Cube): Cube[] {
    const ordered: Cube[] = []
    const queue: Cube[] = [startCube]
    const remaining = new Set(cubes)

    while (queue.length > 0) {
      const cube = queue.shift()

      if (!cube || !remaining.has(cube)) {
        continue
      }

      remaining.delete(cube)
      ordered.push(cube)

      const position = this.grid.getGridPosition(cube)

      if (!position) {
        continue
      }

      const neighbors = Array.from(remaining).filter((candidate) => {
        const candidatePosition = this.grid.getGridPosition(candidate)

        if (!candidatePosition) {
          return false
        }

        return (
          Math.abs(position.x - candidatePosition.x) +
            Math.abs(position.y - candidatePosition.y) +
            Math.abs(position.z - candidatePosition.z) ===
          1
        )
      })

      neighbors.sort((first, second) => this.comparePositions(first, second))
      queue.push(...neighbors)
    }

    return ordered
  }

  private comparePositions(first: Cube, second: Cube): number {
    const firstPosition = this.grid.getGridPosition(first)
    const secondPosition = this.grid.getGridPosition(second)

    if (!firstPosition || !secondPosition) {
      return 0
    }

    return (
      firstPosition.x - secondPosition.x ||
      firstPosition.y - secondPosition.y ||
      firstPosition.z - secondPosition.z
    )
  }

  private findLineStart(
    origin: GridPosition,
    direction: GridPosition,
    elementType: Cube['elementType'],
  ): GridPosition {
    let position = { ...origin }

    while (true) {
      const previousPosition = {
        x: position.x - direction.x,
        y: position.y - direction.y,
        z: position.z - direction.z,
      }
      const previousCube = this.grid.getCubeAt(previousPosition)

      if (!previousCube || !previousCube.visible || previousCube.elementType !== elementType) {
        return position
      }

      position = previousPosition
    }
  }

  private collectLine(
    origin: GridPosition,
    direction: GridPosition,
    elementType: Cube['elementType'],
  ): Cube[] {
    const originCube = this.grid.getCubeAt(origin)

    if (!originCube || !originCube.visible || originCube.elementType !== elementType) {
      return []
    }

    const cubes: Cube[] = [originCube]
    let position = {
      x: origin.x + direction.x,
      y: origin.y + direction.y,
      z: origin.z + direction.z,
    }

    while (true) {
      const cube = this.grid.getCubeAt(position)

      if (!cube || !cube.visible || cube.elementType !== elementType) {
        return cubes
      }

      cubes.push(cube)
      position = {
        x: position.x + direction.x,
        y: position.y + direction.y,
        z: position.z + direction.z,
      }
    }
  }
}
