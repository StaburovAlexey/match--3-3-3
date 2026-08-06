import type { MatchResolution } from '../../core/model/Board.ts'
import type { ElementType } from '../../core/model/Element.ts'
import { getPlayerCubeReward } from '../../core/model/RewardTarget.ts'
import {
  cloneRoundResources,
  createEmptyRoundResources,
  type BattleEffect,
  type CombatModifier,
  type DamageChannel,
  type QueuedAbility,
  type RoundResources,
  type RoundResolutionResult,
  type RoundSnapshot,
  type ValueExpression,
} from './PvPBattleTypes.ts'

export const maxDefenseAbsorbRatio = 0.8

export function calculateChannelDamage(
  incomingDamage: number,
  defense: number,
  maxAbsorbRatio = maxDefenseAbsorbRatio,
): number {
  const safeIncoming = Math.max(0, incomingDamage)
  const safeDefense = Math.max(0, defense)
  const maxAbsorbedDamage = safeIncoming * Math.min(1, Math.max(0, maxAbsorbRatio))
  return Math.max(0, safeIncoming - Math.min(safeDefense, maxAbsorbedDamage))
}

export function resourcesFromMatch(
  resolution: MatchResolution,
  resources: RoundResources = createEmptyRoundResources(),
  multiplier = 1,
): RoundResources {
  const next = cloneRoundResources(resources)
  resolution.destroyedCubes.forEach((destroyedCube) => {
    const reward = getPlayerCubeReward(destroyedCube.elementType, multiplier)
    next[reward.resource] += reward.amount
  })
  return next
}

export function addRoundStartEnergy(resources: RoundResources, amount = 20): RoundResources {
  return {
    ...cloneRoundResources(resources),
    abilityEnergy: resources.abilityEnergy + Math.max(0, amount),
  }
}

export function clearRoundResources(resources: RoundResources): RoundResources {
  return {
    ...createEmptyRoundResources(),
    abilityEnergy: resources.abilityEnergy,
  }
}

interface EffectOutcome {
  fireDamage: number
  iceDamage: number
  trueDamage: number
  healing: number
  modifiers: CombatModifier[]
}

function createEmptyEffectOutcome(): EffectOutcome {
  return { fireDamage: 0, iceDamage: 0, trueDamage: 0, healing: 0, modifiers: [] }
}

