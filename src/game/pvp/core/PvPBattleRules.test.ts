import { describe, expect, it } from 'vitest'
import type { BoardPiece, MatchResolution } from '../../core/model/Board.ts'
import { calculateChannelDamage, resolveRound, resourcesFromMatch } from './PvPBattleRules.ts'
import type { RoundSnapshot } from './PvPBattleTypes.ts'

function snapshot(overrides: Partial<RoundSnapshot> = {}): RoundSnapshot {
  return {
    currentHp: 1000,
    maxHp: 1000,
    fireDamage: 0,
    iceDamage: 0,
    earthDefense: 0,
    lightDefense: 0,
    abilityEnergy: 20,
    modifiers: [],
    queuedAbilities: [],
    ...overrides,
  }
}

describe('PvPBattleRules', () => {
  it('never absorbs more than 80 percent of a damage channel', () => {
    expect(calculateChannelDamage(300, 500)).toBe(60)
    expect(calculateChannelDamage(300, 50)).toBe(250)
  })

  it('maps matched elements to their round resources', () => {
    const firePieces = Array.from({ length: 3 }, (_, index) => ({
      id: `fire-${index}`,
      elementType: 'fire' as const,
      special: null,
      active: true,
    }))
    const earthPieces = Array.from({ length: 4 }, (_, index) => ({
      id: `earth-${index}`,
      elementType: 'earth' as const,
      special: null,
      active: true,
    }))
    const darkPieces = Array.from({ length: 5 }, (_, index) => ({
      id: `dark-${index}`,
      elementType: 'dark' as const,
      special: null,
      active: true,
    }))
    const resolution: MatchResolution = {
      groups: [
        {
          elementType: 'fire',
          direction: 'x',
          startPiece: firePieces[0],
          pieces: firePieces,
        },
        {
          elementType: 'earth',
          direction: 'y',
          startPiece: earthPieces[0],
          pieces: earthPieces,
        },
        {
          elementType: 'dark',
          direction: 'z',
          startPiece: darkPieces[0],
          pieces: darkPieces,
        },
      ],
      destroyedCubes: [...firePieces, ...earthPieces, ...darkPieces].map((piece) => ({
        piece,
        elementType: piece.elementType,
      })),
      createdSpecials: [],
    }

    expect(resourcesFromMatch(resolution)).toEqual({
      fireDamage: 3,
      iceDamage: 0,
      earthDefense: 4,
      lightDefense: 0,
      abilityEnergy: 5,
    })
  })

  it('awards each cube by its own element after a mixed bomb clear', () => {
    const firePiece = {
      id: 'fire',
      elementType: 'fire' as const,
      special: null,
      active: true,
    }
    const darkPiece = {
      id: 'dark',
      elementType: 'dark' as const,
      special: null,
      active: true,
    }
    const resolution: MatchResolution = {
      groups: [
        {
          elementType: 'fire',
          direction: 'x',
          startPiece: firePiece,
          pieces: [firePiece, darkPiece],
        },
      ],
      destroyedCubes: [firePiece, darkPiece].map((piece) => ({
        piece,
        elementType: piece.elementType,
      })),
      createdSpecials: [],
    }

    expect(resourcesFromMatch(resolution)).toEqual({
      fireDamage: 1,
      iceDamage: 0,
      earthDefense: 0,
      lightDefense: 0,
      abilityEnergy: 1,
    })
  })

  it('applies the cascade multiplier to every destroyed cube', () => {
    const firePiece = {
      id: 'fire',
      elementType: 'fire' as const,
      special: null,
      active: true,
    }
    const darkPiece = {
      id: 'dark',
      elementType: 'dark' as const,
      special: null,
      active: true,
    }
    const resolution: MatchResolution = {
      groups: [],
      destroyedCubes: [firePiece, darkPiece].map((piece) => ({
        piece,
        elementType: piece.elementType,
      })),
      createdSpecials: [],
    }

    expect(resourcesFromMatch(resolution, undefined, 4)).toEqual({
      fireDamage: 4,
      iceDamage: 0,
      earthDefense: 0,
      lightDefense: 0,
      abilityEnergy: 4,
    })
  })

  it('counts a reused cube once per cascade using each destruction snapshot', () => {
    const piece: BoardPiece = {
      id: 'reused',
      elementType: 'fire',
      special: null,
      active: true,
    }
    const fireResolution: MatchResolution = {
      groups: [],
      destroyedCubes: [{ piece, elementType: 'fire' }],
      createdSpecials: [],
    }
    piece.elementType = 'ice'
    const iceResolution: MatchResolution = {
      groups: [],
      destroyedCubes: [{ piece, elementType: 'ice' }],
      createdSpecials: [],
    }

    const resources = resourcesFromMatch(iceResolution, resourcesFromMatch(fireResolution))

    expect(resources).toEqual({
      fireDamage: 1,
      iceDamage: 1,
      earthDefense: 0,
      lightDefense: 0,
      abilityEnergy: 0,
    })
  })

  it('resolves both heroes at the same time', () => {
    const result = resolveRound(
      snapshot({ fireDamage: 300, earthDefense: 500 }),
      snapshot({ iceDamage: 200, lightDefense: 0 }),
    )

    expect(result.playerDamageTaken).toBe(200)
    expect(result.opponentDamageTaken).toBe(300)
    expect(result.playerHpAfter).toBe(800)
    expect(result.opponentHpAfter).toBe(700)
  })
})
