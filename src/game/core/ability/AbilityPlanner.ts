import type { BoardPiece, GridPosition } from '../model/Board.ts'
import type { ElementType } from '../model/Element.ts'
import { BoardGrid } from '../board/BoardGrid.ts'
import type { AbilityCommand } from './AbilityCommand.ts'

export interface AbilityTypeChange {
  piece: BoardPiece
  from: ElementType
  to: ElementType
}

export interface AbilityPositionChange {
  piece: BoardPiece
  from: GridPosition
  to: GridPosition
}

export interface AbilityRotationGroup {
  pieces: BoardPiece[]
  positionChanges: AbilityPositionChange[]
  direction: 1 | -1
  quarterTurns: 0 | 1 | 2 | 3
}

export interface AbilityPlan {
  command: AbilityCommand
  typeChanges: AbilityTypeChange[]
  positionChanges: AbilityPositionChange[]
  pieces: BoardPiece[]
  rotationGroups?: AbilityRotationGroup[]
}

export class AbilityPlanner {
  private readonly grid: BoardGrid

  constructor(grid: BoardGrid) {
    this.grid = grid
  }

  create(command: AbilityCommand): AbilityPlan {
    switch (command.type) {
      case 'convert':
        return this.createConvertPlan(command, this.resolvePieces(command.pieceIds))
      case 'swap':
        return this.createSwapPlan(command, this.resolvePieces(command.pieceIds))
      case 'rotateSegment':
        return this.createRotateSegmentPlan(command)
    }
  }

  private createConvertPlan(
    command: Extract<AbilityCommand, { type: 'convert' }>,
    pieces: BoardPiece[],
  ): AbilityPlan {
    const typeChanges = pieces
      .filter((piece) => piece.elementType !== command.elementType)
      .map((piece) => ({ piece, from: piece.elementType, to: command.elementType }))

    if (typeChanges.length === 0) {
      throw new Error('Способность не меняет тип выбранных кубов')
    }

    return { command, typeChanges, positionChanges: [], pieces }
  }

  private createSwapPlan(
    command: Extract<AbilityCommand, { type: 'swap' }>,
    pieces: BoardPiece[],
  ): AbilityPlan {
    if (pieces.length !== 2) {
      throw new Error('Для способности обмена нужно выбрать ровно два куба')
    }

    const first = pieces[0]
    const second = pieces[1]
    const firstPosition = this.requirePosition(first)
    const secondPosition = this.requirePosition(second)

    return {
      command,
      typeChanges: [],
      positionChanges: [
        { piece: first, from: firstPosition, to: secondPosition },
        { piece: second, from: secondPosition, to: firstPosition },
      ],
      pieces,
    }
  }

  private createRotateSegmentPlan(
    command: Extract<AbilityCommand, { type: 'rotateSegment' }>,
  ): AbilityPlan {
    if (command.segments.length === 0) throw new Error('Нужно выбрать хотя бы один сегмент')

    const coordinates = new Set<number>()
    const rotationGroups = command.segments.map((segment) => {
      if (coordinates.has(segment.coordinate)) {
        throw new Error(`Сегмент ${command.axis}${segment.coordinate} выбран несколько раз`)
      }
      coordinates.add(segment.coordinate)
      return this.createSegmentRotationGroup(command, segment)
    })
    const pieces = rotationGroups.flatMap(({ pieces: groupPieces }) => groupPieces)
    const positionChanges = rotationGroups.flatMap(({ positionChanges: changes }) => changes)

    return { command, typeChanges: [], positionChanges, pieces, rotationGroups }
  }