export function resolveRound(
  playerSnapshot: RoundSnapshot,
  opponentSnapshot: RoundSnapshot,
): RoundResolutionResult {
  const playerEffects = resolveQueuedEffects(
    playerSnapshot.queuedAbilities,
    playerSnapshot,
    opponentSnapshot,
  )
  const opponentEffects = resolveQueuedEffects(
    opponentSnapshot.queuedAbilities,
    opponentSnapshot,
    playerSnapshot,
  )

  const playerSourceModifiers = [
    ...playerSnapshot.modifiers,
    ...playerEffects.modifiers.filter((modifier) => modifier.target === 'self'),
  ]
  const opponentSourceModifiers = [
    ...opponentSnapshot.modifiers,
    ...opponentEffects.modifiers.filter((modifier) => modifier.target === 'self'),
  ]
  const playerIncomingModifiers = opponentEffects.modifiers.filter(
    (modifier) => modifier.target === 'enemy',
  )
  const opponentIncomingModifiers = playerEffects.modifiers.filter(
    (modifier) => modifier.target === 'enemy',
  )

  const playerFireDamage = applyDamageModifiers(
    playerSnapshot.fireDamage + playerEffects.fireDamage,
    'fire',
    playerSourceModifiers,
    opponentIncomingModifiers,
    playerSnapshot,
    opponentSnapshot,
  )
  const playerIceDamage = applyDamageModifiers(
    playerSnapshot.iceDamage + playerEffects.iceDamage,
    'ice',
    playerSourceModifiers,
    opponentIncomingModifiers,
    playerSnapshot,
    opponentSnapshot,
  )
  const playerTrueDamage = applyDamageModifiers(
    playerEffects.trueDamage,
    'true',
    playerSourceModifiers,
    opponentIncomingModifiers,
    playerSnapshot,
    opponentSnapshot,
  )
  const opponentFireDamage = applyDamageModifiers(
    opponentSnapshot.fireDamage + opponentEffects.fireDamage,
    'fire',
    opponentSourceModifiers,
    playerIncomingModifiers,
    opponentSnapshot,
    playerSnapshot,
  )
  const opponentIceDamage = applyDamageModifiers(
    opponentSnapshot.iceDamage + opponentEffects.iceDamage,
    'ice',
    opponentSourceModifiers,
    playerIncomingModifiers,
    opponentSnapshot,
    playerSnapshot,
  )
  const opponentTrueDamage = applyDamageModifiers(
    opponentEffects.trueDamage,
    'true',
    opponentSourceModifiers,
    playerIncomingModifiers,
    opponentSnapshot,
    playerSnapshot,
  )

  const playerEarthDefense = applyDefenseModifiers(
    playerSnapshot.earthDefense,
    'earthDefensePower',
    playerSourceModifiers,
    playerSnapshot,
    opponentSnapshot,
  )
  const playerLightDefense = applyDefenseModifiers(
    playerSnapshot.lightDefense,
    'lightDefensePower',
    playerSourceModifiers,
    playerSnapshot,
    opponentSnapshot,
  )
  const opponentEarthDefense = applyDefenseModifiers(
    opponentSnapshot.earthDefense,
    'earthDefensePower',
    opponentSourceModifiers,
    opponentSnapshot,
    playerSnapshot,
  )
  const opponentLightDefense = applyDefenseModifiers(
    opponentSnapshot.lightDefense,
    'lightDefensePower',
    opponentSourceModifiers,
    opponentSnapshot,
    playerSnapshot,
  )

  const playerIncoming = calculateIncomingDamage(
    {
      fire: opponentFireDamage,
      ice: opponentIceDamage,
      true: opponentTrueDamage,
    },
    {
      earth: playerEarthDefense,
      light: playerLightDefense,
    },
  )
  const opponentIncoming = calculateIncomingDamage(
    {
      fire: playerFireDamage,
      ice: playerIceDamage,
      true: playerTrueDamage,
    },
    {
      earth: opponentEarthDefense,
      light: opponentLightDefense,
    },
  )

  const playerDamageTaken = Math.max(0, Math.round(playerIncoming))
  const opponentDamageTaken = Math.max(0, Math.round(opponentIncoming))
  const playerHpAfter = Math.max(
    0,
    Math.min(
      playerSnapshot.maxHp,
      playerSnapshot.currentHp -
        playerDamageTaken +
        Math.round(
          applyHealingModifiers(
            playerEffects.healing,
            playerSourceModifiers,
            playerSnapshot,
            opponentSnapshot,
          ),
        ),
    ),
  )
  const opponentHpAfter = Math.max(
    0,
    Math.min(
      opponentSnapshot.maxHp,
      opponentSnapshot.currentHp -
        opponentDamageTaken +
        Math.round(
          applyHealingModifiers(
            opponentEffects.healing,
            opponentSourceModifiers,
            opponentSnapshot,
            playerSnapshot,
          ),
        ),
    ),
  )

  return {
    playerSnapshot,
    opponentSnapshot,
    playerDamageTaken,
    opponentDamageTaken,
    playerHpAfter,
    opponentHpAfter,
    winner: compareRoundHealth(
      playerHpAfter,
      playerSnapshot.maxHp,
      opponentHpAfter,
      opponentSnapshot.maxHp,
    ),
  }
}

export function compareRoundHealth(
  playerHp: number,
  playerMaxHp: number,
  opponentHp: number,
  opponentMaxHp: number,
): 'player' | 'opponent' | 'draw' {
  if (playerHp <= 0 && opponentHp <= 0) return 'draw'
  if (playerHp <= 0) return 'opponent'
  if (opponentHp <= 0) return 'player'

  const playerRatio = playerMaxHp > 0 ? playerHp / playerMaxHp : 0
  const opponentRatio = opponentMaxHp > 0 ? opponentHp / opponentMaxHp : 0
  if (playerRatio === opponentRatio) return 'draw'
  return playerRatio > opponentRatio ? 'player' : 'opponent'
}

function calculateIncomingDamage(
  damage: Record<DamageChannel, number>,
  defense: { earth: number; light: number },
): number {
  return (
    calculateChannelDamage(damage.fire, defense.earth) +
    calculateChannelDamage(damage.ice, defense.light) +
    Math.max(0, damage.true)
  )
}

