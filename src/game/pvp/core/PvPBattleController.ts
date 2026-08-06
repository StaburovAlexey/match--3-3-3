import type { MatchResolution } from '../../core/model/Board.ts'
import {
  addRoundStartEnergy,
  clearRoundResources,
  resourcesFromMatch,
  resolveRound,
} from './PvPBattleRules.ts'
import {
  cloneRoundResources,
  createEmptyRoundResources,
  type AbilityStartResult,
  type CombatantDefinition,
  type CombatantState,
  type OpponentRoundPlan,
  type PvPBattleConfig,
  type PvPBattleListener,
  type PvPBattleState,
  type QueuedAbility,
  type RoundSnapshot,
} from './PvPBattleTypes.ts'

export class PvPBattleController {
  private readonly maxRounds: number
  private readonly maxTurnsPerRound: number
  private readonly opponentRounds: readonly OpponentRoundPlan[]
  private readonly listeners = new Set<PvPBattleListener>()
  private state: PvPBattleState
  private pendingAbilityId: string | null = null

  constructor(config: PvPBattleConfig) {
    this.maxRounds = config.maxRounds ?? 3
    this.maxTurnsPerRound = config.maxTurnsPerRound ?? 7
    this.opponentRounds = config.opponentRounds
    this.state = {
      phase: 'idle',
      round: 1,
      maxRounds: this.maxRounds,
      turn: 0,
      maxTurnsPerRound: this.maxTurnsPerRound,
      player: this.createCombatant(config.player, config.playerRating),
      opponent: this.createCombatant(config.opponent, config.opponentRating),
      lastResolution: null,
      message: 'Готовьтесь к бою',
    }
  }

  get currentState(): PvPBattleState {
    return cloneBattleState(this.state)
  }

  subscribe(listener: PvPBattleListener): () => void {
    this.listeners.add(listener)
    listener(this.currentState)
    return () => this.listeners.delete(listener)
  }

  start(): void {
    if (this.state.phase !== 'idle') return
    this.state.phase = 'round-start'
    this.startRoundResources()
    this.state.phase = 'player-turn'
    this.state.message = 'Ваш ход'
    this.publish()
  }

  recordBoardTurn(
    resolutions: readonly MatchResolution[],
    rewardMultipliers: readonly number[] = [],
  ): void {
    if (this.state.phase !== 'player-turn') return

    resolutions.forEach((resolution, index) => {
      this.state.player.resources = resourcesFromMatch(
        resolution,
        this.state.player.resources,
        rewardMultipliers[index] ?? 1,
      )
      this.state.player.energy +=
        this.state.player.resources.abilityEnergy - this.state.player.energyInRound
      this.state.player.energyInRound = this.state.player.resources.abilityEnergy
    })
    this.finishPlayerTurn()
  }

  beginAbility(abilityId: string): AbilityStartResult {
    if (this.state.phase !== 'player-turn') {
      return { accepted: false, message: 'Способность доступна только во время вашего хода' }
    }
    if (this.pendingAbilityId) {
      return { accepted: false, message: 'Сначала завершите текущую способность' }
    }

    const abilityState = this.state.player.abilities.find(
      ({ definition }) => definition.id === abilityId,
    )
    if (!abilityState) return { accepted: false, message: 'Способность не найдена' }
    const { definition } = abilityState
    if (definition.activation.type !== 'manual') {
      return { accepted: false, message: 'Эта способность срабатывает автоматически' }
    }
    if (this.state.player.energy < definition.activation.energyCost) {
      return { accepted: false, message: 'Недостаточно энергии' }
    }
    if (
      definition.activation.usageLimit?.perRound !== undefined &&
      abilityState.usedThisRound >= definition.activation.usageLimit.perRound
    ) {
      return { accepted: false, message: 'Способность уже использована в этом раунде' }
    }
    if (
      definition.activation.usageLimit?.perBattle !== undefined &&
      abilityState.usedInBattle >= definition.activation.usageLimit.perBattle
    ) {
      return { accepted: false, message: 'Способность уже использована в этом матче' }
    }

    this.state.player.energy -= definition.activation.energyCost
    this.pendingAbilityId = abilityId
    this.state.message = `Выберите цель: ${definition.name}`
    this.publish()
    return { accepted: true, ability: definition }
  }