  private createSegmentRotationGroup(
    command: Extract<AbilityCommand, { type: 'rotateSegment' }>,
    segment: Extract<AbilityCommand, { type: 'rotateSegment' }>['segments'][number],
  ): AbilityRotationGroup {
    const positions = this.grid.allPieces
      .map((piece) => ({ piece, position: this.requirePosition(piece) }))
      .filter(
        ({ position }) =>
          this.getPlaneCoordinates(position, command.axis).fixed === segment.coordinate,
      )

    if (positions.length === 0) {
      throw new Error(`Сегмент ${command.axis}${segment.coordinate} не найден`)
    }
    if (positions.some(({ piece }) => !piece.active)) {
      throw new Error(`Сегмент ${command.axis}${segment.coordinate} содержит неактивные кубы`)
    }

    const coordinates = positions.map(({ position }) =>
      this.getPlaneCoordinates(position, command.axis),
    )
    const bounds = {
      minU: Math.min(...coordinates.map(({ u }) => u)),
      maxU: Math.max(...coordinates.map(({ u }) => u)),
      minV: Math.min(...coordinates.map(({ v }) => v)),
      maxV: Math.max(...coordinates.map(({ v }) => v)),
    }

    if (bounds.maxU - bounds.minU !== bounds.maxV - bounds.minV) {
      throw new Error('Сегмент должен быть квадратным')
    }

    const segmentKeys = new Set(positions.map(({ position }) => this.positionKey(position)))
    const positionChanges = positions.map(({ piece, position }) => {
      let target = position
      for (let turn = 0; turn < segment.quarterTurns; turn += 1) {
        target = this.rotatePosition(target, bounds, command.axis, segment.direction)
      }

      if (!segmentKeys.has(this.positionKey(target))) {
        throw new Error('Сегмент нельзя замкнуто повернуть на 90 градусов')
      }
      return { piece, from: position, to: target }
    })

    return {
      pieces: positions.map(({ piece }) => piece),
      positionChanges,
      direction: segment.direction,
      quarterTurns: segment.quarterTurns,
    }
  }

  private resolvePieces(pieceIds: readonly string[]): BoardPiece[] {
    if (pieceIds.length === 0) throw new Error('Нужно выбрать хотя бы один куб')

    const uniqueIds = new Set(pieceIds)
    if (uniqueIds.size !== pieceIds.length) throw new Error('Один куб выбран несколько раз')

    return pieceIds.map((pieceId) => {
      const piece = this.grid.getPieceById(pieceId)
      if (!piece) throw new Error(`Куб ${pieceId} не найден`)
      if (!piece.active) throw new Error(`Куб ${pieceId} неактивен`)
      return piece
    })
  }

  private requirePosition(piece: BoardPiece): GridPosition {
    const position = this.grid.getPosition(piece)
    if (!position) throw new Error(`Координаты куба ${piece.id} не найдены`)
    return position
  }

  private getPlaneCoordinates(
    position: GridPosition,
    axis: 'x' | 'y' | 'z',
  ): { fixed: number; u: number; v: number } {
    switch (axis) {
      case 'x':
        return { fixed: position.x, u: position.y, v: position.z }
      case 'y':
        return { fixed: position.y, u: position.x, v: position.z }
      case 'z':
        return { fixed: position.z, u: position.x, v: position.y }
    }
  }

  private rotatePosition(
    position: GridPosition,
    bounds: { minU: number; minV: number; maxV: number },
    axis: 'x' | 'y' | 'z',
    direction: 1 | -1,
  ): GridPosition {
    const { u, v } = this.getPlaneCoordinates(position, axis)
    const nextU =
      direction === 1 ? bounds.minU + (v - bounds.minV) : bounds.maxV - (v - bounds.minV)
    const nextV =
      direction === 1 ? bounds.maxV - (u - bounds.minU) : bounds.minV + (u - bounds.minU)

    switch (axis) {
      case 'x':
        return { x: position.x, y: nextU, z: nextV }
      case 'y':
        return { x: nextU, y: position.y, z: nextV }
      case 'z':
        return { x: nextU, y: nextV, z: position.z }
    }
  }

  private positionKey(position: GridPosition): string {
    return `${position.x}:${position.y}:${position.z}`
  }
}
