import { gsap } from 'gsap'
import * as THREE from 'three'
import type { BoardPiece, MatchEffect } from '../../../core/model/Board.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { crackPalettes } from '../materials/CrackMaterialConfig.ts'
import { createBombExplosionConfig, type BombExplosionConfig } from './BombExplosionConfig.ts'
import type { SparkBurstAnimator } from './SparkBurstAnimator.ts'
import { createRadialGlowTexture } from './createRadialGlowTexture.ts'

export interface BombExplosionSequence {
  timeline: gsap.core.Timeline
  lastActivationOffset: number
}

interface BombExplosionVisual {
  flash: THREE.Sprite
  flashMaterial: THREE.SpriteMaterial
  rings: Array<THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>>
  ringGeometry: THREE.TorusGeometry
  ringMaterial: THREE.MeshBasicMaterial
}

export class BombExplosionAnimator {
  private readonly scene: THREE.Scene
  private readonly board: CubeBoardView
  private readonly sparks: SparkBurstAnimator
  private readonly config: BombExplosionConfig
  private readonly glowTexture: THREE.CanvasTexture
  private readonly onExplosion: (() => void) | undefined
  private readonly activeTimelines = new Map<gsap.core.Timeline, Set<BombExplosionVisual>>()

  constructor(
    scene: THREE.Scene,
    board: CubeBoardView,
    sparks: SparkBurstAnimator,
    config: BombExplosionConfig = createBombExplosionConfig(),
    onExplosion?: () => void,
  ) {
    this.scene = scene
    this.board = board
    this.sparks = sparks
    this.config = config
    this.onExplosion = onExplosion
    this.glowTexture = createRadialGlowTexture()
  }

  get chainDelay(): number {
    return this.config.chainDelay
  }

  createSequence(
    effects: readonly MatchEffect[],
    activationOffsets?: ReadonlyMap<string, number>,
  ): BombExplosionSequence {
    const bombEffects = this.getUniqueBombEffects(effects)
    if (bombEffects.length === 0) {
      return {
        timeline: gsap.timeline(),
        lastActivationOffset: 0,
      }
    }

    const visuals = new Set<BombExplosionVisual>()
    const timeline = gsap.timeline({
      onComplete: () => {
        this.activeTimelines.delete(timeline)
        this.disposeVisuals(visuals)
      },
      onInterrupt: () => {
        this.activeTimelines.delete(timeline)
        this.disposeVisuals(visuals)
      },
    })

    const starts = bombEffects.map(
      (effect, index) => activationOffsets?.get(effect.source.id) ?? index * this.config.chainDelay,
    )

    bombEffects.forEach((effect, index) => {
      const visual = this.createVisual(effect)
      const start = starts[index]
      visuals.add(visual)
      this.addExplosion(timeline, visual, start)
    })
    timeline.add(
      this.sparks.createTimeline(
        bombEffects.map((effect, index) => ({ piece: effect.source, start: starts[index] })),
      ),
      0,
    )

    this.activeTimelines.set(timeline, visuals)
    return {
      timeline,
      lastActivationOffset: Math.max(...starts),
    }
  }

  getLastActivationOffset(effects: readonly MatchEffect[]): number {
    const bombCount = this.getUniqueBombEffects(effects).length
    return Math.max(0, bombCount - 1) * this.config.chainDelay
  }

  stop(): void {
    Array.from(this.activeTimelines.entries()).forEach(([timeline, visuals]) => {
      timeline.kill()
      this.disposeVisuals(visuals)
    })
    this.activeTimelines.clear()
  }

  destroy(): void {
    this.stop()
    this.glowTexture.dispose()
  }

  private getUniqueBombEffects(effects: readonly MatchEffect[]): MatchEffect[] {
    const sourceIds = new Set<string>()

    return effects.filter((effect) => {
      if (effect.type !== 'bomb' || sourceIds.has(effect.source.id)) return false
      sourceIds.add(effect.source.id)
      return true
    })
  }

