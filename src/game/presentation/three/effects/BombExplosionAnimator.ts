import { gsap } from 'gsap'
import * as THREE from 'three'
import type { BoardPiece, MatchEffect } from '../../../core/model/Board.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { crackPalettes } from '../materials/CrackMaterialConfig.ts'
import { createBombExplosionConfig, type BombExplosionConfig } from './BombExplosionConfig.ts'

export interface BombExplosionSequence {
  timeline: gsap.core.Timeline
  lastActivationOffset: number
}

interface SparkVisual {
  particles: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>
  particleMaterial: THREE.PointsMaterial
  particleGeometry: THREE.BufferGeometry
  particlePositions: THREE.BufferAttribute
  directions: THREE.Vector3[]
  distances: number[]
  progress: { value: number }
}

interface BombExplosionVisual extends SparkVisual {
  flash: THREE.Sprite
  flashMaterial: THREE.SpriteMaterial
  rings: Array<THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>>
  ringGeometry: THREE.TorusGeometry
  ringMaterial: THREE.MeshBasicMaterial
}

export class BombExplosionAnimator {
  private readonly scene: THREE.Scene
  private readonly board: CubeBoardView
  private readonly config: BombExplosionConfig
  private readonly glowTexture: THREE.CanvasTexture
  private readonly activeTimelines = new Map<gsap.core.Timeline, Set<BombExplosionVisual>>()
  private readonly activeSparkTimelines = new Map<gsap.core.Timeline, Set<SparkVisual>>()

  constructor(
    scene: THREE.Scene,
    board: CubeBoardView,
    config: BombExplosionConfig = createBombExplosionConfig(),
  ) {
    this.scene = scene
    this.board = board
    this.config = config
    this.glowTexture = this.createGlowTexture()
  }

  createSequence(effects: readonly MatchEffect[]): BombExplosionSequence {
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

    bombEffects.forEach((effect, index) => {
      const visual = this.createVisual(effect)
      const start = index * this.config.chainDelay
      visuals.add(visual)
      this.addExplosion(timeline, visual, start)
    })

    this.activeTimelines.set(timeline, visuals)
    return {
      timeline,
      lastActivationOffset: (bombEffects.length - 1) * this.config.chainDelay,
    }
  }

  getLastActivationOffset(effects: readonly MatchEffect[]): number {
    const bombCount = this.getUniqueBombEffects(effects).length
    return Math.max(0, bombCount - 1) * this.config.chainDelay
  }

  createClearSparkTimeline(pieces: readonly BoardPiece[]): gsap.core.Timeline {
    const uniquePieces = Array.from(new Map(pieces.map((piece) => [piece.id, piece])).values())
    const visuals = new Set<SparkVisual>()
    const timeline = gsap.timeline({
      onComplete: () => {
        this.activeSparkTimelines.delete(timeline)
        this.disposeSparkVisuals(visuals)
      },
      onInterrupt: () => {
        this.activeSparkTimelines.delete(timeline)
        this.disposeSparkVisuals(visuals)
      },
    })

    uniquePieces.forEach((piece) => {
      const visual = this.createSparkVisual(
        this.board.getWorldPosition(piece),
        this.getParticleColor(piece),
      )
      visuals.add(visual)
      this.addSpark(timeline, visual, 0)
    })

    this.activeSparkTimelines.set(timeline, visuals)
    return timeline
  }

