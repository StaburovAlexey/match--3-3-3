import type { ElementType } from '../../core/model/Element.ts'
import { createEmptyRoundResources, type OpponentRoundPlan } from '../core/PvPBattleTypes.ts'

const opponentRoundCount = 3
const opponentStatValue = 10

export function createOpponentRoundPlans(_elementType: ElementType): OpponentRoundPlan[] {
  return Array.from({ length: opponentRoundCount }, () => ({
    resources: {
      ...createEmptyRoundResources(),
      fireDamage: opponentStatValue,
      iceDamage: opponentStatValue,
      earthDefense: opponentStatValue,
      lightDefense: opponentStatValue,
    },
  }))
}
