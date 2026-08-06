import { gsap } from 'gsap'
import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import type { BoardPiece } from '../../../core/model/Board.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { BombExplosionAnimator } from './BombExplosionAnimator.ts'
import { createBombExplosionConfig } from './BombExplosionConfig.ts'

vi.mock('./createRadialGlowTexture.ts', () => ({
  createRadialGlowTexture: () => new THREE.Texture(),
}))

describe('BombExplosionAnimator', () => {
  it('notifies HUD once for every bomb in a chain', async () => {
    const firstBomb: BoardPiece = {
      id: 'bomb-1',
      elementType: 'fire',
      special: { type: 'bomb' },
      active: true,
    }
    const secondBomb: BoardPiece = {
      id: 'bomb-2',
      elementType: 'ice',
      special: { type: 'bomb' },
      active: true,
    }
    const config = {
      ...createBombExplosionConfig(),
      chainDelay: 0.01,
      flashGrowDuration: 0,
      flashFadeDelay: 0,
      flashFadeDuration: 0,
      ringDuration: 0,
      ringFadeDelay: 0,
      ringFadeDuration: 0,
    }
    const onExplosion = vi.fn()
    const animator = new BombExplosionAnimator(
      new THREE.Scene(),
      { getWorldPosition: vi.fn(() => new THREE.Vector3()) } as unknown as CubeBoardView,
      { createTimeline: vi.fn(() => gsap.timeline()) } as never,
      config,
      onExplosion,
    )
    const sequence = animator.createSequence([
      { source: firstBomb, type: 'bomb', pieces: [firstBomb] },
      { source: secondBomb, type: 'bomb', pieces: [secondBomb] },
    ])

    await new Promise<void>((resolve) => {
      sequence.timeline.eventCallback('onComplete', resolve)
      sequence.timeline.play(0)
    })
    animator.destroy()

    expect(onExplosion).toHaveBeenCalledTimes(2)
  })
})
