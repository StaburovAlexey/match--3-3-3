import { gsap } from 'gsap'
import * as THREE from 'three'
import type { BoardPiece } from '../../../core/model/Board.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { crackPalettes } from '../materials/CrackMaterialConfig.ts'
import { createSparkBurstConfig, type SparkBurstConfig } from './SparkBurstConfig.ts'
import { createRadialGlowTexture } from './createRadialGlowTexture.ts'

export interface SparkBurstEntry {
  piece: BoardPiece
  start?: number
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

export class SparkBurstAnimator {
  private readonly scene: THREE.Scene
  private readonly board: CubeBoardView
  private readonly config: SparkBurstConfig
  private readonly glowTexture: THREE.CanvasTexture
  private readonly activeTimelines = new Map<gsap.core.Timeline, Set<SparkVisual>>()

  constructor(
    scene: THREE.Scene,
    board: CubeBoardView,
    config: SparkBurstConfig = createSparkBurstConfig(),
  ) {
    this.scene = scene
    this.board = board
    this.config = config
    this.glowTexture = createRadialGlowTexture()
  }

  createTimeline(entries: readonly SparkBurstEntry[]): gsap.core.Timeline {
    const uniqueEntries = new Map<string, Required<SparkBurstEntry>>()
    entries.forEach(({ piece, start = 0 }) => {
      const current = uniqueEntries.get(piece.id)
      if (!current || start < current.start) uniqueEntries.set(piece.id, { piece, start })
    })

    const visuals = new Set<SparkVisual>()
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

    uniqueEntries.forEach(({ piece, start }) => {
      const visual = this.createVisual(piece)
      visuals.add(visual)
      this.addBurst(timeline, visual, start)
    })

    if (visuals.size > 0) this.activeTimelines.set(timeline, visuals)
    return timeline
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

  private createVisual(piece: BoardPiece): SparkVisual {
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
      color: this.getParticleColor(piece),
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
    particles.position.copy(this.board.getWorldPosition(piece))
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

  private addBurst(timeline: gsap.core.Timeline, visual: SparkVisual, start: number): void {
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
    if (!this.config.useElementColors) return new THREE.Color(this.config.particleColor)
    if (piece.elementType === 'dark') return new THREE.Color(this.config.darkParticleColor)

    return new THREE.Color(crackPalettes[piece.elementType].highlightColor).lerp(
      new THREE.Color(0xffffff),
      this.config.particleWhiteMix,
    )
  }

  private randomBetween(first: number, second: number): number {
    return THREE.MathUtils.randFloat(Math.min(first, second), Math.max(first, second))
  }

  private getBlending(): THREE.Blending {
    return this.config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending
  }

  private disposeVisuals(visuals: Set<SparkVisual>): void {
    visuals.forEach(({ particles, particleGeometry, particleMaterial }) => {
      particles.removeFromParent()
      particleGeometry.dispose()
      particleMaterial.dispose()
    })
    visuals.clear()
  }
}
