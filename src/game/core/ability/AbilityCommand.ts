import type { MatchDirection } from '../model/Board.ts'
import type { ElementType } from '../model/Element.ts'

export type SegmentOrientation = 'horizontal' | 'vertical'

export type SegmentRotationPattern = 'single' | 'adjacent' | 'gap' | 'centerOrEdges'

export type AbilityEffect =
  | {
      type: 'convert'
      elementType: ElementType
      targetCount: number
    }
  | {
      type: 'swap'
    }
  | {
      type: 'rotateSegment'
      orientation: SegmentOrientation
      pattern: SegmentRotationPattern
      oppositeRotation: boolean
    }

export type AbilityDefinition = AbilityEffect

export type AbilityCommand =
  | {
      type: 'convert'
      pieceIds: readonly string[]
      elementType: ElementType
    }
  | {
      type: 'swap'
      pieceIds: readonly [string, string]
    }
  | {
      type: 'rotateSegment'
      axis: MatchDirection
      segments: readonly {
        coordinate: number
        quarterTurns: 0 | 1 | 2 | 3
        direction: 1 | -1
      }[]
    }
