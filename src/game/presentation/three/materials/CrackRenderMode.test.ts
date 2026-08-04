import { describe, expect, it } from 'vitest'
import { resolveCrackRenderMode } from './CrackRenderMode.ts'

describe('resolveCrackRenderMode', () => {
  it('включает статичные трещины по умолчанию', () => {
    expect(resolveCrackRenderMode('')).toBe('static')
    expect(resolveCrackRenderMode('?cracks=static')).toBe('static')
  })

  it('отключает трещины диагностическим параметром', () => {
    expect(resolveCrackRenderMode('?cracks=off')).toBe('off')
    expect(resolveCrackRenderMode('?foo=1&cracks=off')).toBe('off')
  })
})
