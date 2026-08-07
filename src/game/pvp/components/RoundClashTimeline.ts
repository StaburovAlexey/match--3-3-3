import type { ElementType } from '../../core/model/Element.ts'

export const roundClashTimelineConfig = Object.freeze({
  introDuration: 2,
  overlayFadeDuration: 0.3,
  healthDuration: 7,
  damageDurationWithHealing: 6,
  healingDuration: 1,
  effectCountMin: 10,
  effectCountMax: 15,
  effectStartOffset: 0.25,
  effectEndPadding: 0.9,
  effectXMin: 8,
  effectXMax: 92,
  effectYMin: 8,
  effectYMax: 92,
  lightningDuration: 0.5,
  explosionDuration: 0.62,
  flashDuration: 0.34,
  lightningShakeDuration: 0.24,
  explosionShakeDuration: 0.38,
  flashShakeDuration: 0.16,
})

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
  } = roundClashTimelineConfig
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
      ? roundClashTimelineConfig.damageDurationWithHealing
      : roundClashTimelineConfig.healthDuration,
    healingDuration: hasHealing ? roundClashTimelineConfig.healingDuration : 0,
  }
}

export function getRoundClashHealthAtTime(track: RoundClashHealthTrack, elapsed: number): number {
  const safeElapsed = clamp(elapsed, 0, roundClashTimelineConfig.healthDuration)

  if (safeElapsed <= track.damageDuration || track.healingDuration === 0) {
    const progress = clamp(safeElapsed / Math.max(track.damageDuration, Number.EPSILON), 0, 1)
    return track.startHp + (track.damageHp - track.startHp) * progress
  }

  const healingProgress = clamp((safeElapsed - track.damageDuration) / track.healingDuration, 0, 1)
  return track.damageHp + (track.finalHp - track.damageHp) * healingProgress
}
