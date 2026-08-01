import { describe, expect, it, vi } from 'vitest'
import { BoardGrid } from '../board/BoardGrid.ts'
import { BoardRefillPlanner } from '../board/BoardRefillPlanner.ts'
import { PlayableBoardGenerator } from '../board/PlayableBoardGenerator.ts'
import { RandomElementSource } from '../board/RandomElementSource.ts'
import { MatchFinder } from '../match/MatchFinder.ts'
import { MatchResolver } from '../match/MatchResolver.ts'
import { MatchValidator } from '../match/MatchValidator.ts'
import { SpecialEffectResolver } from '../match/SpecialEffectResolver.ts'
import type { BoardItem } from '../model/Board.ts'
import type { GamePresentation } from './GamePresentation.ts'
import { GameController } from './GameController.ts'

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
})