  finishAbility(abilityId: string, applied: boolean): void {
    if (this.pendingAbilityId !== abilityId) return

    const abilityState = this.state.player.abilities.find(
      ({ definition }) => definition.id === abilityId,
    )
    const definition = abilityState?.definition
    if (!abilityState || !definition || definition.activation.type !== 'manual') {
      this.pendingAbilityId = null
      return
    }

    if (!applied) {
      this.state.player.energy += definition.activation.energyCost
      this.pendingAbilityId = null
      this.state.message = 'Способность отменена'
      this.publish()
      return
    }

    abilityState.usedThisRound += 1
    abilityState.usedInBattle += 1
    this.pendingAbilityId = null
    this.finishPlayerTurn(
      definition.effects.length > 0 ? [{ abilityId, effects: definition.effects }] : [],
    )
  }

  continueAfterRound(): void {
    if (this.state.phase !== 'round-result') return
    if (
      this.state.round >= this.maxRounds ||
      this.state.player.hp <= 0 ||
      this.state.opponent.hp <= 0
    ) {
      return
    }

    this.state.round += 1
    this.state.turn = 0
    this.state.lastResolution = null
    this.state.phase = 'round-start'
    this.startRoundResources()
    this.state.phase = 'player-turn'
    this.state.message = 'Новый раунд. Ваш ход'
    this.publish()
  }

  cancelPendingAbility(): void {
    if (!this.pendingAbilityId) return
    this.finishAbility(this.pendingAbilityId, false)
  }

  dispose(): void {
    this.listeners.clear()
    this.pendingAbilityId = null
    this.state.phase = 'finished'
  }

  private createCombatant(definition: CombatantDefinition, rating: number): CombatantState {
    return {
      ...definition,
      rating,
      hp: definition.maxHp,
      energy: 0,
      energyInRound: 0,
      resources: createEmptyRoundResources(),
      abilities: definition.abilities.map((ability) => ({
        definition: { ...ability, effects: [...ability.effects] },
        usedThisRound: 0,
        usedInBattle: 0,
      })),
      roundWins: 0,
    }
  }

  private startRoundResources(): void {
    this.state.player.energy += 20
    this.state.opponent.energy += 20
    this.state.player.resources = addRoundStartEnergy(
      clearRoundResources(this.state.player.resources),
    )
    this.state.opponent.resources = addRoundStartEnergy(
      clearRoundResources(this.state.opponent.resources),
    )
    this.state.player.energyInRound = 20
    this.state.opponent.energyInRound = 20
    this.state.player.abilities.forEach((ability) => {
      ability.usedThisRound = 0
    })
    this.state.opponent.abilities.forEach((ability) => {
      ability.usedThisRound = 0
    })
  }

  private finishPlayerTurn(queuedAbilities: QueuedAbility[] = []): void {
    this.state.turn += 1
    if (this.state.turn < this.maxTurnsPerRound) {
      this.state.message = `Ваш ход ${this.state.turn + 1}/${this.maxTurnsPerRound}`
      this.publish()
      return
    }

    this.state.phase = 'opponent-turn'
    this.state.message = 'Соперник фиксирует результат'
    this.publish()
    this.resolveCurrentRound(queuedAbilities)
  }

