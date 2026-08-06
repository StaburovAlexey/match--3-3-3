import { gsap } from 'gsap'
import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import type { BoardPiece, MatchResolution } from '../../../core/model/Board.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import type { BombExplosionAnimator } from '../effects/BombExplosionAnimator.ts'
import type { ColorLightningAnimator } from '../effects/ColorLightningAnimator.ts'
import type { CubeClearGlowAnimator } from '../effects/CubeClearGlowAnimator.ts'
import type { SparkBurstAnimator } from '../effects/SparkBurstAnimator.ts'
import type { SpecialClearAnimator } from './SpecialClearAnimator.ts'
import { CubeMatchAnimator } from './CubeMatchAnimator.ts'

describe('CubeMatchAnimator', () => {
  it('does not block board resolution while a reward glow is still flying', async () => {
    const piece: BoardPiece = {
      id: 'fire-piece',
      elementType: 'fire',
      special: null,
      active: true,
    }
    const cube = { visible: true, scale: { setScalar: vi.fn() } }
    const clearGlow = {
      createTimeline: vi.fn(() => gsap.timeline({ paused: true }).to({}, { duration: 10 })),
      destroy: vi.fn(),
    }
    const animator = new CubeMatchAnimator(
      { getCube: vi.fn(() => cube) } as unknown as CubeBoardView,
      { finish: vi.fn(), destroy: vi.fn() } as unknown as SpecialClearAnimator,
      { destroy: vi.fn() } as unknown as ColorLightningAnimator,
      { destroy: vi.fn() } as unknown as BombExplosionAnimator,
      { destroy: vi.fn() } as unknown as SparkBurstAnimator,
      clearGlow as unknown as CubeClearGlowAnimator,
    )
    const resolution: MatchResolution = {
      groups: [
        {
          elementType: 'fire',
          direction: 'x',
          startPiece: piece,
          pieces: [piece],
        },
      ],
      destroyedCubes: [{ piece, elementType: 'fire' }],
      createdSpecials: [],
    }
    piece.elementType = 'ice'

    const result = await Promise.race([
      animator.play(resolution, 3),
      new Promise<'timed-out'>((resolve) => setTimeout(() => resolve('timed-out'), 750)),
    ])

    animator.destroy()

    expect(result).toBe('completed')
    expect(clearGlow.createTimeline).toHaveBeenCalledWith([
      {
        piece,
        start: 0.07,
        reward: { resource: 'fireDamage', destination: 'fireDamage', amount: 3 },
      },
    ])
    expect(cube.visible).toBe(false)
    expect(cube.scale.setScalar).toHaveBeenCalledWith(0)
  })

  it('creates one target-bound reward for every cube destroyed by a bomb', async () => {
    const bomb: BoardPiece = {
      id: 'bomb',
      elementType: 'fire',
      special: { type: 'bomb' },
      active: true,
    }
    const dark: BoardPiece = {
      id: 'dark',
      elementType: 'dark',
      special: null,
      active: true,
    }
    const ice: BoardPiece = {
      id: 'ice',
      elementType: 'ice',
      special: null,
      active: true,
    }
    const cubes = new Map(
      [bomb, dark, ice].map((piece) => {
        const cube = new THREE.Object3D()
        return [piece.id, cube] as const
      }),
    )
    const clearGlow = {
      createTimeline: vi.fn(() => gsap.timeline({ paused: true }).to({}, { duration: 10 })),
      destroy: vi.fn(),
    }
    const animator = new CubeMatchAnimator(
      { getCube: vi.fn((piece: BoardPiece) => cubes.get(piece.id)) } as unknown as CubeBoardView,
      {
        peakTime: 0.2,
        createStaggeredTimeline: vi.fn(() => gsap.timeline().to({}, { duration: 0.01 })),
        finish: vi.fn(),
        destroy: vi.fn(),
      } as unknown as SpecialClearAnimator,
      {
        createTimeline: vi.fn(() => gsap.timeline()),
        destroy: vi.fn(),
      } as unknown as ColorLightningAnimator,
      {
        chainDelay: 0.1,
        createSequence: vi.fn(() => ({ timeline: gsap.timeline(), lastActivationOffset: 0 })),
        destroy: vi.fn(),
      } as unknown as BombExplosionAnimator,
      {
        createTimeline: vi.fn(() => gsap.timeline()),
        destroy: vi.fn(),
      } as unknown as SparkBurstAnimator,
      clearGlow as unknown as CubeClearGlowAnimator,
    )
    const resolution: MatchResolution = {
      groups: [
        {
          elementType: 'fire',
          direction: 'x',
          startPiece: bomb,
          pieces: [bomb, dark, ice],
          effects: [{ source: bomb, type: 'bomb', pieces: [bomb, dark, ice] }],
        },
      ],
      destroyedCubes: [bomb, dark, ice].map((piece) => ({
        piece,
        elementType: piece.elementType,
      })),
      createdSpecials: [],
    }

    await animator.play(resolution, 4)
    animator.destroy()

    expect(clearGlow.createTimeline).toHaveBeenCalledWith([
      {
        piece: bomb,
        start: 0.2,
        reward: { resource: 'fireDamage', destination: 'fireDamage', amount: 4 },
      },
      {
        piece: dark,
        start: 0.2,
        reward: { resource: 'abilityEnergy', destination: 'portrait', amount: 4 },
      },
      {
        piece: ice,
        start: 0.2,
        reward: { resource: 'iceDamage', destination: 'iceDamage', amount: 4 },
      },
    ])
  })
})
