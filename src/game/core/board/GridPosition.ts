import type { GridPosition, MatchDirection } from '../model/Board.ts'

export interface AxisDirection {
  axis: MatchDirection
  vector: GridPosition
}

export const axisDirections: readonly AxisDirection[] = [
  { axis: 'x', vector: { x: 1, y: 0, z: 0 } },
  { axis: 'y', vector: { x: 0, y: 1, z: 0 } },
  { axis: 'z', vector: { x: 0, y: 0, z: 1 } },
]

export function positionKey(position: GridPosition): string {
  return `${position.x}:${position.y}:${position.z}`
}

export function clonePosition(position: GridPosition): GridPosition {
  return { ...position }
}

export function addPosition(
  position: GridPosition,
  direction: GridPosition,
  multiplier = 1,
): GridPosition {
  return {
    x: position.x + direction.x * multiplier,
    y: position.y + direction.y * multiplier,
    z: position.z + direction.z * multiplier,
  }
}

export function subtractPosition(position: GridPosition, direction: GridPosition): GridPosition {
  return {
    x: position.x - direction.x,
    y: position.y - direction.y,
    z: position.z - direction.z,
  }
}

export function manhattanDistance(first: GridPosition, second: GridPosition): number {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y) + Math.abs(first.z - second.z)
}

export function isSamePosition(first: GridPosition, second: GridPosition): boolean {
  return first.x === second.x && first.y === second.y && first.z === second.z
}

export function isWithinRadius(
  origin: GridPosition,
  candidate: GridPosition,
  radius: number,
): boolean {
  return (
    Math.abs(candidate.x - origin.x) <= radius &&
    Math.abs(candidate.y - origin.y) <= radius &&
    Math.abs(candidate.z - origin.z) <= radius
  )
}
