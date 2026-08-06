import type { ElementType } from '../../core/model/Element.ts'
import {
  createEmptyRoundResources,
  type OpponentRoundPlan,
  type RoundResources,
} from '../core/PvPBattleTypes.ts'

const baseRoundResources: readonly Omit<RoundResources, 'abilityEnergy'>[] = [
  { fireDamage: 95, iceDamage: 80, earthDefense: 36, lightDefense: 42 },
  { fireDamage: 125, iceDamage: 105, earthDefense: 44, lightDefense: 50 },
  { fireDamage: 155, iceDamage: 125, earthDefense: 55, lightDefense: 60 },
]

const typeBonuses = [30, 40, 50] as const
const darkDamageBonuses = [15, 20, 25] as const

export function createOpponentRoundPlans(elementType: ElementType): OpponentRoundPlan[] {
  return baseRoundResources.map((baseResources, index) => {
    const resources: RoundResources = {
      ...createEmptyRoundResources(),
      ...baseResources,
    }
    const typeBonus = typeBonuses[index] ?? 0

    switch (elementType) {
      case 'fire':
        resources.fireDamage += typeBonus
        break
      case 'ice':
        resources.iceDamage += typeBonus
        break
      case 'earth':
        resources.earthDefense += typeBonus
        break
      case 'light':
        resources.lightDefense += typeBonus
        break
      case 'dark': {
        const damageBonus = darkDamageBonuses[index] ?? 0
        resources.fireDamage += damageBonus
        resources.iceDamage += damageBonus
        resources.abilityEnergy += 20
        break
      }
    }

    return { resources }
  })
}
