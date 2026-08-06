import { describe, expect, it, vi } from 'vitest'
import type { AbilityActivationRequest } from '../ability/AbilityContract.ts'
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

function createHarness(options: {
  animateAbility?: GamePresentation['animateAbility']
  reportError?: (error: unknown, context: string) => void
} = {}) {
  const elementTypes = ['ice', 'fire', 'ice', 'ice'] as const
  const items: BoardItem[] = elementTypes.map((elementType, x) => ({
    piece: { id: `piece-${x}`, elementType, special: null, active: true },
    position: { x, y: 0, z: 0 },
  }))
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
    animateAbility: vi.fn(options.animateAbility ?? completed),
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
    options.reportError,
  )

  return { controller, grid, items, presentation, validator }
}

function createRequest(
  activationId: string,
  effect: AbilityActivationRequest['effect'],
): AbilityActivationRequest {
  return {
    activationId,
    characterId: 'character-1',
    abilityId: 'ability-1',
    effect,
  }
}

describe('GameController ability session', () => {
  it('требует выбрать точное число подходящих целей convert', async () => {
    const { controller, presentation } = createHarness()
    await controller.start()

    expect(
      controller.beginAbility(
        createRequest('convert-1', { type: 'convert', elementType: 'fire', targetCount: 2 }),
      ),
    ).toMatchObject({ status: 'accepted' })

    await controller.handlePieceClick('piece-1')
    expect(controller.abilityState.error).toContain('другого типа')
    expect(controller.abilityState.canConfirm).toBe(false)
    expect(presentation.select).not.toHaveBeenCalled()

    await controller.handlePieceClick('piece-0')
    expect(controller.abilityState.canConfirm).toBe(false)
    await controller.handlePieceClick('piece-2')
    expect(controller.abilityState.canConfirm).toBe(true)
    await controller.handlePieceClick('piece-3')
    expect(controller.abilityState.canConfirm).toBe(true)
    expect(controller.abilityState.error).toContain('только 2')
    expect(presentation.select).toHaveBeenCalledTimes(2)
  })

  it('не запускает одну способность дважды при повторном подтверждении', async () => {
    let completeAnimation = (_result: 'completed'): void => {
      throw new Error('Animation resolver is not initialized')
    }
    const animateAbility = vi.fn(
      () =>
        new Promise<'completed'>((resolve) => {
          completeAnimation = resolve
        }),
    )
    const { controller, presentation, validator } = createHarness({ animateAbility })
    vi.spyOn(validator, 'hasAvailableSwap').mockReturnValue(true)
    await controller.start()
    controller.beginAbility(createRequest('swap-1', { type: 'swap' }))
    await controller.handlePieceClick('piece-0')
    await controller.handlePieceClick('piece-3')

    const firstConfirmation = controller.confirmAbility()
    const secondConfirmation = controller.confirmAbility()
    expect(secondConfirmation).toBe(firstConfirmation)
    expect(presentation.animateAbility).toHaveBeenCalledOnce()

    completeAnimation('completed')
    await expect(firstConfirmation).resolves.toMatchObject({
      status: 'applied',
      activationId: 'swap-1',
      characterId: 'character-1',
      abilityId: 'ability-1',
    })
  })

  it('откатывает модель и завершает с failed при ошибке анимации', async () => {
    const error = new Error('animation failed')
    const reportError = vi.fn()
    const { controller, items } = createHarness({
      animateAbility: vi.fn(async () => {
        throw error
      }),
      reportError,
    })
    await controller.start()
    controller.beginAbility(
      createRequest('convert-failed', {
        type: 'convert',
        elementType: 'light',
        targetCount: 1,
      }),
    )
    await controller.handlePieceClick('piece-0')

    await expect(controller.confirmAbility()).resolves.toMatchObject({
      status: 'failed',
      activationId: 'convert-failed',
      code: 'execution-failed',
    })
    expect(items[0]?.piece.elementType).toBe('ice')
    expect(controller.phase).toBe('idle')
    expect(reportError).toHaveBeenCalledWith(error, 'ability-execution')
  })

  it('не запускает обычное разрешение match после способности', async () => {
    const { controller, presentation, validator } = createHarness()
    vi.spyOn(validator, 'hasAvailableSwap').mockReturnValue(true)
    await controller.start()
    controller.beginAbility(
      createRequest('convert-match', {
        type: 'convert',
        elementType: 'ice',
        targetCount: 1,
      }),
    )
    await controller.handlePieceClick('piece-1')

    await expect(controller.confirmAbility()).resolves.toMatchObject({ status: 'applied' })
    expect(presentation.animateMatches).not.toHaveBeenCalled()
    expect(presentation.animateRefill).not.toHaveBeenCalled()
  })

  it('не принимает повторно уже завершённый activationId', async () => {
    const { controller } = createHarness()
    await controller.start()
    const firstRequest = createRequest('stable-id', { type: 'swap' })
    controller.beginAbility(firstRequest)
    expect(controller.cancelAbility()).toMatchObject({ status: 'cancelled' })

    const secondRequest = createRequest('second-id', { type: 'swap' })
    controller.beginAbility(secondRequest)
    controller.cancelAbility()

    expect(controller.beginAbility(firstRequest)).toMatchObject({
      status: 'rejected',
      code: 'duplicate-activation',
    })
  })
})
