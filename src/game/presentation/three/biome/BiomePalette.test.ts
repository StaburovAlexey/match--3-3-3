import { describe, expect, it } from 'vitest'
import { biomePalettes, resolveVersusBiomePalette } from './BiomePalette.ts'

describe('resolveVersusBiomePalette', () => {
  it('maps the opponent to the upper palette and the player to the lower palette', () => {
    const palette = resolveVersusBiomePalette({
      opponentElementType: 'ice',
      playerElementType: 'dark',
    })

    expect(palette.opponent).toBe(biomePalettes.ice)
    expect(palette.player).toBe(biomePalettes.dark)
  })
})
