import { describe, expect, it } from 'vitest'
import type { BoardPiece, MatchGroup } from '../model/Board.ts'
import { MatchFinder } from './MatchFinder.ts'
import { MatchResolver } from './MatchResolver.ts'
import { SpecialEffectResolver } from './SpecialEffectResolver.ts'

describe('MatchResolver', () => {
  it('deduplicates by piece id and snapshots the destroyed element type', () => {
    const piece: BoardPiece = {
      id: 'destroyed',
      elementType: 'fire',
      special: null,
      active: true,
    }
    const duplicateReference: BoardPiece = { ...piece }
    const group: MatchGroup = {
      elementType: 'fire',
      direction: 'x',
      startPiece: piece,
      pieces: [piece, duplicateReference],
    }
    const finder = {
      findMatchesFrom: () => [group],
    } as unknown as MatchFinder
    const specials = {
      enrich: (groups: readonly MatchGroup[]) => [...groups],
    } as unknown as SpecialEffectResolver

    const resolution = new MatchResolver(finder, specials).resolveFrom([piece])
    piece.elementType = 'ice'

    expect(resolution.destroyedCubes).toEqual([{ piece, elementType: 'fire' }])
  })
})
