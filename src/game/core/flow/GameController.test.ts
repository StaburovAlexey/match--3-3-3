import { describe, expect, it, vi } from 'vitest'
import { BoardGrid } from '../board/BoardGrid.ts'
import { BoardRefillPlanner } from '../board/BoardRefillPlanner.ts'
import { PlayableBoardGenerator } from '../board/PlayableBoardGenerator.ts'
import { RandomElementSource } from '../board/RandomElementSource.ts'
import { MatchFinder } from '../match/MatchFinder.ts'
import { MatchResolver } from '../match/MatchResolver.ts'
import { MatchValidator } from '../match/MatchValidator.ts'
import { SpecialEffectResolver } from '../match/SpecialEffectResolver.ts'
import type { AbilityPlan } from '../ability/AbilityPlanner.ts'
import type { AbilityEffect } from '../ability/AbilityCommand.ts'
import type { BoardItem } from '../model/Board.ts'
import type { GamePresentation } from './GamePresentation.ts'
import { GameController } from './GameController.ts'

let abilitySequence = 0

function beginAbility(controller: GameController, effect: AbilityEffect): void {
  abilitySequence += 1
  expect(
    controller.beginAbility({
      activationId: `test-activation-${abilitySequence}`,
      characterId: 'test-character',
      abilityId: `test-ability-${abilitySequence}`,
      effect,
    }),
  ).toMatchObject({ status: 'accepted' })
}

