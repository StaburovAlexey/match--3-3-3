import { BoardGrid } from '../board/BoardGrid.ts'
import { BoardRefillPlanner } from '../board/BoardRefillPlanner.ts'
import { PlayableBoardGenerator } from '../board/PlayableBoardGenerator.ts'
import type {
  AbilityCommand,
  AbilityDefinition,
  SegmentOrientation,
} from '../ability/AbilityCommand.ts'
import {
  parseAbilityActivationRequest,
  type AbilityActivationRequest,
  type AbilityBeginResult,
  type AbilityCancelledResult,
  type AbilityConfirmResult,
  type AbilityInteractionState,
  type AbilityRejectedResult,
  type AbilityStateListener,
  type AbilityTerminalResult,
} from '../ability/AbilityContract.ts'
import { AbilityPlanner, type AbilityPlan } from '../ability/AbilityPlanner.ts'
import { MatchResolver } from '../match/MatchResolver.ts'
import { MatchValidator } from '../match/MatchValidator.ts'
import { MatchStreakRewardHandler } from '../match/MatchStreakRewardHandler.ts'
import type { BoardPiece, MatchDirection, MatchResolution } from '../model/Board.ts'
import type { AnimationResult, GamePresentation } from './GamePresentation.ts'

export interface BoardTurnResolution {
  resolutions: MatchResolution[]
  rewardMultipliers: number[]
}

export type GameTurnResolution =
  ({ type: 'board' } & BoardTurnResolution) | { type: 'ability'; abilityId: string }

export interface GameControllerOptions {
  onTurnResolved?: (event: GameTurnResolution) => void
}

export type GamePhase =
  | 'spawning'
  | 'idle'
  | 'swapping'
  | 'clearing'
  | 'refilling'
  | 'rebuilding'
  | 'disposed'
  | 'abilitySelecting'
  | 'abilityExecuting'

export class GameController {
  private currentPhase: GamePhase = 'spawning'
  private selectedPiece: BoardPiece | null = null
  private readonly grid: BoardGrid
  private readonly validator: MatchValidator
  private readonly matches: MatchResolver
  private readonly refill: BoardRefillPlanner
  private readonly generator: PlayableBoardGenerator
  private readonly presentation: GamePresentation
  private readonly abilities: AbilityPlanner
  private activeAbilityRequest: AbilityActivationRequest | null = null
  private abilityDefinition: AbilityDefinition | null = null
  private readonly abilityPieceIds = new Set<string>()
  private rotateSegmentCoordinate: number | null = null
  private rotateSegmentTurns: 0 | 1 | 2 | 3 = 0
  private rotateAxis: MatchDirection = 'y'
  private rotatePlan: AbilityPlan | null = null
  private rotatePreviewPromise: Promise<AnimationResult> | null = null
  private abilityExecutionPromise: Promise<AbilityConfirmResult> | null = null
  private currentAbilityError: string | null = null
  private readonly completedActivationIds = new Set<string>()
  private readonly abilityStateListeners = new Set<AbilityStateListener>()
  private readonly reportError: (error: unknown, context: string) => void
  private readonly onTurnResolved: (event: GameTurnResolution) => void

  constructor(
    grid: BoardGrid,
    validator: MatchValidator,
    matches: MatchResolver,
    refill: BoardRefillPlanner,
    generator: PlayableBoardGenerator,
    presentation: GamePresentation,
    reportError: (error: unknown, context: string) => void = () => undefined,
    options: GameControllerOptions = {},
  ) {
    this.grid = grid
    this.validator = validator
    this.matches = matches
    this.refill = refill
    this.generator = generator
    this.presentation = presentation
    this.abilities = new AbilityPlanner(grid)
    this.reportError = reportError
    this.onTurnResolved = options.onTurnResolved ?? (() => undefined)
  }

  get phase(): GamePhase {
    return this.currentPhase
  }