  private createVisual(effect: MatchEffect): BombExplosionVisual {
    const origin = this.board.getWorldPosition(effect.source)
    const { flashColor, ringColor } = this.getEffectColors(effect.source)

    const flashMaterial = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: flashColor,
      transparent: true,
      opacity: 0,
      depthTest: this.config.depthTest,
      depthWrite: this.config.depthWrite,
      blending: this.getBlending(),
      toneMapped: this.config.toneMapped,
    })
    const flash = new THREE.Sprite(flashMaterial)
    flash.position.copy(origin)
    flash.scale.setScalar(0.01)
    flash.renderOrder = this.config.renderOrderBase + 2
    flash.visible = false
    this.scene.add(flash)

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0,
      depthTest: this.config.depthTest,
      depthWrite: this.config.depthWrite,
      blending: this.getBlending(),
      side: THREE.DoubleSide,
      toneMapped: this.config.toneMapped,
    })
    const ringGeometry = new THREE.TorusGeometry(
      1,
      this.config.ringTubeRadius,
      Math.max(3, Math.round(this.config.ringRadialSegments)),
      Math.max(3, Math.round(this.config.ringTubularSegments)),
    )
    const rings = Array.from(
      { length: THREE.MathUtils.clamp(Math.round(this.config.ringCount), 1, 3) },
      (_, index) => {
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.position.copy(origin)
        ring.scale.setScalar(0.01)
        ring.renderOrder = this.config.renderOrderBase
        ring.visible = false
        if (index === 1) ring.rotation.x = Math.PI / 2
        if (index === 2) ring.rotation.y = Math.PI / 2
        this.scene.add(ring)
        return ring
      },
    )

    return {
      flash,
      flashMaterial,
      rings,
      ringGeometry,
      ringMaterial,
    }
  }

  private addExplosion(
    timeline: gsap.core.Timeline,
    visual: BombExplosionVisual,
    start: number,
  ): void {
    timeline.call(
      () => {
        this.onExplosion?.()
        visual.flash.visible = true
        visual.flashMaterial.opacity = this.config.flashOpacity
        visual.rings.forEach((ring) => {
          ring.visible = true
        })
        visual.ringMaterial.opacity = this.config.ringOpacity
      },
      [],
      start,
    )

    timeline
      .to(
        visual.flash.scale,
        {
          x: this.config.flashSize,
          y: this.config.flashSize,
          z: this.config.flashSize,
          duration: this.config.flashGrowDuration,
          ease: 'power3.out',
        },
        start,
      )
      .to(
        visual.flashMaterial,
        {
          opacity: 0,
          duration: this.config.flashFadeDuration,
          ease: 'power2.in',
        },
        start + this.config.flashFadeDelay,
      )
      .to(
        visual.rings.map((ring) => ring.scale),
        {
          x: this.config.explosionRadius,
          y: this.config.explosionRadius,
          z: this.config.explosionRadius,
          duration: this.config.ringDuration,
          ease: 'power2.out',
        },
        start,
      )
      .to(
        visual.ringMaterial,
        {
          opacity: 0,
          duration: this.config.ringFadeDuration,
          ease: 'power2.in',
        },
        start + this.config.ringFadeDelay,
      )
  }

  private getEffectColors(piece: BoardPiece): {
    flashColor: THREE.Color
    ringColor: THREE.Color
  } {
    if (!this.config.useElementColors) {
      return {
        flashColor: new THREE.Color(this.config.flashColor),
        ringColor: new THREE.Color(this.config.ringColor),
      }
    }
    if (piece.elementType === 'dark') {
      return {
        flashColor: new THREE.Color(this.config.darkFlashColor),
        ringColor: new THREE.Color(this.config.darkRingColor),
      }
    }

    const palette = crackPalettes[piece.elementType]
    const elementColor = new THREE.Color(palette.fillColor)
    const highlightColor = new THREE.Color(crackPalettes[piece.elementType].highlightColor)
    return {
      flashColor: elementColor.lerp(new THREE.Color(0xffffff), this.config.flashWhiteMix),
      ringColor: new THREE.Color(palette.fillColor).lerp(
        highlightColor,
        this.config.ringHighlightMix,
      ),
    }
  }

  private getBlending(): THREE.Blending {
    return this.config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending
  }

  private disposeVisuals(visuals: Set<BombExplosionVisual>): void {
    visuals.forEach((visual) => {
      visual.flash.removeFromParent()
      visual.flashMaterial.dispose()
      visual.rings.forEach((ring) => ring.removeFromParent())
      visual.ringGeometry.dispose()
      visual.ringMaterial.dispose()
    })
    visuals.clear()
  }
}
