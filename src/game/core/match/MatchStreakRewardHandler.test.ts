import { describe, expect, it } from 'vitest'
import { MatchStreakRewardHandler, maxMatchMultiplier } from './MatchStreakRewardHandler.ts'

describe('MatchStreakRewardHandler', () => {
  it('increases a cascade multiplier up to five', () => {
    const handler = new MatchStreakRewardHandler()

    expect(Array.from({ length: 7 }, () => handler.nextMultiplier())).toEqual([1, 2, 3, 4, 5, 5, 5])
    expect(maxMatchMultiplier).toBe(5)
  })

  it('starts a new sequence at one after reset', () => {
    const handler = new MatchStreakRewardHandler()
    handler.nextMultiplier()
    handler.nextMultiplier()

    handler.reset()

    expect(handler.nextMultiplier()).toBe(1)
  })
})
