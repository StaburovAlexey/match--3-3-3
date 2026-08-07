import { describe, expect, it } from 'vitest'
import { PvPBattleController } from './PvPBattleController.ts'
import { createEmptyRoundResources } from './PvPBattleTypes.ts'
import type { PvPBattleConfig } from './PvPBattleTypes.ts'

function createConfig(): PvPBattleConfig {
  return {
    maxRounds: 3,
    maxTurnsPerRound: 7,
    playerRating: 1200,
    player: {
      id: 'player',
      name: 'Player',
      portraitUrl: '',
      elementType: 'dark',
      maxHp: 1000,
      abilities: [
        {
          id: 'test-ability',
          version: 1,
          kind: 'active',
          name: 'Test',
          description: 'Test ability',
          iconUrl: '',
          unlockLevel: 1,
          activation: { type: 'manual', energyCost: 40, usageLimit: { perRound: 1 } },
          effects: [],
        },
      ],
    },
    opponentRating: 1250,
    opponent: {
      id: 'opponent',
      name: 'Opponent',
      portraitUrl: '',
      elementType: 'ice',
      maxHp: 1000,
      abilities: [],
    },
    opponentRounds: [
      { resources: { ...createEmptyRoundResources(), fireDamage: 100 } },
      { resources: createEmptyRoundResources() },
      { resources: createEmptyRoundResources() },
    ],
  }
}

describe('PvPBattleController', () => {
  it('keeps combatant element types in battle state', () => {
    const controller = new PvPBattleController(createConfig())

    expect(controller.currentState.player.elementType).toBe('dark')
    expect(controller.currentState.opponent.elementType).toBe('ice')
  })

  it('keeps participant ratings in cloned battle state', () => {
    const controller = new PvPBattleController(createConfig())
    const state = controller.currentState

    expect(state.player.rating).toBe(1200)
    expect(state.opponent.rating).toBe(1250)

    state.player.rating = 0
    expect(controller.currentState.player.rating).toBe(1200)
  })

  it('starts each round with twenty energy and resolves after seven turns', () => {
    const controller = new PvPBattleController(createConfig())
    controller.start()
    expect(controller.currentState.player.energy).toBe(20)
    expect(controller.currentState.phase).toBe('player-turn')

    for (let turn = 0; turn < 7; turn += 1) controller.recordBoardTurn([])

    const state = controller.currentState
    expect(state.phase).toBe('round-result')
    expect(state.turn).toBe(7)
    expect(state.player.hp).toBe(900)
    expect(state.opponent.hp).toBe(1000)
  })

  it('starts the next round only after an explicit continue action', () => {
    const controller = new PvPBattleController(createConfig())
    controller.start()

    for (let turn = 0; turn < 7; turn += 1) controller.recordBoardTurn([])

    expect(controller.currentState.phase).toBe('round-result')
    expect(controller.currentState.round).toBe(1)
    expect(controller.currentState.lastResolution).not.toBeNull()

    controller.continueAfterRound()

    expect(controller.currentState.phase).toBe('player-turn')
    expect(controller.currentState.round).toBe(2)
    expect(controller.currentState.turn).toBe(0)
    expect(controller.currentState.lastResolution).toBeNull()
  })

  it('keeps earned energy, charges an ability, and spends one turn', () => {
    const controller = new PvPBattleController(createConfig())
    const darkPieces = Array.from({ length: 20 }, (_, index) => ({
      id: `dark-${index}`,
      elementType: 'dark' as const,
      special: null,
      active: true,
    }))
    controller.start()
    controller.recordBoardTurn([
      {
        groups: [
          {
            elementType: 'dark',
            direction: 'x',
            startPiece: darkPieces[0],
            pieces: darkPieces,
          },
        ],
        destroyedCubes: darkPieces.map((piece) => ({
          piece,
          elementType: piece.elementType,
        })),
        createdSpecials: [],
      },
    ])

    expect(controller.currentState.player.energy).toBe(40)
    expect(controller.beginAbility('test-ability').accepted).toBe(true)
    expect(controller.currentState.player.energy).toBe(0)
    controller.finishAbility('test-ability', true)

    expect(controller.currentState.turn).toBe(2)
    expect(controller.currentState.phase).toBe('player-turn')
    expect(controller.currentState.player.abilities[0]?.usedThisRound).toBe(1)
  })

  it('applies each cascade multiplier to authoritative player resources', () => {
    const controller = new PvPBattleController(createConfig())
    const firePiece = {
      id: 'fire-1',
      elementType: 'fire' as const,
      special: null,
      active: true,
    }
    const icePiece = {
      id: 'ice-1',
      elementType: 'ice' as const,
      special: null,
      active: true,
    }
    controller.start()
    controller.recordBoardTurn(
      [
        {
          groups: [
            { elementType: 'fire', direction: 'x', startPiece: firePiece, pieces: [firePiece] },
          ],
          destroyedCubes: [{ piece: firePiece, elementType: 'fire' }],
          createdSpecials: [],
        },
        {
          groups: [
            { elementType: 'ice', direction: 'x', startPiece: icePiece, pieces: [icePiece] },
          ],
          destroyedCubes: [{ piece: icePiece, elementType: 'ice' }],
          createdSpecials: [],
        },
      ],
      [1, 5],
    )

    expect(controller.currentState.player.resources).toEqual({
      fireDamage: 1,
      iceDamage: 5,
      earthDefense: 0,
      lightDefense: 0,
      abilityEnergy: 20,
    })
  })
})
