import { describe, expect, it } from 'vitest'
import { createOpponentRoundPlans } from './OpponentRoundPlans.ts'

describe('createOpponentRoundPlans', () => {
  it.each([
    ['fire', 'fireDamage'],
    ['ice', 'iceDamage'],
    ['earth', 'earthDefense'],
    ['light', 'lightDefense'],
  ] as const)('adds an elemental bonus for %s opponents', (elementType, resource) => {
    const plans = createOpponentRoundPlans(elementType)

    expect(plans.map((plan) => plan.resources[resource])).toEqual(
      resource === 'fireDamage'
        ? [125, 165, 205]
        : resource === 'iceDamage'
          ? [110, 145, 175]
          : resource === 'earthDefense'
            ? [66, 84, 105]
            : [72, 90, 110],
    )
  })

  it('gives dark opponents mixed damage and energy', () => {
    const plans = createOpponentRoundPlans('dark')

    expect(
      plans.map(({ resources }) => [
        resources.fireDamage,
        resources.iceDamage,
        resources.abilityEnergy,
      ]),
    ).toEqual([
      [110, 95, 20],
      [145, 125, 20],
      [180, 150, 20],
    ])
  })
})
