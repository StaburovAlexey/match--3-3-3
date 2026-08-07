import { describe, expect, it } from 'vitest'
import type { RoundResolutionResult } from '../../core/PvPBattleTypes.ts'
import {
  createIdleRoundClashPresentation,
  createIntroRoundClashPresentation,
  setRoundClashPresentationHealth,
  setRoundClashPresentationPhase,
} from './RoundClashPresentation.ts'

function createResolution(): RoundResolutionResult {
  return {
    playerSnapshot: {
      currentHp: 90,
      maxHp: 100,
      fireDamage: 11,
      iceDamage: 12,
      earthDefense: 13,
      lightDefense: 14,
      abilityEnergy: 25,
      modifiers: [],
      queuedAbilities: [],
    },
    opponentSnapshot: {
      currentHp: 80,
      maxHp: 100,
      fireDamage: 21,
      iceDamage: 22,
      earthDefense: 23,
      lightDefense: 24,
      abilityEnergy: 35,
      modifiers: [],
      queuedAbilities: [],
    },
    playerDamageTaken: 20,
    opponentDamageTaken: 30,
    playerHpAfter: 70,
    opponentHpAfter: 50,
    winner: 'player',
  }
}

describe('RoundClashPresentation', () => {
  it('creates a fully cleared idle state', () => {
    expect(createIdleRoundClashPresentation()).toEqual({
      phase: 'idle',
      health: null,
      resources: null,
    })
  })

  it('creates the intro state from immutable round snapshots', () => {
    const presentation = createIntroRoundClashPresentation(createResolution())

    expect(presentation).toEqual({
      phase: 'intro',
      health: { player: 90, opponent: 80 },
      resources: {
        player: {
          fireDamage: 11,
          iceDamage: 12,
          earthDefense: 13,
          lightDefense: 14,
          abilityEnergy: 25,
        },
        opponent: {
          fireDamage: 21,
          iceDamage: 22,
          earthDefense: 23,
          lightDefense: 24,
          abilityEnergy: 35,
        },
      },
    })
  })

  it('moves through battle and completion while updating health immutably', () => {
    const intro = createIntroRoundClashPresentation(createResolution())
    const battle = setRoundClashPresentationPhase(intro, 'battle')
    const damaged = setRoundClashPresentationHealth(battle, { player: 70, opponent: 50 })
    const complete = setRoundClashPresentationPhase(damaged, 'complete')

    expect(intro.phase).toBe('intro')
    expect(intro.health).toEqual({ player: 90, opponent: 80 })
    expect(battle.phase).toBe('battle')
    expect(damaged.health).toEqual({ player: 70, opponent: 50 })
    expect(complete.phase).toBe('complete')
    expect(complete.resources).toBe(intro.resources)
  })
})
