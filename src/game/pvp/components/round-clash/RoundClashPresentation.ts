import type { RoundResolutionResult, RoundSnapshot } from '../../core/PvPBattleTypes.ts'
import type {
  RoundClashHealthProgress,
  RoundClashPresentationPhase,
  RoundClashPresentationState,
} from './RoundClashTypes.ts'

function resourcesFromSnapshot(snapshot: RoundSnapshot) {
  return {
    fireDamage: snapshot.fireDamage,
    iceDamage: snapshot.iceDamage,
    earthDefense: snapshot.earthDefense,
    lightDefense: snapshot.lightDefense,
    abilityEnergy: snapshot.abilityEnergy,
  }
}

export function createIdleRoundClashPresentation(): RoundClashPresentationState {
  return { phase: 'idle', health: null, resources: null }
}

export function createIntroRoundClashPresentation(
  resolution: RoundResolutionResult,
): RoundClashPresentationState {
  return {
    phase: 'intro',
    health: {
      player: resolution.playerSnapshot.currentHp,
      opponent: resolution.opponentSnapshot.currentHp,
    },
    resources: {
      player: resourcesFromSnapshot(resolution.playerSnapshot),
      opponent: resourcesFromSnapshot(resolution.opponentSnapshot),
    },
  }
}

export function setRoundClashPresentationPhase(
  state: RoundClashPresentationState,
  phase: Exclude<RoundClashPresentationPhase, 'idle' | 'intro'>,
): RoundClashPresentationState {
  return { ...state, phase }
}

export function setRoundClashPresentationHealth(
  state: RoundClashPresentationState,
  health: RoundClashHealthProgress,
): RoundClashPresentationState {
  return { ...state, health: { ...health } }
}
