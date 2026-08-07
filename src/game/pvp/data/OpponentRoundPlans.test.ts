import { describe, expect, it } from 'vitest'
import { createOpponentRoundPlans } from './OpponentRoundPlans.ts'

describe('createOpponentRoundPlans', () => {
  it.each(['fire', 'ice', 'earth', 'light', 'dark'] as const)(
    'gives a %s opponent ten points in every combat stat in each round',
    (elementType) => {
      const plans = createOpponentRoundPlans(elementType)

      expect(plans).toHaveLength(3)
      expect(plans.map(({ resources }) => resources)).toEqual(
        Array.from({ length: 3 }, () => ({
          fireDamage: 10,
          iceDamage: 10,
          earthDefense: 10,
          lightDefense: 10,
          abilityEnergy: 0,
        })),
      )
    },
  )
})