  get abilityState(): AbilityInteractionState {
    return {
      phase:
        this.activeAbilityRequest === null
          ? 'idle'
          : this.currentPhase === 'abilitySelecting'
            ? 'selecting'
            : 'executing',
      request: this.activeAbilityRequest,
      previewBusy: this.rotatePreviewPromise !== null,
      canConfirm: this.canConfirmAbility(),
      error: this.currentAbilityError,
    }
  }

  subscribeAbilityState(listener: AbilityStateListener): () => void {
    this.abilityStateListeners.add(listener)
    listener(this.abilityState)
    return () => this.abilityStateListeners.delete(listener)
  }

  async start(): Promise<void> {
    if (this.currentPhase === 'disposed') return
    this.currentPhase = 'spawning'
    const result = await this.presentation.spawn(this.grid.allPieces)
    if (this.canContinue(result)) this.currentPhase = 'idle'
  }

  async handlePieceClick(pieceId: string): Promise<void> {
    if (this.currentPhase === 'abilitySelecting') {
      if (this.abilityDefinition?.type === 'rotateSegment') {
        this.handleRotateSegmentClick(pieceId)
        return
      }
      this.toggleAbilityPiece(pieceId)
      return
    }

    if (this.currentPhase !== 'idle') return
    const piece = this.grid.getPieceById(pieceId)
    if (!piece?.active) return

    if (this.selectedPiece === piece) {
      this.presentation.deselect(piece)
      this.selectedPiece = null
      return
    }

    if (this.selectedPiece) {
      const first = this.selectedPiece
      if (this.grid.areAdjacent(first, piece)) {
        if (!this.validator.canSwap(first, piece)) {
          this.currentPhase = 'swapping'
          const result = await this.presentation.animateRejectedSwap(first, piece)
          if (this.canContinue(result)) {
            this.presentation.select(first)
            this.currentPhase = 'idle'
          }
          return
        }

        this.selectedPiece = null
        this.currentPhase = 'swapping'
        const result = await this.presentation.animateSwap(first, piece)
        if (!this.canContinue(result)) return
        this.grid.swap(first, piece)
        const resolutions = await this.resolveBoard([first, piece])
        if (resolutions) this.onTurnResolved({ type: 'board', ...resolutions })
        return
      }

      this.presentation.deselect(first)
    }

    this.selectedPiece = piece
    this.presentation.select(piece)
  }

  beginAbility(requestValue: unknown): AbilityBeginResult {
    const parsed = parseAbilityActivationRequest(requestValue)
    if (!parsed.ok) {
      return this.createRejectedResult(requestValue, 'invalid-request', parsed.message)
    }
    const request = parsed.value
    if (
      request.activationId === this.activeAbilityRequest?.activationId ||
      this.completedActivationIds.has(request.activationId)
    ) {
      return this.createRejectedResult(
        request,
        'duplicate-activation',
        'Этот запрос способности уже завершён',
      )
    }
    if (this.currentPhase !== 'idle' || this.activeAbilityRequest) {
      return this.createRejectedResult(request, 'game-busy', 'Игровое поле сейчас занято')
    }
    if (
      request.effect.type === 'convert' &&
      request.effect.targetCount > this.grid.allPieces.filter((piece) => piece.active).length
    ) {
      return this.createRejectedResult(
        request,
        'invalid-request',
        'targetCount превышает количество активных кубов',
      )
    }

    if (this.selectedPiece) {
      this.presentation.deselect(this.selectedPiece)
      this.selectedPiece = null
    }
    this.activeAbilityRequest = request
    this.abilityDefinition = request.effect
    this.presentation.clearAbilityPreview()
    this.abilityPieceIds.clear()
    this.rotateSegmentCoordinate = null
    this.rotateSegmentTurns = 0
    this.rotateAxis = 'y'
    this.rotatePlan = null
    this.rotatePreviewPromise = null
    this.currentAbilityError = null
    this.currentPhase = 'abilitySelecting'
    this.publishAbilityState()
    return { status: 'accepted', request }
  }