describe('GameController', () => {
  it('при rebuild не запускает поиск и анимацию match', async () => {
    const items: BoardItem[] = Array.from({ length: 4 }, (_, x) => ({
      piece: {
        id: `piece-${x}`,
        elementType: 'dark',
        special: null,
        active: true,
      },
      position: { x, y: 0, z: 0 },
    }))
    const grid = new BoardGrid(items)
    const validator = new MatchValidator(grid)
    const elements = new RandomElementSource(() => 0)
    const calls: string[] = []
    const completed = async () => 'completed' as const
    const presentation: GamePresentation = {
      spawn: vi.fn(async () => {
        calls.push('spawn')
        return completed()
      }),
      select: vi.fn(),
      deselect: vi.fn(),
      animateRejectedSwap: vi.fn(completed),
      animateSwap: vi.fn(completed),
      animateMatches: vi.fn(completed),
      animateRefill: vi.fn(completed),
      previewAbility: vi.fn(completed),
      clearAbilityPreview: vi.fn(),
      animateAbility: vi.fn(completed),
      hideForRebuild: vi.fn(async () => {
        calls.push('hide')
        return completed()
      }),
      showAfterRebuild: vi.fn(async () => {
        calls.push('show')
        return completed()
      }),
      syncPieces: vi.fn(() => calls.push('sync')),
    }
    const controller = new GameController(
      grid,
      validator,
      new MatchResolver(new MatchFinder(grid), new SpecialEffectResolver(grid)),
      new BoardRefillPlanner(grid, elements),
      new PlayableBoardGenerator(grid, validator, elements, 0),
      presentation,
    )

    await controller.start()
    await controller.requestRebuild()

    expect(calls).toEqual(['spawn', 'hide', 'sync', 'show'])
    expect(presentation.animateMatches).not.toHaveBeenCalled()
    expect(controller.phase).toBe('idle')
    expect(validator.hasAvailableSwap()).toBe(true)
  })

  it('показывает rejected-анимацию без изменения модели', async () => {
    const items: BoardItem[] = [
      {
        piece: { id: 'first', elementType: 'ice', special: null, active: true },
        position: { x: 0, y: 0, z: 0 },
      },
      {
        piece: { id: 'second', elementType: 'fire', special: null, active: true },
        position: { x: 1, y: 0, z: 0 },
      },
    ]
    const grid = new BoardGrid(items)
    const validator = new MatchValidator(grid)
    const elements = new RandomElementSource(() => 0)
    const completed = async () => 'completed' as const
    const presentation: GamePresentation = {
      spawn: vi.fn(completed),
      select: vi.fn(),
      deselect: vi.fn(),
      animateRejectedSwap: vi.fn(completed),
      animateSwap: vi.fn(completed),
      animateMatches: vi.fn(completed),
      animateRefill: vi.fn(completed),
      previewAbility: vi.fn(completed),
      clearAbilityPreview: vi.fn(),
      animateAbility: vi.fn(completed),
      hideForRebuild: vi.fn(completed),
      showAfterRebuild: vi.fn(completed),
      syncPieces: vi.fn(),
    }
    const controller = new GameController(
      grid,
      validator,
      new MatchResolver(new MatchFinder(grid), new SpecialEffectResolver(grid)),
      new BoardRefillPlanner(grid, elements),
      new PlayableBoardGenerator(grid, validator, elements, 0),
      presentation,
    )

    await controller.start()
    await controller.handlePieceClick('first')
    await controller.handlePieceClick('second')

    expect(presentation.animateRejectedSwap).toHaveBeenCalledOnce()
    expect(presentation.animateSwap).not.toHaveBeenCalled()
    expect(grid.getPieceAt({ x: 0, y: 0, z: 0 })?.id).toBe('first')
    expect(grid.getPieceAt({ x: 1, y: 0, z: 0 })?.id).toBe('second')
    expect(controller.phase).toBe('idle')
  })

  it('применяет способность только после завершения её анимации', async () => {
    const items: BoardItem[] = [
      {
        piece: { id: 'first', elementType: 'ice', special: null, active: true },
        position: { x: 0, y: 0, z: 0 },
      },
      {
        piece: { id: 'second', elementType: 'fire', special: null, active: true },
        position: { x: 3, y: 0, z: 0 },
      },
    ]
    const grid = new BoardGrid(items)
    const validator = new MatchValidator(grid)
    const elements = new RandomElementSource(() => 0)
    const completed = async () => 'completed' as const
    const presentation: GamePresentation = {
      spawn: vi.fn(completed),
      select: vi.fn(),
      deselect: vi.fn(),
      animateRejectedSwap: vi.fn(completed),
      animateSwap: vi.fn(completed),
      animateMatches: vi.fn(completed),
      animateRefill: vi.fn(completed),
      previewAbility: vi.fn(completed),
      clearAbilityPreview: vi.fn(),
      animateAbility: vi.fn(completed),
      hideForRebuild: vi.fn(completed),
      showAfterRebuild: vi.fn(completed),
      syncPieces: vi.fn(),
    }
    const controller = new GameController(
      grid,
      validator,
      new MatchResolver(new MatchFinder(grid), new SpecialEffectResolver(grid)),
      new BoardRefillPlanner(grid, elements),
      new PlayableBoardGenerator(grid, validator, elements, 0),
      presentation,
    )

    await controller.start()
    beginAbility(controller, { type: 'swap' })
    await controller.handlePieceClick('first')
    await controller.handlePieceClick('second')
    expect(grid.getPieceAt({ x: 0, y: 0, z: 0 })?.id).toBe('first')

    await expect(controller.confirmAbility()).resolves.toMatchObject({ status: 'applied' })

    expect(grid.getPieceAt({ x: 0, y: 0, z: 0 })?.id).toBe('second')
    expect(grid.getPieceAt({ x: 3, y: 0, z: 0 })?.id).toBe('first')
    expect(presentation.animateAbility).toHaveBeenCalledOnce()
    expect(controller.phase).toBe('idle')
  })

  it('не применяет план, если анимация способности отменена', async () => {
    const items: BoardItem[] = [
      {
        piece: { id: 'first', elementType: 'ice', special: null, active: true },
        position: { x: 0, y: 0, z: 0 },
      },
      {
        piece: { id: 'second', elementType: 'fire', special: null, active: true },
        position: { x: 1, y: 0, z: 0 },
      },
    ]
    const grid = new BoardGrid(items)
    const validator = new MatchValidator(grid)
    const elements = new RandomElementSource(() => 0)
    const completed = async () => 'completed' as const
    const presentation: GamePresentation = {
      spawn: vi.fn(completed),
      select: vi.fn(),
      deselect: vi.fn(),
      animateRejectedSwap: vi.fn(completed),
      animateSwap: vi.fn(completed),
      animateMatches: vi.fn(completed),
      animateRefill: vi.fn(completed),
      previewAbility: vi.fn(completed),
      clearAbilityPreview: vi.fn(),
      animateAbility: vi.fn(async () => 'cancelled' as const),
      hideForRebuild: vi.fn(completed),
      showAfterRebuild: vi.fn(completed),
      syncPieces: vi.fn(),
    }
    const controller = new GameController(
      grid,
      validator,
      new MatchResolver(new MatchFinder(grid), new SpecialEffectResolver(grid)),
      new BoardRefillPlanner(grid, elements),
      new PlayableBoardGenerator(grid, validator, elements, 0),
      presentation,
    )

    await controller.start()
    beginAbility(controller, { type: 'convert', elementType: 'light', targetCount: 1 })
    await controller.handlePieceClick('first')

    await expect(controller.confirmAbility()).resolves.toMatchObject({ status: 'cancelled' })

    expect(items[0].piece.elementType).toBe('ice')
    expect(controller.phase).toBe('idle')
  })

  it('сначала выделяет сегмент, а повторными кликами плавно меняет угол', async () => {
    const items: BoardItem[] = Array.from({ length: 27 }, (_, index) => {
      const x = index % 3
      const y = Math.floor(index / 3) % 3
      const z = Math.floor(index / 9)
      return {
        piece: { id: `${x}:${y}:${z}`, elementType: 'ice', special: null, active: true },
        position: { x, y, z },
      }
    })
    const grid = new BoardGrid(items)
    const validator = new MatchValidator(grid)
    const elements = new RandomElementSource(() => 0)
    const completed = async () => 'completed' as const
    let pendingPreview: Promise<'completed'> | null = null
    const pendingPreviewControl: { resolve: (() => void) | null } = { resolve: null }
    const previewAbility = vi.fn(
      (_plan: AbilityPlan, mode: 'selection' | 'rotation' = 'rotation') => {
        if (mode === 'rotation' && pendingPreview) return pendingPreview
        return completed()
      },
    )
    const presentation: GamePresentation = {
      spawn: vi.fn(completed),
      select: vi.fn(),
      deselect: vi.fn(),
      animateRejectedSwap: vi.fn(completed),
      animateSwap: vi.fn(completed),
      animateMatches: vi.fn(completed),
      animateRefill: vi.fn(completed),
      previewAbility,
      clearAbilityPreview: vi.fn(),
      animateAbility: vi.fn(completed),
      hideForRebuild: vi.fn(completed),
      showAfterRebuild: vi.fn(completed),
      syncPieces: vi.fn(),
    }
    const controller = new GameController(
      grid,
      validator,
      new MatchResolver(new MatchFinder(grid), new SpecialEffectResolver(grid)),
      new BoardRefillPlanner(grid, elements),
      new PlayableBoardGenerator(grid, validator, elements, 0),
      presentation,
    )

    await controller.start()
    beginAbility(controller, {
      type: 'rotateSegment',
      orientation: 'horizontal',
      pattern: 'single',
      oppositeRotation: false,
    })
    await controller.handlePieceClick('1:0:1')
    pendingPreview = new Promise((resolve) => {
      pendingPreviewControl.resolve = () => resolve('completed')
    })
    await controller.handlePieceClick('1:0:1')
    await controller.handlePieceClick('1:0:1')
    expect(previewAbility).toHaveBeenCalledTimes(2)
    pendingPreviewControl.resolve?.()
    await pendingPreview
    await Promise.resolve()
    pendingPreview = null

    await controller.handlePieceClick('1:0:1')

    const previewCalls = vi.mocked(presentation.previewAbility).mock.calls
    expect(previewCalls).toHaveLength(3)
    expect(previewCalls[0]?.[0].command).toMatchObject({
      type: 'rotateSegment',
      axis: 'y',
      segments: [{ coordinate: 0, quarterTurns: 0, direction: 1 }],
    })
    expect(previewCalls[0]?.[1]).toBe('selection')
    expect(previewCalls[1]?.[0].command).toMatchObject({
      segments: [{ coordinate: 0, quarterTurns: 1, direction: 1 }],
    })
    expect(previewCalls[1]?.[1]).toBe('rotation')
    expect(previewCalls[2]?.[0].command).toMatchObject({
      segments: [{ coordinate: 0, quarterTurns: 2, direction: 1 }],
    })
    expect(previewCalls[2]?.[1]).toBe('rotation')

    await controller.handlePieceClick('1:0:1')
    await controller.handlePieceClick('1:0:1')

    const cycleCalls = vi.mocked(presentation.previewAbility).mock.calls
    expect(cycleCalls[3]?.[0].command).toMatchObject({
      segments: [{ coordinate: 0, quarterTurns: 3, direction: 1 }],
    })
    expect(cycleCalls[4]?.[0].command).toMatchObject({
      segments: [{ coordinate: 0, quarterTurns: 0, direction: 1 }],
    })

    controller.cancelAbility()
    beginAbility(controller, {
      type: 'rotateSegment',
      orientation: 'horizontal',
      pattern: 'single',
      oppositeRotation: false,
    })
    await controller.handlePieceClick('0:0:0')
    await controller.handlePieceClick('0:0:0')
    await expect(controller.confirmAbility()).resolves.toMatchObject({ status: 'applied' })
    expect(grid.getPosition(grid.getPieceById('0:0:0')!)).toEqual({ x: 0, y: 0, z: 2 })

    controller.cancelAbility()
    beginAbility(controller, {
      type: 'rotateSegment',
      orientation: 'vertical',
      pattern: 'single',
      oppositeRotation: false,
    })
    expect(controller.selectCameraSegmentSide('z')).toBe(true)
    await controller.handlePieceClick('1:0:1')

    let latestCall = vi.mocked(presentation.previewAbility).mock.lastCall
    expect(latestCall?.[0].command).toMatchObject({ axis: 'x' })

    expect(controller.selectCameraSegmentSide('x')).toBe(true)
    await controller.handlePieceClick('1:0:1')
    latestCall = vi.mocked(presentation.previewAbility).mock.lastCall
    expect(latestCall?.[0].command).toMatchObject({ axis: 'x' })

    controller.cancelAbility()
    beginAbility(controller, {
      type: 'rotateSegment',
      orientation: 'horizontal',
      pattern: 'centerOrEdges',
      oppositeRotation: false,
    })
    await controller.handlePieceClick('1:1:1')
    latestCall = vi.mocked(presentation.previewAbility).mock.lastCall
    expect(latestCall?.[0].command).toMatchObject({
      segments: [
        { coordinate: 1, quarterTurns: 0, direction: 1 },
        { coordinate: 2, quarterTurns: 0, direction: 1 },
      ],
    })
    await controller.handlePieceClick('1:2:1')
    latestCall = vi.mocked(presentation.previewAbility).mock.lastCall
    expect(latestCall?.[0].command).toMatchObject({
      segments: [
        { coordinate: 1, quarterTurns: 1, direction: 1 },
        { coordinate: 2, quarterTurns: 1, direction: 1 },
      ],
    })

    controller.cancelAbility()
    beginAbility(controller, {
      type: 'rotateSegment',
      orientation: 'horizontal',
      pattern: 'adjacent',
      oppositeRotation: false,
    })
    await controller.handlePieceClick('1:2:1')
    latestCall = vi.mocked(presentation.previewAbility).mock.lastCall
    expect(latestCall?.[0].command).toMatchObject({
      segments: [
        { coordinate: 1, quarterTurns: 0, direction: 1 },
        { coordinate: 2, quarterTurns: 0, direction: 1 },
      ],
    })
    await controller.handlePieceClick('1:1:1')
    latestCall = vi.mocked(presentation.previewAbility).mock.lastCall
    expect(latestCall?.[0].command).toMatchObject({
      segments: [
        { coordinate: 1, quarterTurns: 1, direction: 1 },
        { coordinate: 2, quarterTurns: 1, direction: 1 },
      ],
    })

    await controller.handlePieceClick('1:0:1')
    latestCall = vi.mocked(presentation.previewAbility).mock.lastCall
    expect(latestCall?.[0].command).toMatchObject({
      segments: [
        { coordinate: 0, quarterTurns: 0, direction: 1 },
        { coordinate: 1, quarterTurns: 0, direction: 1 },
      ],
    })

    controller.cancelAbility()
    beginAbility(controller, {
      type: 'rotateSegment',
      orientation: 'horizontal',
      pattern: 'gap',
      oppositeRotation: false,
    })
    await controller.handlePieceClick('1:2:1')
    latestCall = vi.mocked(presentation.previewAbility).mock.lastCall
    expect(latestCall?.[0].command).toMatchObject({
      segments: [
        { coordinate: 0, quarterTurns: 0, direction: 1 },
        { coordinate: 2, quarterTurns: 0, direction: 1 },
      ],
    })
    await controller.handlePieceClick('1:0:1')
    latestCall = vi.mocked(presentation.previewAbility).mock.lastCall
    expect(latestCall?.[0].command).toMatchObject({
      segments: [
        { coordinate: 0, quarterTurns: 1, direction: 1 },
        { coordinate: 2, quarterTurns: 1, direction: 1 },
      ],
    })
    await expect(controller.confirmAbility()).resolves.toMatchObject({ status: 'applied' })
    expect(grid.getPosition(grid.getPieceById('0:2:1')!)).toEqual({ x: 1, y: 2, z: 2 })
  })
})
