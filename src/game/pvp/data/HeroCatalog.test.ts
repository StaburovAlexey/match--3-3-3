import { describe, expect, it } from 'vitest'
import { elementTypes } from '../../core/model/Element.ts'
import { defaultOpponentHero, defaultPlayerHero, heroCatalog } from './HeroCatalog.ts'

describe('heroCatalog', () => {
  it('contains one complete hero for every cube element', () => {
    expect(heroCatalog).toHaveLength(elementTypes.length)
    expect(new Set(heroCatalog.map(({ id }) => id)).size).toBe(heroCatalog.length)
    expect(heroCatalog.map(({ elementType }) => elementType).sort()).toEqual(
      [...elementTypes].sort(),
    )

    heroCatalog.forEach((hero) => {
      expect(hero.portraitUrl).not.toBe('')
      expect(hero.maxHp).toBeGreaterThan(0)
      expect(hero.abilities.map(({ kind }) => kind)).toEqual(['active', 'passive', 'ultimate'])
      hero.abilities.forEach((ability) => {
        expect(ability.iconUrl).not.toBe('')
        expect(ability.description).not.toBe('')
      })
    })
  })

  it('keeps the quick-start pair stable', () => {
    expect(defaultPlayerHero.id).toBe('shadow-rift')
    expect(defaultOpponentHero.id).toBe('valexey')
  })
})
