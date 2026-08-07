import { describe, expect, it } from 'vitest'
import {
  createHudShakeStyle,
  getHudShakeScale,
  getScreenCrackIntensity,
} from './HudEffectsConfig.ts'

describe('HudEffectsConfig', () => {
  it('keeps the first regular match quiet and scales the cascade up to X5', () => {
    expect(getHudShakeScale('match', 1)).toBeNull()
    expect(getHudShakeScale('match', 2)).toBeLessThan(getHudShakeScale('match', 5)!)
    expect(getHudShakeScale('match', 5)).toBe(getHudShakeScale('match', 6))
    expect(getScreenCrackIntensity('match', 2)!.strength).toBeLessThan(
      getScreenCrackIntensity('match', 5)!.strength,
    )
  })

  it('keeps bomb stronger than a regular cascade', () => {
    expect(getHudShakeScale('bomb', 5)).toBeGreaterThan(getHudShakeScale('match', 5)!)
    expect(getScreenCrackIntensity('bomb', 5)!.strength).toBeGreaterThan(
      getScreenCrackIntensity('match', 5)!.strength,
    )
  })

  it('creates deterministic per-target shake variables from a random source', () => {
    const style = createHudShakeStyle(2, undefined, () => 0.5)

    expect(style).toEqual({
      '--pvp-hud-shake-x': '5px',
      '--pvp-hud-shake-y': '5px',
      '--pvp-hud-shake-angle': '1.25deg',
      '--pvp-hud-shake-duration': '540ms',
      '--pvp-hud-shake-delay': '22.5ms',
    })
  })
})
