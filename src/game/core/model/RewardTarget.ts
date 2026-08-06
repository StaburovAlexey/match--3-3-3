import type { ElementType } from './Element.ts'

export type PlayerRewardStat = 'fireDamage' | 'iceDamage' | 'earthDefense' | 'lightDefense'
export type PlayerRewardResource = PlayerRewardStat | 'abilityEnergy'
export type PlayerRewardDestination = PlayerRewardStat | 'portrait'

export interface PlayerCubeReward {
  resource: PlayerRewardResource
  destination: PlayerRewardDestination
  amount: number
}

export interface RewardHit {
  resource: PlayerRewardResource
  amount: number
}

export interface RewardPulse extends RewardHit {
  id: number
}

export interface ScreenPoint {
  x: number
  y: number
}

export interface NdcPoint {
  x: number
  y: number
}

export type ResolvePlayerRewardTarget = (destination: PlayerRewardDestination) => ScreenPoint | null
export type ResolvePlayerRewardTargetNdc = (destination: PlayerRewardDestination) => NdcPoint | null
export type HudShakeReason = 'match' | 'bomb'

export interface RewardAnimationOptions {
  resolveTargetNdc?: ResolvePlayerRewardTargetNdc
  onRewardBatchStarted?: (hitCount: number) => void
  onRewardHit?: (event: RewardHit) => void
  onMatchMultiplierChanged?: (multiplier: number) => void
  onHudShake?: (reason: HudShakeReason) => void
}

export function getPlayerCubeReward(elementType: ElementType, multiplier = 1): PlayerCubeReward {
  const amount = Math.max(1, Math.floor(multiplier))
  switch (elementType) {
    case 'fire':
      return { resource: 'fireDamage', destination: 'fireDamage', amount }
    case 'ice':
      return { resource: 'iceDamage', destination: 'iceDamage', amount }
    case 'earth':
      return { resource: 'earthDefense', destination: 'earthDefense', amount }
    case 'light':
      return { resource: 'lightDefense', destination: 'lightDefense', amount }
    case 'dark':
      return { resource: 'abilityEnergy', destination: 'portrait', amount }
  }
}