  cancelAbility(): AbilityCancelledResult | null {
    if (this.currentPhase !== 'abilitySelecting' || !this.activeAbilityRequest) return null
    const result = this.createCancelledResult(this.activeAbilityRequest, 'player')
    this.clearAbilitySelection()
    this.finalizeAbilitySession()
    return result
  }

  private selectRotateSegmentAxis(axis: MatchDirection): boolean {
    if (
      this.currentPhase !== 'abilitySelecting' ||
      this.abilityDefinition?.type !== 'rotateSegment'
    ) {
      return false
    }
    if (this.rotateAxis === axis) return true

    this.presentation.clearAbilityPreview()
    this.rotateAxis = axis
    this.rotatePlan = null
    this.currentAbilityError = null
    this.rotateSegmentCoordinate = null
    this.rotateSegmentTurns = 0
    this.publishAbilityState()
    return true
  }

  selectCameraSegmentSide(sideAxis: 'x' | 'z'): boolean {
    if (
      this.currentPhase !== 'abilitySelecting' ||
      this.abilityDefinition?.type !== 'rotateSegment'
    ) {
      return false
    }

    if (this.rotateSegmentCoordinate !== null) return true

    const axis = this.getSegmentAxis(this.abilityDefinition.orientation, sideAxis)
    return this.selectRotateSegmentAxis(axis)
  }

  confirmAbility(): Promise<AbilityConfirmResult> {
    if (this.abilityExecutionPromise) return this.abilityExecutionPromise
    const promise = this.executeAbility()
    this.abilityExecutionPromise = promise
    void promise.finally(() => {
      if (this.abilityExecutionPromise === promise) this.abilityExecutionPromise = null
    })
    return promise
  }

  private async executeAbility(): Promise<AbilityConfirmResult> {
    const request = this.activeAbilityRequest
    if (this.currentPhase !== 'abilitySelecting' || !this.abilityDefinition || !request) {
      return {
        status: 'invalid-selection',
        code: 'invalid-selection',
        message: 'Способность не выбрана',
      }
    }

    const previewPromise = this.rotatePreviewPromise
    if (previewPromise) {
      try {
        const previewResult = await previewPromise
        if (previewResult !== 'completed' || this.activeAbilityRequest !== request) {
          return {
            status: 'invalid-selection',
            code: 'invalid-selection',
            message: 'Предпросмотр способности был отменён',
          }
        }
      } catch (error) {
        this.reportError(error, 'ability-preview')
        const message = 'Не удалось завершить предпросмотр способности'
        this.setAbilityError(message)
        return {
          status: 'invalid-selection',
          code: 'invalid-selection',
          message,
        }
      }
    }

    if (this.activeAbilityRequest !== request || this.currentPhase !== 'abilitySelecting') {
      return {
        status: 'invalid-selection',
        code: 'invalid-selection',
        message: 'Сессия способности уже завершена',
      }
    }

    let plan: AbilityPlan
    try {
      plan = this.rotatePlan ?? this.abilities.create(this.createAbilityCommand())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Способность недоступна'
      this.setAbilityError(message)
      return {
        status: 'invalid-selection',
        code: message.includes('поворот') ? 'no-op' : 'invalid-selection',
        message,
      }
    }

    this.clearAbilitySelection(plan.command.type !== 'rotateSegment')
    this.currentPhase = 'abilityExecuting'
    this.publishAbilityState()

    try {
      this.applyAbilityPlan(plan)
      const result = await this.presentation.animateAbility(plan)
      if (result !== 'completed') {
        this.rollbackAbilityPlan(plan)
        const cancelled = this.createCancelledResult(request, 'animation-cancelled')
        this.finalizeAbilitySession()
        return cancelled
      }

      this.presentation.syncPieces(plan.pieces)
      let rebuilt = false
      if (!this.validator.hasAvailableSwap()) {
        rebuilt = await this.rebuildBoard()
      }

      const applied: AbilityTerminalResult = {
        status: 'applied',
        activationId: request.activationId,
        characterId: request.characterId,
        abilityId: request.abilityId,
        affectedPieceIds: plan.pieces.map((piece) => piece.id),
        rebuilt,
      }
      this.onTurnResolved({ type: 'ability', abilityId: request.abilityId })
      this.finalizeAbilitySession()
      return applied
    } catch (error) {
      this.reportError(error, 'ability-execution')
      this.rollbackAbilityPlan(plan)
      this.presentation.clearAbilityPreview()
      const failed: AbilityTerminalResult = {
        status: 'failed',
        activationId: request.activationId,
        characterId: request.characterId,
        abilityId: request.abilityId,
        code: 'execution-failed',
        message: 'Не удалось применить способность',
      }
      this.finalizeAbilitySession()
      return failed
    }
  }

