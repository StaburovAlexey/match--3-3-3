import { gsap } from 'gsap'
import * as THREE from 'three'
import type { BoardPiece } from '../../../core/model/Board.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { createCubeClearGlowConfig, type CubeClearGlowConfig } from './CubeClearGlowConfig.ts'
import {
  createCubeClearGlowPath,
  getQuadraticBezierPoint,
  type CubeClearGlowPath,
} from './CubeClearGlowPath.ts'
import { createRadialGlowTexture } from './createRadialGlowTexture.ts'

export interface CubeClearGlowEntry {
  piece: BoardPiece
  start?: number
}

interface CubeClearGlowVisual {
  piece: BoardPiece
  group: THREE.Group
  core: THREE.Sprite
  halo: THREE.Sprite
  coreMaterial: THREE.SpriteMaterial
  haloMaterial: THREE.SpriteMaterial
  path: CubeClearGlowPath | null
  progress: { value: number }
}

export class CubeClearGlowAnimator {
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly board: CubeBoardView
  private readonly config: CubeClearGlowConfig
  private readonly glowTexture: THREE.CanvasTexture
  private readonly activeTimelines = new Map<gsap.core.Timeline, Set<CubeClearGlowVisual>>()
  private readonly ndcPoint = new THREE.Vector3()
  private readonly worldPoint = new THREE.Vector3()
  private readonly worldCenter = new THREE.Vector3()
  private readonly worldTop = new THREE.Vector3()

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    board: CubeBoardView,
    config: CubeClearGlowConfig = createCubeClearGlowConfig(),
  ) {
    this.scene = scene
    this.camera = camera
    this.board = board
    this.config = config
    this.glowTexture = createRadialGlowTexture()
  }

  createTimeline(entries: readonly CubeClearGlowEntry[]): gsap.core.Timeline {
    const uniqueEntries = new Map<string, Required<CubeClearGlowEntry>>()
    entries.forEach(({ piece, start = 0 }) => {
      const current = uniqueEntries.get(piece.id)
      if (!current || start < current.start) uniqueEntries.set(piece.id, { piece, start })
    })

    const visuals = new Set<CubeClearGlowVisual>()
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
      this.addFlight(timeline, visual, start)
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

  private createVisual(piece: BoardPiece): CubeClearGlowVisual {
    const elementColor = new THREE.Color(this.config.colors[piece.elementType])
    const coreMaterial = this.createMaterial(
      elementColor.clone().lerp(new THREE.Color(0xffffff), this.config.coreWhiteMix),
    )
    const haloMaterial = this.createMaterial(elementColor)
    const core = new THREE.Sprite(coreMaterial)
    const halo = new THREE.Sprite(haloMaterial)
    const group = new THREE.Group()

    core.renderOrder = this.config.renderOrderBase + 1
    halo.renderOrder = this.config.renderOrderBase
    core.frustumCulled = false
    halo.frustumCulled = false
    group.visible = false
    group.add(halo, core)
    this.scene.add(group)

    return {
      piece,
      group,
      core,
      halo,
      coreMaterial,
      haloMaterial,
      path: null,
      progress: { value: 0 },
    }
  }

  private createMaterial(color: THREE.Color): THREE.SpriteMaterial {
    return new THREE.SpriteMaterial({
      map: this.glowTexture,
      color,
      transparent: true,
      opacity: 0,
      alphaTest: this.config.alphaTest,
      depthTest: this.config.depthTest,
      depthWrite: this.config.depthWrite,
      blending: this.config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
      toneMapped: this.config.toneMapped,
    })
  }

  private addFlight(
    timeline: gsap.core.Timeline,
    visual: CubeClearGlowVisual,
    start: number,
  ): void {
    timeline.call(() => this.startVisual(visual), [], start)
    timeline.to(
      visual.progress,
      {
        value: 1,
        duration: this.config.duration,
        ease: 'power1.in',
        onUpdate: () => this.updateVisual(visual),
      },
      start,
    )
    timeline.to(
      [visual.coreMaterial, visual.haloMaterial],
      {
        opacity: 0,
        duration: this.config.fadeDuration,
        ease: 'power1.in',
      },
      start + this.config.fadeDelay,
    )
  }

  private startVisual(visual: CubeClearGlowVisual): void {
    const start = this.board.getWorldPosition(visual.piece).project(this.camera)
    visual.path = createCubeClearGlowPath(start, visual.piece.id, this.config)
    visual.progress.value = 0
    visual.coreMaterial.opacity = this.config.coreOpacity
    visual.haloMaterial.opacity = this.config.haloOpacity
    visual.group.visible = true
    this.updateVisual(visual)
  }

  private updateVisual(visual: CubeClearGlowVisual): void {
    if (!visual.path) return
    const progress = visual.progress.value
    getQuadraticBezierPoint(visual.path, progress, this.ndcPoint)
    this.worldPoint.copy(this.ndcPoint).unproject(this.camera)
    visual.group.position.copy(this.worldPoint)

    this.worldCenter.set(0, 0, this.ndcPoint.z).unproject(this.camera)
    this.worldTop.set(0, 1, this.ndcPoint.z).unproject(this.camera)
    const halfScreenHeight = this.worldCenter.distanceTo(this.worldTop)
    const scale = THREE.MathUtils.lerp(1, this.config.endScale, progress)
    visual.core.scale.setScalar(this.config.coreSize * halfScreenHeight * scale)
    visual.halo.scale.setScalar(this.config.haloSize * halfScreenHeight * scale)
  }

  private disposeVisuals(visuals: Set<CubeClearGlowVisual>): void {
    visuals.forEach(({ group, coreMaterial, haloMaterial }) => {
      group.removeFromParent()
      coreMaterial.dispose()
      haloMaterial.dispose()
    })
    visuals.clear()
  }
}
