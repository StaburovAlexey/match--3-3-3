import { describe, expect, it } from 'vitest'
import { parseAbilityActivationRequest } from './AbilityContract.ts'

const requestContext = {
  activationId: 'activation-1',
  characterId: 'character-1',
  abilityId: 'ability-1',
}

describe('AbilityContract', () => {
  it.each([
    { type: 'convert', elementType: 'light', targetCount: 2 },
    { type: 'swap' },
    {
      type: 'rotateSegment',
      orientation: 'vertical',
      pattern: 'gap',
      oppositeRotation: true,
    },
  ])('принимает поддерживаемый effect $type', (effect) => {
    expect(parseAbilityActivationRequest({ ...requestContext, effect })).toEqual({
      ok: true,
      value: { ...requestContext, effect },
    })
  })

  it.each([
    [{ ...requestContext, effect: { type: 'rotate', radius: 1 } }, 'Неизвестный тип способности'],
    [
      { ...requestContext, effect: { type: 'convert', elementType: 'light', targetCount: 0 } },
      'targetCount',
    ],
    [
      {
        ...requestContext,
        effect: {
          type: 'rotateSegment',
          orientation: 'horizontal',
          pattern: 'single',
          oppositeRotation: true,
        },
      },
      'Зеркальный поворот',
    ],
  ])('отклоняет некорректный запрос %#', (request, message) => {
    const result = parseAbilityActivationRequest(request)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain(message)
  })
})