  async requestRebuild(): Promise<void> {
    if (this.currentPhase !== 'idle') return
    await this.rebuildBoard()
  }

  dispose(): void {
    if (this.currentPhase === 'abilitySelecting') this.clearAbilitySelection()
    this.selectedPiece = null
    if (this.activeAbilityRequest) {
      this.completedActivationIds.add(this.activeAbilityRequest.activationId)
    }
    this.activeAbilityRequest = null
    this.abilityDefinition = null
    this.currentPhase = 'disposed'
    this.publishAbilityState()
    this.abilityStateListeners.clear()
  }

  private async resolveBoard(
    seedPieces: readonly BoardPiece[],
  ): Promise<BoardTurnResolution | null> {
    const resolutions: MatchResolution[] = []
    const rewardMultipliers: number[] = []
    const matchStreak = new MatchStreakRewardHandler()
    let resolution = this.matches.resolveFrom(seedPieces)

    while (resolution.groups.length > 0) {
      resolutions.push(resolution)
      const rewardMultiplier = matchStreak.nextMultiplier()
      rewardMultipliers.push(rewardMultiplier)
      this.currentPhase = 'clearing'
      resolution.createdSpecials.forEach(({ piece, special }) => {
        piece.special = { ...special }
      })
      this.presentation.syncPieces(resolution.createdSpecials.map(({ piece }) => piece))

      const clearResult = await this.presentation.animateMatches(resolution, { rewardMultiplier })
      if (!this.canContinue(clearResult)) return null

      const destroyedPieces = resolution.destroyedCubes.map(({ piece }) => piece)
      destroyedPieces.forEach((piece) => {
        piece.active = false
        piece.special = null
      })
      this.presentation.syncPieces(destroyedPieces)

      this.currentPhase = 'refilling'
      const refillPlan = this.refill.createPlan()
      this.grid.reposition(refillPlan.assignments)
      refillPlan.spawns.forEach(({ piece, elementType }) => {
        piece.elementType = elementType
        piece.special = null
        piece.active = true
      })
      this.presentation.syncPieces(refillPlan.spawns.map(({ piece }) => piece))

      const refillResult = await this.presentation.animateRefill(refillPlan)
      if (!this.canContinue(refillResult)) return null
      resolution = this.matches.resolveFrom(refillPlan.affectedPieces)
    }

    if (!this.validator.hasAvailableSwap()) {
      await this.rebuildBoard()
      return { resolutions, rewardMultipliers }
    }

    this.currentPhase = 'idle'
    return { resolutions, rewardMultipliers }
  }

  private async rebuildBoard(): Promise<boolean> {
    this.currentPhase = 'rebuilding'
    if (this.selectedPiece) {
      this.presentation.deselect(this.selectedPiece)
      this.selectedPiece = null
    }

    const pieces = this.grid.allPieces
    try {
      const hideResult = await this.presentation.hideForRebuild(pieces)
      if (!this.canContinue(hideResult)) return false
      this.generator.generate()
      this.presentation.syncPieces(pieces)
      const showResult = await this.presentation.showAfterRebuild(pieces)
      if (!this.canContinue(showResult)) return false
      this.currentPhase = 'idle'
      return true
    } catch (error) {
      this.reportError(error, 'board-rebuild')
      this.presentation.syncPieces(pieces)
      const phase = this.currentPhase as GamePhase
      if (phase !== 'disposed') this.currentPhase = 'idle'
      return false
    }
  }