function applyDamageModifiers(
  value: number,
  channel: DamageChannel,
  sourceModifiers: readonly CombatModifier[],
  targetModifiers: readonly CombatModifier[],
  source: RoundSnapshot,
  target: RoundSnapshot,
): number {
  let result = value
  result = applyModifiers(result, sourceModifiers, 'outgoingDamage', source, target)
  result = applyModifiers(result, targetModifiers, 'incomingDamage', target, source)
  if (channel === 'fire') {
    result = applyModifiers(result, sourceModifiers, 'fireDamagePower', source, target)
  }
  if (channel === 'ice') {
    result = applyModifiers(result, sourceModifiers, 'iceDamagePower', source, target)
  }
  return Math.max(0, result)
}

function applyDefenseModifiers(
  value: number,
  stat: 'earthDefensePower' | 'lightDefensePower',
  modifiers: readonly CombatModifier[],
  self: RoundSnapshot,
  enemy: RoundSnapshot,
): number {
  return Math.max(0, applyModifiers(value, modifiers, stat, self, enemy))
}

function applyHealingModifiers(
  value: number,
  modifiers: readonly CombatModifier[],
  self: RoundSnapshot,
  enemy: RoundSnapshot,
): number {
  return Math.max(0, applyModifiers(value, modifiers, 'healingPower', self, enemy))
}

function applyModifiers(
  value: number,
  modifiers: readonly CombatModifier[],
  stat: CombatModifier['stat'],
  self: RoundSnapshot,
  enemy: RoundSnapshot,
): number {
  let result = value
  modifiers
    .filter((modifier) => modifier.stat === stat)
    .forEach((modifier) => {
      const modifierValue = evaluateValue(modifier.value, self, enemy)
      switch (modifier.operation) {
        case 'flat-add':
          result += modifierValue
          break
        case 'flat-subtract':
          result -= modifierValue
          break
        case 'percent-add':
          result += value * modifierValue
          break
        case 'percent-subtract':
          result -= value * modifierValue
          break
        case 'multiply':
          result *= modifierValue
          break
        case 'set':
          result = modifierValue
          break
      }
    })
  return result
}

function resolveQueuedEffects(
  abilities: readonly QueuedAbility[],
  self: RoundSnapshot,
  enemy: RoundSnapshot,
): EffectOutcome {
  const outcome = createEmptyEffectOutcome()
  abilities.forEach((ability) => {
    ability.effects.forEach((effect) => {
      applyBattleEffect(outcome, effect, self, enemy)
    })
  })
  return outcome
}

function applyBattleEffect(
  outcome: EffectOutcome,
  effect: BattleEffect,
  self: RoundSnapshot,
  enemy: RoundSnapshot,
): void {
  switch (effect.type) {
    case 'deal-damage': {
      const value = evaluateValue(effect.value, self, enemy)
      if (effect.channel === 'fire') outcome.fireDamage += value
      else if (effect.channel === 'ice') outcome.iceDamage += value
      else outcome.trueDamage += value
      return
    }
    case 'heal':
      outcome.healing += evaluateValue(effect.value, self, enemy)
      return
    case 'modify-stat':
      outcome.modifiers.push({
        id: `round-modifier-${outcome.modifiers.length}`,
        target: effect.target,
        stat: effect.stat,
        operation: effect.operation,
        value: effect.value,
        duration: effect.duration,
      })
      return
    case 'destroy-cubes':
    case 'rotate-cubes':
    case 'transform-cubes':
      return
  }
}

function evaluateValue(
  expression: ValueExpression,
  self: RoundSnapshot,
  enemy: RoundSnapshot,
): number {
  switch (expression.type) {
    case 'constant':
      return expression.value
    case 'resource':
      return (
        getResource(expression.target === 'self' ? self : enemy, expression.resource) *
        expression.multiplier
      )
    case 'sum':
      return expression.values.reduce(
        (total, value) => total + evaluateValue(value, self, enemy),
        0,
      )
    case 'multiply':
      return expression.values.reduce(
        (total, value) => total * evaluateValue(value, self, enemy),
        1,
      )
    case 'min':
      return Math.min(...expression.values.map((value) => evaluateValue(value, self, enemy)))
    case 'max':
      return Math.max(...expression.values.map((value) => evaluateValue(value, self, enemy)))
  }
}

function getResource(snapshot: RoundSnapshot, resource: keyof RoundResources): number {
  return snapshot[resource]
}

export function elementResource(element: ElementType, amount: number): Partial<RoundResources> {
  const reward = getPlayerCubeReward(element)
  return { [reward.resource]: amount }
}
