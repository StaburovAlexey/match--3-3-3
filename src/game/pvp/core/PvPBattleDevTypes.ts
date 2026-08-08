import type { RoundResources } from './PvPBattleTypes.ts'

export type PvPDevRoundResources = Omit<RoundResources, 'abilityEnergy'>

export interface PvPDevCombatantValues extends PvPDevRoundResources {
  hp: number
  energy: number
}

export interface PvPDevRoundSetup {
  currentTurn: number
  maxTurns: number
  player: PvPDevCombatantValues
  opponent: PvPDevCombatantValues
}

export interface PvPDevRoundPatch {
  currentTurn: number
  player: PvPDevCombatantValues
  opponent: PvPDevCombatantValues
}

export interface PvPDevCommandResult {
  accepted: boolean
  message: string
}