  private canContinue(result: AnimationResult): boolean {
    return result === 'completed' && this.currentPhase !== 'disposed'
  }

  private toggleAbilityPiece(pieceId: string): void {
    const piece = this.grid.getPieceById(pieceId)
    if (!piece?.active) return

    if (this.abilityPieceIds.has(pieceId)) {
      this.abilityPieceIds.delete(pieceId)
      this.presentation.deselect(piece)
      this.setAbilityError(null)
      return
    }

    const definition = this.abilityDefinition
    const targetCount =
      definition?.type === 'convert' ? definition.targetCount : definition?.type === 'swap' ? 2 : 0
    if (definition?.type === 'convert' && piece.elementType === definition.elementType) {
      this.setAbilityError('Выберите куб другого типа')
      return
    }
    if (targetCount > 0 && this.abilityPieceIds.size >= targetCount) {
      this.setAbilityError(`Можно выбрать только ${targetCount} куб.`)
      return
    }

    this.abilityPieceIds.add(pieceId)
    this.presentation.select(piece)
    this.setAbilityError(null)
  }

  private handleRotateSegmentClick(pieceId: string): void {
    if (this.rotatePreviewPromise) return
    const piece = this.grid.getPieceById(pieceId)
    if (!piece?.active || this.abilityDefinition?.type !== 'rotateSegment') return
    const position = this.grid.getPosition(piece)
    if (!position) return

    const coordinate = this.getAxisCoordinate(position, this.rotateAxis)
    if (this.isCoordinateInSelectedSegments(coordinate)) {
      this.rotateSegmentTurns = this.nextSegmentTurns(this.rotateSegmentTurns)
      this.previewRotateSegmentAbility('rotation')
      this.publishAbilityState()
      return
    }

    this.presentation.clearAbilityPreview()
    this.rotateSegmentCoordinate = coordinate
    this.rotateSegmentTurns = 0
    this.previewRotateSegmentAbility('selection')
    this.publishAbilityState()
  }

  private clearAbilitySelection(clearPreview = true): void {
    if (clearPreview) this.presentation.clearAbilityPreview()
    this.abilityPieceIds.forEach((pieceId) => {
      const piece = this.grid.getPieceById(pieceId)
      if (piece) this.presentation.deselect(piece)
    })
    this.abilityPieceIds.clear()
    this.rotateSegmentCoordinate = null
    this.rotateSegmentTurns = 0
    this.rotateAxis = 'y'
    this.rotatePlan = null
    this.rotatePreviewPromise = null
    this.publishAbilityState()
  }

  private createAbilityCommand(): AbilityCommand {
    if (!this.abilityDefinition) throw new Error('Способность не выбрана')
    const pieceIds = Array.from(this.abilityPieceIds)

    switch (this.abilityDefinition.type) {
      case 'convert':
        if (pieceIds.length !== this.abilityDefinition.targetCount) {
          throw new Error(`Выберите ровно ${this.abilityDefinition.targetCount} куб.`)
        }
        return {
          type: 'convert',
          pieceIds,
          elementType: this.abilityDefinition.elementType,
        }
      case 'swap': {
        if (pieceIds.length !== 2) throw new Error('Выберите ровно два куба')
        const [first, second] = pieceIds
        if (!first || !second) {
          return { type: 'swap', pieceIds: pieceIds as [string, string] }
        }
        return { type: 'swap', pieceIds: [first, second] }
      }
      case 'rotateSegment':
        if (this.rotateSegmentCoordinate === null) throw new Error('Выберите куб сегмента')
        if (this.rotateSegmentTurns === 0) {
          throw new Error('Сделайте хотя бы один поворот сегмента')
        }
        return {
          type: 'rotateSegment',
          axis: this.rotateAxis,
          segments: this.getRotateSegmentTargets().map(({ coordinate, direction }) => ({
            coordinate,
            quarterTurns: this.getRotateSegmentQuarterTurns(),
            direction,
          })),
        }
    }
  }