  stop(): void {
    Array.from(this.activeTimelines.entries()).forEach(([timeline, visuals]) => {
      timeline.kill()
      this.disposeVisuals(visuals)
    })
    this.activeTimelines.clear()
    Array.from(this.activeSparkTimelines.entries()).forEach(([timeline, visuals]) => {
      timeline.kill()
      this.disposeSparkVisuals(visuals)
    })
    this.activeSparkTimelines.clear()
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
    const { flashColor, ringColor, particleColor } = this.getEffectColors(effect.source)

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

    const spark = this.createSparkVisual(origin, particleColor)

    return {
      ...spark,
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
    this.addSpark(timeline, visual, start)
    timeline.call(
      () => {
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

  private createSparkVisual(origin: THREE.Vector3, color: THREE.Color): SparkVisual {
    const particleGeometry = new THREE.BufferGeometry()
    const particleCount = THREE.MathUtils.clamp(Math.round(this.config.particleCount), 1, 256)
    const particlePositions = new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3)
    particleGeometry.setAttribute('position', particlePositions)
    const directions = Array.from({ length: particleCount }, () => this.createRandomDirection())
    const distances = Array.from({ length: particleCount }, () =>
      this.randomBetween(this.config.particleDistanceMin, this.config.particleDistanceMax),
    )
    const particleMaterial = new THREE.PointsMaterial({
      map: this.glowTexture,
      color,
      size: this.config.particleSize,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      alphaTest: this.config.alphaTest,
      depthTest: this.config.depthTest,
      depthWrite: this.config.depthWrite,
      blending: this.getBlending(),
      toneMapped: this.config.toneMapped,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    particles.position.copy(origin)
    particles.renderOrder = this.config.renderOrderBase + 1
    particles.visible = false
    particles.frustumCulled = false
    this.scene.add(particles)

    return {
      particles,
      particleMaterial,
      particleGeometry,
      particlePositions,
      directions,
      distances,
      progress: { value: 0 },
    }
  }

  private addSpark(timeline: gsap.core.Timeline, visual: SparkVisual, start: number): void {
    timeline.call(
      () => {
        visual.particles.visible = true
        visual.particleMaterial.opacity = this.config.particleOpacity
        visual.particleMaterial.size = this.config.particleSize
      },
      [],
      start,
    )
    timeline
      .to(
        visual.progress,
        {
          value: 1,
          duration: this.config.particleDuration,
          ease: 'power2.out',
          onUpdate: () => this.updateParticles(visual),
        },
        start,
      )
      .to(
        visual.particleMaterial,
        {
          opacity: 0,
          size: this.config.particleEndSize,
          duration: this.config.particleFadeDuration,
          ease: 'power1.in',
        },
        start + this.config.particleFadeDelay,
      )
  }

  private updateParticles(visual: SparkVisual): void {
    const progress = visual.progress.value
    const easedProgress = 1 - (1 - progress) ** 3
    const gravity = progress * progress * this.config.gravity

    visual.directions.forEach((direction, index) => {
      const distance = visual.distances[index] * easedProgress
      visual.particlePositions.setXYZ(
        index,
        direction.x * distance,
        direction.y * distance - gravity,
        direction.z * distance,
      )
    })
    visual.particlePositions.needsUpdate = true
  }

  private createRandomDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
    )

    if (direction.lengthSq() < 0.001) direction.set(0, 1, 0)
    return direction.normalize()
  }

  private getParticleColor(piece: BoardPiece): THREE.Color {
    return this.getEffectColors(piece).particleColor
  }

  private getEffectColors(piece: BoardPiece): {
    flashColor: THREE.Color
    ringColor: THREE.Color
    particleColor: THREE.Color
  } {
    if (!this.config.useElementColors) {
      return {
        flashColor: new THREE.Color(this.config.flashColor),
        ringColor: new THREE.Color(this.config.ringColor),
        particleColor: new THREE.Color(this.config.particleColor),
      }
    }
    if (piece.elementType === 'dark') {
      return {
        flashColor: new THREE.Color(this.config.darkFlashColor),
        ringColor: new THREE.Color(this.config.darkRingColor),
        particleColor: new THREE.Color(this.config.darkParticleColor),
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
      particleColor: new THREE.Color(palette.highlightColor).lerp(
        new THREE.Color(0xffffff),
        this.config.particleWhiteMix,
      ),
    }
  }

  private randomBetween(first: number, second: number): number {
    return THREE.MathUtils.randFloat(Math.min(first, second), Math.max(first, second))
  }

  private getBlending(): THREE.Blending {
    return this.config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending
  }

  private createGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Не удалось создать canvas-контекст для взрыва бомбы')
    }

    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.95)')
    gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.35)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  private disposeVisuals(visuals: Set<BombExplosionVisual>): void {
    visuals.forEach((visual) => {
      visual.flash.removeFromParent()
      visual.flashMaterial.dispose()
      visual.rings.forEach((ring) => ring.removeFromParent())
      visual.ringGeometry.dispose()
      visual.ringMaterial.dispose()
      this.disposeSparkVisual(visual)
    })
    visuals.clear()
  }

  private disposeSparkVisuals(visuals: Set<SparkVisual>): void {
    visuals.forEach((visual) => this.disposeSparkVisual(visual))
    visuals.clear()
  }

  private disposeSparkVisual(visual: SparkVisual): void {
    visual.particles.removeFromParent()
    visual.particleGeometry.dispose()
    visual.particleMaterial.dispose()
  }
}
