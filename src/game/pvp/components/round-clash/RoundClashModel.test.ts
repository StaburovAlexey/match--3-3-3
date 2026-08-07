import { describe, expect, it } from 'vitest'
import { roundClashConfig } from './RoundClashConfig.ts'
import {
  createRoundClashEffectSchedule,
  createRoundClashHealthTrack,
  getRoundClashHealthAtTime,
} from './RoundClashModel.ts'

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

describe('RoundClashModel', () => {
  it('creates a varied ordered effect schedule across the whole battle field', () => {
    const effects = createRoundClashEffectSchedule('fire', 'ice', createSeededRandom(42))
    const offsets = effects.map(({ offset }) => offset)

    expect(effects.length).toBeGreaterThanOrEqual(roundClashConfig.effectCountMin)
    expect(effects.length).toBeLessThanOrEqual(roundClashConfig.effectCountMax)
    expect(new Set(effects.map(({ kind }) => kind))).toEqual(
      new Set(['lightning', 'explosion', 'flash']),
    )
    expect(new Set(effects.map(({ side }) => side))).toEqual(new Set(['player', 'opponent']))
    expect(offsets).toEqual([...offsets].sort((left, right) => left - right))
    expect(
      effects.every(
        ({ offset }) =>
          offset >= roundClashConfig.effectStartOffset &&
          offset <= roundClashConfig.healthDuration - roundClashConfig.effectEndPadding,
      ),
    ).toBe(true)
    expect(
      effects.every(
        ({ xPercent, yPercent }) =>
          xPercent >= roundClashConfig.effectXMin &&
          xPercent <= roundClashConfig.effectXMax &&
          yPercent >= roundClashConfig.effectYMin &&
          yPercent <= roundClashConfig.effectYMax,
      ),
    ).toBe(true)
    expect(
      effects.some(
        ({ xPercent, yPercent }) =>
          xPercent < 30 || xPercent > 70 || yPercent < 35 || yPercent > 65,
      ),
    ).toBe(true)
    expect(
      effects.every(({ side, elementType }) =>
        side === 'player' ? elementType === 'fire' : elementType === 'ice',
      ),
    ).toBe(true)
  })

  it('creates reproducible randomness for tests without repeating the same battle pattern', () => {
    const first = createRoundClashEffectSchedule('earth', 'light', createSeededRandom(7))
    const repeated = createRoundClashEffectSchedule('earth', 'light', createSeededRandom(7))
    const different = createRoundClashEffectSchedule('earth', 'light', createSeededRandom(8))

    expect(repeated).toEqual(first)
    expect(different).not.toEqual(first)
  })

  it('keeps explosion shake stronger than lightning and flash shake', () => {
    const effects = createRoundClashEffectSchedule('earth', 'light', createSeededRandom(13))
    const lightning = effects.find(({ kind }) => kind === 'lightning')
    const explosion = effects.find(({ kind }) => kind === 'explosion')
    const flash = effects.find(({ kind }) => kind === 'flash')

    expect(lightning).toBeDefined()
    expect(explosion).toBeDefined()
    expect(flash).toBeDefined()
    expect(Math.abs(explosion!.shakeX)).toBeGreaterThan(Math.abs(lightning!.shakeX))
    expect(Math.abs(lightning!.shakeX)).toBeGreaterThan(Math.abs(flash!.shakeX))
    expect(Math.abs(explosion!.shakeRotation)).toBeGreaterThan(Math.abs(lightning!.shakeRotation))
    expect(Math.abs(lightning!.shakeRotation)).toBeGreaterThan(Math.abs(flash!.shakeRotation))
  })

  it('decreases health to the exact result across all seven seconds without healing', () => {
    const track = createRoundClashHealthTrack({
      currentHp: 100,
      maxHp: 100,
      damageTaken: 25,
      hpAfter: 75,
    })

    expect(track).toEqual({
      startHp: 100,
      damageHp: 75,
      finalHp: 75,
      damageDuration: roundClashConfig.healthDuration,
      healingDuration: 0,
    })
    expect(getRoundClashHealthAtTime(track, 3.5)).toBe(87.5)
    expect(getRoundClashHealthAtTime(track, 7)).toBe(75)
  })

  it('shows damage for six seconds and healing during the final second', () => {
    const track = createRoundClashHealthTrack({
      currentHp: 100,
      maxHp: 100,
      damageTaken: 25,
      hpAfter: 85,
    })

    expect(track).toEqual({
      startHp: 100,
      damageHp: 75,
      finalHp: 85,
      damageDuration: 6,
      healingDuration: 1,
    })
    expect(getRoundClashHealthAtTime(track, 3)).toBe(87.5)
    expect(getRoundClashHealthAtTime(track, 6)).toBe(75)
    expect(getRoundClashHealthAtTime(track, 6.5)).toBe(80)
    expect(getRoundClashHealthAtTime(track, 7)).toBe(85)
  })

  it('clamps health inputs and sampled time to valid boundaries', () => {
    const track = createRoundClashHealthTrack({
      currentHp: 140,
      maxHp: 100,
      damageTaken: 250,
      hpAfter: 12,
    })

    expect(track.startHp).toBe(100)
    expect(track.damageHp).toBe(0)
    expect(getRoundClashHealthAtTime(track, -1)).toBe(100)
    expect(getRoundClashHealthAtTime(track, 20)).toBe(12)
  })
})
