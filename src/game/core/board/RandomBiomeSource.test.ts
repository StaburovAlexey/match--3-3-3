import { describe, expect, it } from 'vitest'
import { biomeTypes } from '../model/Biome.ts'
import { RandomBiomeSource } from './RandomBiomeSource.ts'

describe('RandomBiomeSource', () => {
  it('содержит пять биомов, соответствующих типам элементов', () => {
    expect(biomeTypes).toHaveLength(5)
    expect(new Set(biomeTypes).size).toBe(5)
  })

  it('выбирает биом по случайному значению', () => {
    expect(new RandomBiomeSource(() => 0).next()).toBe('ice')
    expect(new RandomBiomeSource(() => 0.999999).next()).toBe('light')
  })

  it('ограничивает некорректное случайное значение границами списка', () => {
    expect(new RandomBiomeSource(() => -1).next()).toBe('ice')
    expect(new RandomBiomeSource(() => 2).next()).toBe('light')
  })
})
