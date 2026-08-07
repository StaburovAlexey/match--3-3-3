import { describe, expect, it } from 'vitest'
import { getScreenCrackIntensity } from './screenCrackIntensity.ts'

describe('getScreenCrackIntensity', () => {
  it('does not create a crack flash for the first regular match', () => {
    expect(getScreenCrackIntensity('match', 1)).toBeNull()
  })

  it('increases regular cascade strength up to X5', () => {
    const x2 = getScreenCrackIntensity('match', 2)
    const x3 = getScreenCrackIntensity('match', 3)
    const x4 = getScreenCrackIntensity('match', 4)
    const x5 = getScreenCrackIntensity('match', 5)

    expect(x2).not.toBeNull()
    expect(x2!.strength).toBeLessThan(x3!.strength)
    expect(x3!.strength).toBeLessThan(x4!.strength)
    expect(x4!.strength).toBeLessThan(x5!.strength)
    expect(x5!.width).toBeGreaterThan(x2!.width * 1.4)
    expect(x5!.opacity).toBeGreaterThan(x2!.opacity * 1.4)
  })

  it('makes a bomb stronger than a regular match at the same multiplier', () => {
    const match = getScreenCrackIntensity('match', 5)
    const bomb = getScreenCrackIntensity('bomb', 5)

    expect(bomb!.strength).toBeGreaterThan(match!.strength)
    expect(bomb!.opacity).toBeGreaterThan(match!.opacity)
  })
})
