import { elementTypes } from '../model/Element.ts'
import type { AbilityEffect, SegmentOrientation, SegmentRotationPattern } from './AbilityCommand.ts'

export interface AbilityActivationRequest {
  activationId: string
  characterId: string
  abilityId: string
  effect: AbilityEffect
}

export type AbilityFailureCode =
  | 'game-busy'
  | 'duplicate-activation'
  | 'invalid-request'
  | 'invalid-selection'
  | 'no-op'
  | 'animation-cancelled'
  | 'execution-failed'

interface AbilityResultContext {
  activationId: string
  characterId: string
  abilityId: string
}

export interface AbilityAppliedResult extends AbilityResultContext {
  status: 'applied'
  affectedPieceIds: string[]
  rebuilt: boolean
}

export interface AbilityCancelledResult extends AbilityResultContext {
  status: 'cancelled'
  reason: 'player' | 'scene-disposed' | 'animation-cancelled'
}

export interface AbilityRejectedResult extends AbilityResultContext {
  status: 'rejected'
  code: AbilityFailureCode
  message: string
}

export interface AbilityFailedResult extends AbilityResultContext {
  status: 'failed'
  code: 'execution-failed'
  message: string
}

export type AbilityTerminalResult =
  | AbilityAppliedResult
  | AbilityCancelledResult
  | AbilityRejectedResult
  | AbilityFailedResult

export type AbilityBeginResult =
  | { status: 'accepted'; request: AbilityActivationRequest }
  | AbilityRejectedResult

export interface AbilityInvalidSelectionResult {
  status: 'invalid-selection'
  code: 'invalid-selection' | 'no-op'
  message: string
}

export type AbilityConfirmResult = AbilityTerminalResult | AbilityInvalidSelectionResult

export interface AbilityInteractionState {
  phase: 'idle' | 'selecting' | 'executing'
  request: AbilityActivationRequest | null
  previewBusy: boolean
  canConfirm: boolean
  error: string | null
}

export type AbilityStateListener = (state: AbilityInteractionState) => void

export interface AbilityRequestParseSuccess {
  ok: true
  value: AbilityActivationRequest
}

export interface AbilityRequestParseFailure {
  ok: false
  message: string
}

export type AbilityRequestParseResult = AbilityRequestParseSuccess | AbilityRequestParseFailure

const orientations: readonly SegmentOrientation[] = ['horizontal', 'vertical']
const patterns: readonly SegmentRotationPattern[] = ['single', 'adjacent', 'gap', 'centerOrEdges']

export function parseAbilityActivationRequest(value: unknown): AbilityRequestParseResult {
  if (!isRecord(value)) return failure('Некорректный запрос способности')
  if (!isNonEmptyString(value.activationId)) return failure('Не указан activationId способности')
  if (!isNonEmptyString(value.characterId)) return failure('Не указан characterId способности')
  if (!isNonEmptyString(value.abilityId)) return failure('Не указан abilityId способности')

  const effect = parseAbilityEffect(value.effect)
  if (!effect.ok) return effect

  return {
    ok: true,
    value: {
      activationId: value.activationId,
      characterId: value.characterId,
      abilityId: value.abilityId,
      effect: effect.value,
    },
  }
}

function parseAbilityEffect(value: unknown): { ok: true; value: AbilityEffect } | AbilityRequestParseFailure {
  if (!isRecord(value) || !isNonEmptyString(value.type)) {
    return failure('Не указан тип способности')
  }

  switch (value.type) {
    case 'convert':
      if (!elementTypes.includes(value.elementType as (typeof elementTypes)[number])) {
        return failure('Неизвестный тип элемента для convert')
      }
      if (!isPositiveInteger(value.targetCount)) {
        return failure('targetCount должен быть целым числом больше нуля')
      }
      return {
        ok: true,
        value: {
          type: 'convert',
          elementType: value.elementType as (typeof elementTypes)[number],
          targetCount: value.targetCount,
        },
      }
    case 'swap':
      return { ok: true, value: { type: 'swap' } }
    case 'rotateSegment':
      if (!orientations.includes(value.orientation as SegmentOrientation)) {
        return failure('Неизвестная ориентация сегментов')
      }
      if (!patterns.includes(value.pattern as SegmentRotationPattern)) {
        return failure('Неизвестный шаблон сегментов')
      }
      if (typeof value.oppositeRotation !== 'boolean') {
        return failure('oppositeRotation должен быть boolean')
      }
      if (value.pattern === 'single' && value.oppositeRotation) {
        return failure('Зеркальный поворот недоступен для одного сегмента')
      }
      return {
        ok: true,
        value: {
          type: 'rotateSegment',
          orientation: value.orientation as SegmentOrientation,
          pattern: value.pattern as SegmentRotationPattern,
          oppositeRotation: value.oppositeRotation,
        },
      }
    default:
      return failure(`Неизвестный тип способности: ${value.type}`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function failure(message: string): AbilityRequestParseFailure {
  return { ok: false, message }
}
