import type { ElementType } from '../../../core/model/Element.ts'
import type { RoundResources } from '../../core/PvPBattleTypes.ts'

export type RoundClashEffectKind = 'lightning' | 'explosion' | 'flash'
export type RoundClashEffectSide = 'player' | 'opponent'

export interface RoundClashEffectMoment {
  readonly id: number
  readonly kind: RoundClashEffectKind
  readonly side: RoundClashEffectSide
  readonly elementType: ElementType
  readonly offset: number
  readonly xPercent: number
  readonly yPercent: number
  readonly rotation: number
  readonly scale: number
  readonly flipX: -1 | 1
  readonly durationScale: number
  readonly flickerCount: number
  readonly shakeX: number
  readonly shakeY: number
  readonly shakeRotation: number
}

export interface RoundClashHealthInput {
  readonly currentHp: number
  readonly maxHp: number
  readonly damageTaken: number
  readonly hpAfter: number
}

export interface RoundClashHealthTrack {
  readonly startHp: number
  readonly damageHp: number
  readonly finalHp: number
  readonly damageDuration: number
  readonly healingDuration: number
}

export interface RoundClashHealthProgress {
  readonly player: number
  readonly opponent: number
}

export type RoundClashPresentationPhase = 'idle' | 'intro' | 'battle' | 'complete'

export interface RoundClashPresentationResources {
  readonly player: RoundResources
  readonly opponent: RoundResources
}

export interface RoundClashPresentationState {
  readonly phase: RoundClashPresentationPhase
  readonly health: RoundClashHealthProgress | null
  readonly resources: RoundClashPresentationResources | null
}
