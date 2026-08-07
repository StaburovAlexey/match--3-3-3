import type { ElementType } from '../../../core/model/Element.ts'
import { roundClashConfig } from './RoundClashConfig.ts'
import type {
  RoundClashEffectKind,
  RoundClashEffectMoment,
  RoundClashEffectSide,
  RoundClashHealthInput,
  RoundClashHealthTrack,
} from './RoundClashTypes.ts'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function randomBetween(random: () => number, min: number, max: number): number {
  return min + random() * (max - min)
}

function randomInteger(random: () => number, min: number, max: number): number {
  return Math.min(max, Math.floor(randomBetween(random, min, max + 1)))
}

function randomSigned(random: () => number, min: number, max: number): number {
  const magnitude = randomBetween(random, min, max)
  return random() < 0.5 ? -magnitude : magnitude
}

function shuffle<T>(values: T[], random: () => number): T[] {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = randomInteger(random, 0, index)
    const currentValue = values[index]
    const targetValue = values[target]

    if (currentValue === undefined || targetValue === undefined) continue
    values[index] = targetValue
    values[target] = currentValue
  }
  return values
}

function createEffectKinds(count: number, random: () => number): RoundClashEffectKind[] {
  const kinds: RoundClashEffectKind[] = ['lightning', 'explosion', 'flash']
  const randomKinds: readonly RoundClashEffectKind[] = [
    'lightning',
    'lightning',
    'explosion',
    'flash',
  ]

  while (kinds.length < count) {
    kinds.push(randomKinds[randomInteger(random, 0, randomKinds.length - 1)] ?? 'lightning')
  }
  return shuffle(kinds, random)
}

function createEffectSides(count: number, random: () => number): RoundClashEffectSide[] {
  const sides: RoundClashEffectSide[] = ['player', 'opponent']

  while (sides.length < count) {
    sides.push(random() < 0.5 ? 'player' : 'opponent')
  }
  return shuffle(sides, random)
}

function getShakeRange(kind: RoundClashEffectKind): {
  distanceMin: number
  distanceMax: number
  rotationMin: number
  rotationMax: number
} {
  if (kind === 'explosion') {
    return { distanceMin: 7, distanceMax: 11, rotationMin: 1, rotationMax: 1.8 }
  }
  if (kind === 'lightning') {
    return { distanceMin: 3, distanceMax: 5, rotationMin: 0.4, rotationMax: 0.8 }
  }
  return { distanceMin: 1.5, distanceMax: 3, rotationMin: 0.15, rotationMax: 0.4 }
}

export function createRoundClashEffectSchedule(
  playerElementType: ElementType,
  opponentElementType: ElementType,
  random: () => number = Math.random,
): RoundClashEffectMoment[] {
  const {
    effectCountMin,
    effectCountMax,
    effectStartOffset,
    effectEndPadding,
    effectXMin,
    effectXMax,
    effectYMin,
    effectYMax,
    healthDuration,
  } = roundClashConfig
  const effectCount = randomInteger(random, effectCountMin, effectCountMax)
  const kinds = createEffectKinds(effectCount, random)
  const sides = createEffectSides(effectCount, random)

  return Array.from({ length: effectCount }, (_, index): RoundClashEffectMoment => {
    const kind = kinds[index] ?? 'lightning'
    const side = sides[index] ?? 'player'
    const shake = getShakeRange(kind)
    const offset = randomBetween(random, effectStartOffset, healthDuration - effectEndPadding)

    return {
      id: index,
      kind,
      side,
      elementType: side === 'player' ? playerElementType : opponentElementType,
      offset: Number(offset.toFixed(3)),
      xPercent: Number(randomBetween(random, effectXMin, effectXMax).toFixed(2)),
      yPercent: Number(randomBetween(random, effectYMin, effectYMax).toFixed(2)),
      rotation: Number(randomBetween(random, -180, 180).toFixed(2)),
      scale: Number(randomBetween(random, 0.68, 1.42).toFixed(2)),
      flipX: random() < 0.5 ? -1 : 1,
      durationScale: Number(randomBetween(random, 0.72, 1.35).toFixed(2)),
      flickerCount: randomInteger(random, 2, 5),
      shakeX: Number(randomSigned(random, shake.distanceMin, shake.distanceMax).toFixed(2)),
      shakeY: Number(randomSigned(random, shake.distanceMin, shake.distanceMax).toFixed(2)),
      shakeRotation: Number(randomSigned(random, shake.rotationMin, shake.rotationMax).toFixed(2)),
    }
  }).sort((left, right) => left.offset - right.offset)
}

export function createRoundClashHealthTrack(input: RoundClashHealthInput): RoundClashHealthTrack {
  const maxHp = Math.max(0, Math.round(input.maxHp))
  const startHp = clamp(Math.round(input.currentHp), 0, maxHp)
  const rawDamageHp = Math.max(0, startHp - Math.max(0, Math.round(input.damageTaken)))
  const finalHp = clamp(Math.round(input.hpAfter), 0, maxHp)
  const hasHealing = finalHp > rawDamageHp

  return {
    startHp,
    damageHp: hasHealing ? rawDamageHp : finalHp,
    finalHp,
    damageDuration: hasHealing
      ? roundClashConfig.damageDurationWithHealing
      : roundClashConfig.healthDuration,
    healingDuration: hasHealing ? roundClashConfig.healingDuration : 0,
  }
}

export function getRoundClashHealthAtTime(track: RoundClashHealthTrack, elapsed: number): number {
  const safeElapsed = clamp(elapsed, 0, roundClashConfig.healthDuration)

  if (safeElapsed <= track.damageDuration || track.healingDuration === 0) {
    const progress = clamp(safeElapsed / Math.max(track.damageDuration, Number.EPSILON), 0, 1)
    return track.startHp + (track.damageHp - track.startHp) * progress
  }

  const healingProgress = clamp((safeElapsed - track.damageDuration) / track.healingDuration, 0, 1)
  return track.damageHp + (track.finalHp - track.damageHp) * healingProgress
}
