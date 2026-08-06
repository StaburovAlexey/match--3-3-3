import { describe, expect, it } from 'vitest'
import { getPlayerCubeReward } from './RewardTarget.ts'

describe('RewardTarget', () => {
  it('maps player board elements to their resources and stat icons', () => {
    expect(getPlayerCubeReward('fire')).toEqual({
      resource: 'fireDamage',
      destination: 'fireDamage',
      amount: 1,
    })
    expect(getPlayerCubeReward('ice')).toEqual({
      resource: 'iceDamage',
      destination: 'iceDamage',
      amount: 1,
    })
    expect(getPlayerCubeReward('earth')).toEqual({
      resource: 'earthDefense',
      destination: 'earthDefense',
      amount: 1,
    })
    expect(getPlayerCubeReward('light')).toEqual({
      resource: 'lightDefense',
      destination: 'lightDefense',
      amount: 1,
    })
  })

  it('sends each dark cube to the portrait as one ability-energy point', () => {
    expect(getPlayerCubeReward('dark')).toEqual({
      resource: 'abilityEnergy',
      destination: 'portrait',
      amount: 1,
    })
  })
})
