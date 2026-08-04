import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createCubeClearGlowConfig } from './CubeClearGlowConfig.ts'
import { createCubeClearGlowPath, getCubeClearGlowSide } from './CubeClearGlowPath.ts'

const config = createCubeClearGlowConfig()

describe('CubeClearGlowPath', () => {
  it('изгибает левую позицию наружу влево', () => {
    const path = createCubeClearGlowPath(new THREE.Vector3(-0.3, 0.2, 0.5), 'left', config)

    expect(path.side).toBe(-1)
    expect(path.control.x).toBeLessThan(path.start.x)
    expect(path.end.y).toBeLessThan(-1)
  })

  it('изгибает правую позицию наружу вправо', () => {
    const path = createCubeClearGlowPath(new THREE.Vector3(0.3, 0.2, 0.5), 'right', config)

    expect(path.side).toBe(1)
    expect(path.control.x).toBeGreaterThan(path.start.x)
    expect(path.end.y).toBeLessThan(-1)
  })

  it('стабильно выбирает сторону для куба в центре', () => {
    const first = getCubeClearGlowSide(0, 'same-piece')
    const second = getCubeClearGlowSide(0, 'same-piece')

    expect(second).toBe(first)
  })
})