  private nextSegmentTurns(value: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 {
    return ((value + 1) % 4) as 0 | 1 | 2 | 3
  }

  private getRotateSegmentQuarterTurns(): 0 | 1 | 2 | 3 {
    return this.rotateSegmentTurns
  }

  private getRotateSegmentTargets(): Array<{ coordinate: number; direction: 1 | -1 }> {
    if (this.rotateSegmentCoordinate === null || this.abilityDefinition?.type !== 'rotateSegment') {
      throw new Error('Выберите куб сегмента')
    }

    const baseCoordinate = this.rotateSegmentCoordinate
    const pattern = this.abilityDefinition.pattern
    const availableCoordinates = this.getSegmentCoordinates(this.rotateAxis)
    const selectedCoordinates =
      pattern === 'single'
        ? [baseCoordinate]
        : pattern === 'adjacent'
          ? this.getPairedSegmentCoordinates(baseCoordinate, 1, availableCoordinates)
          : pattern === 'gap'
            ? this.getPairedSegmentCoordinates(baseCoordinate, 2, availableCoordinates)
            : this.getCenterOrEdgeCoordinates(baseCoordinate, availableCoordinates)
    const oppositeRotation = this.abilityDefinition.oppositeRotation
    const uniqueCoordinates = new Set<number>()
    return selectedCoordinates.map((coordinate, index) => {
      if (uniqueCoordinates.has(coordinate)) throw new Error('Сегмент выбран несколько раз')
      uniqueCoordinates.add(coordinate)
      let direction: 1 | -1 = 1
      if (oppositeRotation && selectedCoordinates.length > 1) {
        direction = index % 2 === 0 ? 1 : -1
      }
      return { coordinate, direction }
    })
  }

  private isCoordinateInSelectedSegments(coordinate: number): boolean {
    if (this.rotateSegmentCoordinate === null) return false
    return this.getRotateSegmentTargets().some((target) => target.coordinate === coordinate)
  }

  private getSegmentCoordinates(axis: MatchDirection): number[] {
    return Array.from(
      new Set(
        this.grid.allPieces.flatMap((piece) => {
          const position = this.grid.getPosition(piece)
          return position ? [position[axis]] : []
        }),
      ),
    ).sort((first, second) => first - second)
  }

  private getPairedSegmentCoordinates(
    base: number,
    distance: number,
    available: readonly number[],
  ): number[] {
    const forward = base + distance
    if (available.includes(forward)) return [base, forward]

    const backward = base - distance
    if (available.includes(backward)) return [backward, base]

    throw new Error('Парный сегмент выходит за границы поля')
  }

  private getCenterOrEdgeCoordinates(base: number, coordinates: readonly number[]): number[] {
    if (coordinates.length < 2) throw new Error('Для шаблона нужны минимум два сегмента')

    const edgeCoordinates = [coordinates[0], coordinates[coordinates.length - 1]]
    const middleIndex = Math.floor((coordinates.length - 1) * 0.5)
    const centerCoordinates = [coordinates[middleIndex], coordinates[middleIndex + 1]]
    const isCenterSegment = centerCoordinates.includes(base)
    return isCenterSegment ? centerCoordinates : edgeCoordinates
  }

  private getAxisCoordinate(
    position: { x: number; y: number; z: number },
    axis: MatchDirection,
  ): number {
    return position[axis]
  }

  private getSegmentAxis(orientation: SegmentOrientation, sideAxis: 'x' | 'z'): MatchDirection {
    if (orientation === 'horizontal') return 'y'
    return sideAxis === 'x' ? 'z' : 'x'
  }

  private previewRotateSegmentAbility(mode: 'selection' | 'rotation' = 'rotation'): void {
    if (this.rotateSegmentCoordinate === null || this.abilityDefinition?.type !== 'rotateSegment') {
      return
    }

    try {
      const plan = this.abilities.create({
        type: 'rotateSegment',
        axis: this.rotateAxis,
        segments: this.getRotateSegmentTargets().map(({ coordinate, direction }) => ({
          coordinate,
          quarterTurns: this.getRotateSegmentQuarterTurns(),
          direction,
        })),
      })
      this.rotatePlan = plan
      this.trackRotatePreview(this.presentation.previewAbility(plan, mode))
      this.setAbilityError(null)
    } catch (error) {
      this.rotatePlan = null
      this.setAbilityError(error instanceof Error ? error.message : 'Поворот сегмента недоступен')
    }
  }

  private trackRotatePreview(previewPromise: Promise<AnimationResult>): void {
    let trackedPromise: Promise<AnimationResult>
    trackedPromise = previewPromise.finally(() => {
      if (this.rotatePreviewPromise === trackedPromise) {
        this.rotatePreviewPromise = null
        this.publishAbilityState()
      }
    })
    this.rotatePreviewPromise = trackedPromise
    this.publishAbilityState()
    void trackedPromise.catch(() => {
      if (this.rotatePreviewPromise === trackedPromise) {
        this.rotatePreviewPromise = null
        this.publishAbilityState()
      }
    })
  }

  private canConfirmAbility(): boolean {
    if (this.currentPhase !== 'abilitySelecting' || !this.abilityDefinition) return false
    if (this.rotatePreviewPromise) return false

    switch (this.abilityDefinition.type) {
      case 'convert':
        return this.abilityPieceIds.size === this.abilityDefinition.targetCount
      case 'swap':
        return this.abilityPieceIds.size === 2
      case 'rotateSegment':
        return (
          this.rotateSegmentCoordinate !== null &&
          this.rotateSegmentTurns !== 0 &&
          this.rotatePlan !== null
        )
    }
  }

  private applyAbilityPlan(plan: AbilityPlan): void {
    plan.typeChanges.forEach(({ piece, to }) => {
      piece.elementType = to
    })
    if (plan.positionChanges.length > 0) {
      this.grid.reposition(plan.positionChanges.map(({ piece, to }) => ({ piece, position: to })))
    }
  }

  private rollbackAbilityPlan(plan: AbilityPlan): void {
    plan.typeChanges.forEach(({ piece, from }) => {
      piece.elementType = from
    })
    if (plan.positionChanges.length > 0) {
      this.grid.reposition(
        plan.positionChanges.map(({ piece, from }) => ({ piece, position: from })),
      )
    }
    this.presentation.syncPieces(plan.pieces)
  }

  private setAbilityError(message: string | null): void {
    this.currentAbilityError = message
    this.publishAbilityState()
  }

  private publishAbilityState(): void {
    const state = this.abilityState
    this.abilityStateListeners.forEach((listener) => listener(state))
  }

  private finalizeAbilitySession(): void {
    if (this.activeAbilityRequest) {
      this.completedActivationIds.add(this.activeAbilityRequest.activationId)
    }
    this.activeAbilityRequest = null
    this.abilityDefinition = null
    this.currentAbilityError = null
    if (this.currentPhase !== 'disposed') this.currentPhase = 'idle'
    this.publishAbilityState()
  }

  private createCancelledResult(
    request: AbilityActivationRequest,
    reason: AbilityCancelledResult['reason'],
  ): AbilityCancelledResult {
    return {
      status: 'cancelled',
      activationId: request.activationId,
      characterId: request.characterId,
      abilityId: request.abilityId,
      reason,
    }
  }

  private createRejectedResult(
    value: unknown,
    code: AbilityRejectedResult['code'],
    message: string,
  ): AbilityRejectedResult {
    const record =
      typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
    return {
      status: 'rejected',
      activationId: typeof record.activationId === 'string' ? record.activationId : '',
      characterId: typeof record.characterId === 'string' ? record.characterId : '',
      abilityId: typeof record.abilityId === 'string' ? record.abilityId : '',
      code,
      message,
    }
  }
}