  private resolveCurrentRound(playerQueuedAbilities: QueuedAbility[]): void {
    this.state.phase = 'resolving'
    const opponentPlan = this.opponentRounds[this.state.round - 1] ?? createEmptyOpponentPlan()
    const opponentResources = {
      ...cloneRoundResources(opponentPlan.resources),
      abilityEnergy: this.state.opponent.energy + opponentPlan.resources.abilityEnergy,
    }
    const playerSnapshot = this.createSnapshot(this.state.player, playerQueuedAbilities)
    const opponentSnapshot = this.createSnapshot(
      this.state.opponent,
      opponentPlan.queuedAbilities ?? [],
      opponentResources,
      opponentPlan.modifiers ?? [],
      opponentResources.abilityEnergy,
    )
    const result = resolveRound(playerSnapshot, opponentSnapshot)

    this.state.player.hp = result.playerHpAfter
    this.state.opponent.hp = result.opponentHpAfter
    this.state.player.energy = result.playerSnapshot.abilityEnergy
    this.state.opponent.energy = result.opponentSnapshot.abilityEnergy
    this.state.player.resources = clearRoundResources(this.state.player.resources)
    this.state.opponent.resources = clearRoundResources(this.state.opponent.resources)
    this.state.lastResolution = result
    if (result.winner === 'player') this.state.player.roundWins += 1
    if (result.winner === 'opponent') this.state.opponent.roundWins += 1

    if (
      this.state.round >= this.maxRounds ||
      this.state.player.hp <= 0 ||
      this.state.opponent.hp <= 0
    ) {
      this.state.phase = 'finished'
      this.state.message = this.getFinishedMessage()
    } else {
      this.state.phase = 'round-result'
      this.state.message = this.getRoundMessage(result.winner)
    }
    this.publish()
  }

  private createSnapshot(
    combatant: CombatantState,
    queuedAbilities: QueuedAbility[],
    resources = combatant.resources,
    modifiers: RoundSnapshot['modifiers'] = [],
    energy = combatant.energy,
  ): RoundSnapshot {
    return {
      currentHp: combatant.hp,
      maxHp: combatant.maxHp,
      fireDamage: resources.fireDamage,
      iceDamage: resources.iceDamage,
      earthDefense: resources.earthDefense,
      lightDefense: resources.lightDefense,
      abilityEnergy: energy,
      modifiers: [...modifiers],
      queuedAbilities: queuedAbilities.map((ability) => ({
        abilityId: ability.abilityId,
        effects: [...ability.effects],
      })),
    }
  }

  private getRoundMessage(winner: 'player' | 'opponent' | 'draw'): string {
    if (winner === 'player') return 'Раунд за вами'
    if (winner === 'opponent') return 'Соперник выиграл раунд'
    return 'Раунд завершился вничью'
  }

  private getFinishedMessage(): string {
    if (this.state.player.hp <= 0 && this.state.opponent.hp <= 0)
      return 'Ничья: оба героя повержены'
    if (this.state.player.hp <= 0) return 'Поражение'
    if (this.state.opponent.hp <= 0) return 'Победа'
    if (this.state.player.roundWins === this.state.opponent.roundWins) {
      const playerRatio = this.state.player.hp / this.state.player.maxHp
      const opponentRatio = this.state.opponent.hp / this.state.opponent.maxHp
      if (playerRatio === opponentRatio) return 'Ничья по итогам матча'
      return playerRatio > opponentRatio ? 'Победа по HP' : 'Поражение по HP'
    }
    return this.state.player.roundWins > this.state.opponent.roundWins ? 'Победа' : 'Поражение'
  }

  private publish(): void {
    const snapshot = this.currentState
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

function createEmptyOpponentPlan(): OpponentRoundPlan {
  return {
    resources: createEmptyRoundResources(),
  }
}

function cloneBattleState(state: PvPBattleState): PvPBattleState {
  return {
    ...state,
    player: cloneCombatant(state.player),
    opponent: cloneCombatant(state.opponent),
    lastResolution: state.lastResolution
      ? {
          ...state.lastResolution,
          playerSnapshot: cloneSnapshot(state.lastResolution.playerSnapshot),
          opponentSnapshot: cloneSnapshot(state.lastResolution.opponentSnapshot),
        }
      : null,
  }
}

function cloneCombatant(combatant: CombatantState): CombatantState {
  return {
    ...combatant,
    resources: cloneRoundResources(combatant.resources),
    abilities: combatant.abilities.map((ability) => ({
      ...ability,
      definition: { ...ability.definition, effects: [...ability.definition.effects] },
    })),
  }
}

function cloneSnapshot(snapshot: RoundSnapshot): RoundSnapshot {
  return {
    ...snapshot,
    modifiers: [...snapshot.modifiers],
    queuedAbilities: snapshot.queuedAbilities.map((ability) => ({
      ...ability,
      effects: [...ability.effects],
    })),
  }
}
