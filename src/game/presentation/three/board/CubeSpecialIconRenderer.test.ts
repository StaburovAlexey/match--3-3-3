import { describe, expect, it } from 'vitest'
import {
  getSpecialIconFaceRotation,
  getSpecialIconFaces,
  selectVisibleSpecialIconFaces,
  type PositionBounds,
} from './CubeSpecialIconRenderer.ts'

const bounds: PositionBounds = {
  minX: 0,
  maxX: 3,
  minY: 0,
  maxY: 3,
  minZ: 0,
  maxZ: 3,
}

describe('getSpecialIconFaces', () => {
  it('возвращает одну внешнюю грань для куба в центре стороны', () => {
    expect(getSpecialIconFaces({ x: 0, y: 1, z: 1 }, bounds)).toEqual(['negativeX'])
  })

  it('возвращает две внешние грани для куба на ребре', () => {
    expect(getSpecialIconFaces({ x: 0, y: 0, z: 1 }, bounds)).toEqual(['negativeX', 'negativeY'])
  })

  it('возвращает все три внешние грани верхнего углового куба', () => {
    expect(getSpecialIconFaces({ x: 3, y: 3, z: 3 }, bounds)).toEqual([
      'positiveX',
      'positiveY',
      'positiveZ',
    ])
  })

  it('возвращает все три внешние грани нижнего углового куба', () => {
    expect(getSpecialIconFaces({ x: 0, y: 0, z: 0 }, bounds)).toEqual([
      'negativeX',
      'negativeY',
      'negativeZ',
    ])
  })

  it('не возвращает граней для внутреннего куба', () => {
    expect(getSpecialIconFaces({ x: 1, y: 1, z: 1 }, bounds)).toEqual([])
  })
})

describe('selectVisibleSpecialIconFaces', () => {
  it('оставляет lightning на всех внешних гранях', () => {
    expect(selectVisibleSpecialIconFaces(['negativeX', 'positiveZ'], 'lightning')).toEqual([
      'negativeX',
      'positiveZ',
    ])
  })

  it('оставляет бомбу на всех разрешённых гранях', () => {
    expect(selectVisibleSpecialIconFaces(['negativeX', 'positiveZ'], 'bomb')).toEqual([
      'negativeX',
      'positiveZ',
    ])
  })

  it('оставляет бомбу на всех трёх гранях углового куба', () => {
    expect(selectVisibleSpecialIconFaces(['positiveX', 'positiveY', 'positiveZ'], 'bomb')).toEqual([
      'positiveX',
      'positiveY',
      'positiveZ',
    ])
  })
})

describe('getSpecialIconFaceRotation', () => {
  it('не поворачивает сферическую иконку lightning', () => {
    expect(getSpecialIconFaceRotation('positiveZ', { type: 'lightning' })).toBe(0)
    expect(getSpecialIconFaceRotation('positiveY', { type: 'lightning' })).toBe(0)
  })

  it('выравнивает верх бомбы в одном направлении на верхней и нижней гранях', () => {
    expect(getSpecialIconFaceRotation('positiveY', { type: 'bomb' })).toBe(Math.PI)
    expect(getSpecialIconFaceRotation('negativeY', { type: 'bomb' })).toBe(0)
  })

  it('оставляет бомбу вертикальной на боковых гранях', () => {
    expect(getSpecialIconFaceRotation('positiveX', { type: 'bomb' })).toBe(0)
    expect(getSpecialIconFaceRotation('negativeX', { type: 'bomb' })).toBe(0)
    expect(getSpecialIconFaceRotation('positiveZ', { type: 'bomb' })).toBe(0)
    expect(getSpecialIconFaceRotation('negativeZ', { type: 'bomb' })).toBe(0)
  })
})
