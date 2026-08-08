import type { AbilityEffect as FieldAbilityEffect } from '../../core/ability/AbilityCommand.ts'
import type { ElementType } from '../../core/model/Element.ts'

export type DamageChannel = 'fire' | 'ice' | 'true'

export type BattleStat =
  | 'outgoingDamage'
  | 'incomingDamage'
  | 'healingPower'
  | 'fireDamagePower'
  | 'iceDamagePower'
  | 'earthDefensePower'
  | 'lightDefensePower'
  | 'energyGain'

export type ModifierOperation =
  'flat-add' | 'flat-subtract' | 'percent-add' | 'percent-subtract' | 'multiply' | 'set'

export type EffectDuration =
  | { type: 'instant' }
  | { type: 'until-turn-end' }
  | { type: 'until-round-end' }
  | { type: 'rounds'; count: number }
  | { type: 'battle' }

export type ValueExpression =
  | { type: 'constant'; value: number }
  | {
      type: 'resource'
      target: 'self' | 'enemy'
      resource: keyof RoundResources
      multiplier: number
    }
  | { type: 'sum'; values: readonly ValueExpression[] }
  | { type: 'multiply'; values: readonly ValueExpression[] }
  | { type: 'min'; values: readonly ValueExpression[] }
  | { type: 'max'; values: readonly ValueExpression[] }

export interface CombatModifier {
  id: string
  target: 'self' | 'enemy'
  stat: BattleStat
  operation: ModifierOperation
  value: ValueExpression
  duration: EffectDuration
}

export interface ModifyStatEffect {
  type: 'modify-stat'
  target: 'self' | 'enemy'
  stat: BattleStat
  operation: ModifierOperation
  value: ValueExpression
  duration: EffectDuration
  timing: 'round-resolution'
}

export interface DealDamageEffect {
  type: 'deal-damage'
  target: 'enemy'
  channel: DamageChannel
  value: ValueExpression
  penetration?: number
  timing: 'round-resolution'
}

export interface HealEffect {
  type: 'heal'
  target: 'self'
  value: ValueExpression
  timing: 'round-resolution'
}

export type CubeSelector =
  | { type: 'selected-cube' }
  | { type: 'selected-line' }
  | { type: 'selected-region'; size: { x: number; y: number; z: number } }
  | { type: 'adjacent-to-selected'; radius: number; includeSelected: boolean }
  | { type: 'by-element'; element: ElementType; limit?: number }
  | { type: 'random'; count: number }
  | { type: 'all' }

export interface DestroyCubesEffect {
  type: 'destroy-cubes'
  selector: CubeSelector
  rewardPolicy: {
    grantDamage: boolean
    grantDefense: boolean
    grantEnergy: boolean
  }
  triggerCascades: boolean
  refillBoard: boolean
  timing: 'immediate'
}

export interface RotateCubesEffect {
  type: 'rotate-cubes'
  selector:
    | { type: 'selected-line' }
    | { type: 'selected-region'; size: { x: number; y: number; z: number } }
  axis: 'x' | 'y' | 'z' | 'selected'
  angle: 90 | -90 | 180
  triggerMatches: boolean
  timing: 'immediate'
}

export interface TransformCubesEffect {
  type: 'transform-cubes'
  selector: CubeSelector
  transform:
    | { type: 'fixed-element'; element: ElementType }
    | { type: 'hero-element' }
    | { type: 'random-element'; excludeCurrent: boolean }
  triggerMatches: boolean
  timing: 'immediate'
}

export type BattleEffect =
  | ModifyStatEffect
  | DealDamageEffect
  | HealEffect
  | DestroyCubesEffect
  | RotateCubesEffect
  | TransformCubesEffect

export type AbilityKind = 'active' | 'passive' | 'ultimate'

export type AbilityActivation =
  | {
      type: 'manual'
      energyCost: number
      usageLimit?: { perRound?: number; perBattle?: number }
    }
  | { type: 'automatic' }

export interface AbilityDefinition {
  id: string
  version: number
  kind: AbilityKind
  name: string
  description: string
  iconUrl: string
  unlockLevel: number
  activation: AbilityActivation
  effects: readonly BattleEffect[]
  fieldEffect?: FieldAbilityEffect
}

export interface AbilityState {
  definition: AbilityDefinition
  usedThisRound: number
  usedInBattle: number
}

export interface QueuedAbility {
  abilityId: string
  effects: readonly BattleEffect[]
}

export interface RoundResources {
  fireDamage: number
  iceDamage: number
  earthDefense: number
  lightDefense: number
  abilityEnergy: number
}

export interface RoundSnapshot {
  currentHp: number
  maxHp: number
  fireDamage: number
  iceDamage: number
  earthDefense: number
  lightDefense: number
  abilityEnergy: number
  modifiers: readonly CombatModifier[]
  queuedAbilities: readonly QueuedAbility[]
}

export interface CombatantDefinition {
  id: string
  name: string
  portraitUrl: string
  elementType: ElementType
  maxHp: number
  abilities: readonly AbilityDefinition[]
}

export interface CombatantState extends Omit<CombatantDefinition, 'abilities'> {
  rating: number
  hp: number
  energy: number
  energyInRound: number
  resources: RoundResources
  abilities: readonly AbilityState[]
  roundWins: number
}

export type PvPBattlePhase =
  | 'idle'
  | 'round-start'
  | 'player-turn'
  | 'opponent-turn'
  | 'resolving'
  | 'round-result'
  | 'finished'

export interface OpponentRoundPlan {
  resources: RoundResources
  queuedAbilities?: QueuedAbility[]
  modifiers?: CombatModifier[]
}

export interface RoundResolutionResult {
  playerSnapshot: RoundSnapshot
  opponentSnapshot: RoundSnapshot
  playerDamageTaken: number
  opponentDamageTaken: number
  playerHpAfter: number
  opponentHpAfter: number
  winner: 'player' | 'opponent' | 'draw'
}

export interface PvPBattleState {
  phase: PvPBattlePhase
  round: number
  maxRounds: number
  turn: number
  maxTurnsPerRound: number
  player: CombatantState
  opponent: CombatantState
  lastResolution: RoundResolutionResult | null
  message: string
}

export interface PvPBattleConfig {
  maxRounds?: number
  maxTurnsPerRound?: number
  devToolsEnabled?: boolean
  player: CombatantDefinition
  playerRating: number
  opponent: CombatantDefinition
  opponentRating: number
  opponentRounds: OpponentRoundPlan[]
}

export type PvPBattleListener = (state: PvPBattleState) => void

export interface AbilityStartResult {
  accepted: boolean
  message?: string
  ability?: AbilityDefinition
}

export function createEmptyRoundResources(): RoundResources {
  return {
    fireDamage: 0,
    iceDamage: 0,
    earthDefense: 0,
    lightDefense: 0,
    abilityEnergy: 0,
  }
}

export function cloneRoundResources(resources: RoundResources): RoundResources {
  return { ...resources }
}
