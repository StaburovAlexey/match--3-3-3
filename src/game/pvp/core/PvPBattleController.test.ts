import { describe, expect, it } from 'vitest'
import { PvPBattleController } from './PvPBattleController.ts'
import type { PvPDevRoundPatch } from './PvPBattleDevTypes.ts'
import { createEmptyRoundResources } from './PvPBattleTypes.ts'
import type { PvPBattleConfig } from './PvPBattleTypes.ts'

function createConfig(devToolsEnabled = false): PvPBattleConfig {
  return {
    maxRounds: 3,
    maxTurnsPerRound: 7,
    devToolsEnabled,
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

function createDevPatch(): PvPDevRoundPatch {
  return {
    currentTurn: 5,
    player: {
      hp: 900,
      energy: 70,
      fireDamage: 25,
      iceDamage: 5,
      earthDefense: 4,
      lightDefense: 3,
    },
    opponent: {
      hp: 850,
      energy: 60,
      fireDamage: 6,
      iceDamage: 18,
      earthDefense: 2,
      lightDefense: 7,
    },
  }
}

describe('PvPBattleController', () => {
  it('rejects dev mutations unless dev tools are explicitly enabled', () => {
    const controller = new PvPBattleController(createConfig())
    controller.start()

    expect(controller.devRoundSetup).toBeNull()
    expect(controller.applyDevRoundPatch(createDevPatch())).toMatchObject({ accepted: false })
    expect(controller.forceResolveCurrentRound()).toMatchObject({ accepted: false })
    expect(controller.currentState.phase).toBe('player-turn')
  })

  it('atomically applies normalized dev values to both combatants', () => {
    const controller = new PvPBattleController(createConfig(true))
    controller.start()
    const patch = createDevPatch()
    patch.currentTurn = 99
    patch.player.fireDamage = 25.9
    patch.opponent.iceDamage = -10

    expect(controller.applyDevRoundPatch(patch)).toMatchObject({ accepted: true })
    expect(controller.devRoundSetup).toEqual({
      currentTurn: 7,
      maxTurns: 7,
      player: { ...patch.player, fireDamage: 25 },
      opponent: { ...patch.opponent, iceDamage: 0 },
    })
    expect(controller.currentState.turn).toBe(6)
  })

  it('uses dev round values in the normal authoritative round resolution', () => {
    const controller = new PvPBattleController(createConfig(true))
    const patch = createDevPatch()
    controller.start()
    controller.applyDevRoundPatch(patch)

    expect(controller.forceResolveCurrentRound()).toMatchObject({ accepted: true })
    const state = controller.currentState
    expect(state.turn).toBe(7)
    expect(state.phase).toBe('round-result')
    expect(state.lastResolution?.playerSnapshot).toMatchObject({
      currentHp: patch.player.hp,
      abilityEnergy: patch.player.energy,
      fireDamage: patch.player.fireDamage,
      iceDamage: patch.player.iceDamage,
    })
    expect(state.lastResolution?.opponentSnapshot).toMatchObject({
      currentHp: patch.opponent.hp,
      abilityEnergy: patch.opponent.energy,
      fireDamage: patch.opponent.fireDamage,
      iceDamage: patch.opponent.iceDamage,
    })
    expect(controller.forceResolveCurrentRound()).toMatchObject({ accepted: false })
  })

  it('rejects round mutations while a manual ability is pending', () => {
    const controller = new PvPBattleController(createConfig(true))
    const patch = createDevPatch()
    controller.start()
    controller.applyDevRoundPatch(patch)

    expect(controller.beginAbility('test-ability')).toMatchObject({ accepted: true })
    expect(controller.applyDevRoundPatch(patch)).toMatchObject({ accepted: false })
    expect(controller.forceResolveCurrentRound()).toMatchObject({ accepted: false })

    controller.cancelPendingAbility()
    expect(controller.forceResolveCurrentRound()).toMatchObject({ accepted: true })
  })

  it('drops round-only stat and energy overrides but preserves resulting hp', () => {
    const controller = new PvPBattleController(createConfig(true))
    controller.start()
    controller.applyDevRoundPatch(createDevPatch())
    controller.forceResolveCurrentRound()
    const resolvedHp = {
      player: controller.currentState.player.hp,
      opponent: controller.currentState.opponent.hp,
    }

    controller.continueAfterRound()

    expect(controller.devRoundSetup).toMatchObject({
      currentTurn: 1,
      player: {
        hp: resolvedHp.player,
        energy: 40,
        fireDamage: 0,
        iceDamage: 0,
        earthDefense: 0,
        lightDefense: 0,
      },
      opponent: {
        hp: resolvedHp.opponent,
        energy: 40,
        fireDamage: 0,
        iceDamage: 0,
        earthDefense: 0,
        lightDefense: 0,
      },
    })
  })

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
