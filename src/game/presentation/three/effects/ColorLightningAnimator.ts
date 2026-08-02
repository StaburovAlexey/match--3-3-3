import { gsap } from 'gsap'
import * as THREE from 'three'
import type { BoardPiece, MatchEffect } from '../../../core/model/Board.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import { createColorLightningConfig, type ColorLightningConfig } from './ColorLightningConfig.ts'

interface LightningStrand {
  mesh: THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>
  material: THREE.MeshBasicMaterial
  drawCount: number
  baseOpacity: number
}

interface LightningPath {
  strands: LightningStrand[]
}

interface StrandStyle {
  color: number
  radius: number
  opacity: number
}

export interface LightningTargetTiming {
  piece: BoardPiece
  pathStart: number
  hitAt: number
}

export interface LightningEffectTiming {
  effect: MatchEffect
  start: number
  targets: LightningTargetTiming[]
}

export class ColorLightningAnimator {
  private readonly activeTimelines = new Map<gsap.core.Timeline, Set<LightningPath>>()
  private readonly scene: THREE.Scene
  private readonly board: CubeBoardView
  private readonly config: ColorLightningConfig

  constructor(
    scene: THREE.Scene,
    board: CubeBoardView,
    config: ColorLightningConfig = createColorLightningConfig(),
  ) {
    this.scene = scene
    this.board = board
    this.config = config
  }

  createEffectTiming(effect: MatchEffect, start: number): LightningEffectTiming {
    const sourcePosition = this.board.getWorldPosition(effect.source)
    const targets = Array.from(
      new Map(
        effect.pieces.filter((piece) => piece !== effect.source).map((piece) => [piece.id, piece]),
      ).values(),
    ).sort(
      (first, second) =>
        sourcePosition.distanceToSquared(this.board.getWorldPosition(first)) -
        sourcePosition.distanceToSquared(this.board.getWorldPosition(second)),
    )
    const delay =
      targets.length <= 1
        ? 0
        : Math.min(
            this.config.pathDelay,
            this.config.maxCascadeDuration / Math.max(1, targets.length - 1),
          )

    return {
      effect,
      start,
      targets: targets.map((piece, index) => {
        const pathStart = start + index * delay
        return {
          piece,
          pathStart,
          hitAt: pathStart + this.config.travelDuration,
        }
      }),
    }
  }

  createTimeline(timings: readonly LightningEffectTiming[]): gsap.core.Timeline {
    const paths = new Set<LightningPath>()
    const timeline = gsap.timeline({
      onComplete: () => {
        this.activeTimelines.delete(timeline)
        this.disposePaths(paths)
      },
      onInterrupt: () => {
        this.activeTimelines.delete(timeline)
        this.disposePaths(paths)
      },
    })
    timings
      .filter(({ effect }) => effect.type === 'lightning')
      .forEach(({ effect, targets }) => {
        const source = this.board.getWorldPosition(effect.source)
        targets.forEach(({ piece, pathStart }) => {
          const path = this.createPath([source, this.board.getWorldPosition(piece)])
          const progress = { value: 0 }
          paths.add(path)

          timeline.to(
            progress,
            {
              value: 1,
              duration: this.config.travelDuration,
              ease: 'power1.inOut',
              onUpdate: () => {
                path.strands.forEach(({ mesh, drawCount }) => {
                  const count = Math.floor((drawCount * progress.value) / 3) * 3
                  mesh.geometry.setDrawRange(0, count)
                })
              },
            },
            pathStart,
          )

          path.strands.forEach(({ material, baseOpacity }) => {
            timeline
              .to(
                material,
                {
                  opacity: baseOpacity * this.config.flickerOpacityFactor,
                  duration: this.config.flickerDuration,
                  repeat: Math.max(0, Math.round(this.config.flickerCount)),
                  yoyo: true,
                  ease: 'none',
                },
                pathStart + this.config.travelDuration,
              )
              .to(
                material,
                {
                  opacity: 0,
                  duration: this.config.fadeDuration,
                  ease: 'power2.in',
                },
                pathStart +
                  this.config.travelDuration +
                  this.config.flickerDuration *
                    (Math.max(0, Math.round(this.config.flickerCount)) + 1),
              )
          })
        })
      })

    this.activeTimelines.set(timeline, paths)
    return timeline
  }

  destroy(): void {
    Array.from(this.activeTimelines.entries()).forEach(([timeline, paths]) => {
      timeline.kill()
      this.disposePaths(paths)
    })
    this.activeTimelines.clear()
  }

  private createPath(cubeCenters: THREE.Vector3[]): LightningPath {
    const direction = cubeCenters[cubeCenters.length - 1].clone().sub(cubeCenters[0]).normalize()
    const firstReference =
      Math.abs(direction.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const firstPerpendicular = new THREE.Vector3()
      .crossVectors(direction, firstReference)
      .normalize()
    const secondPerpendicular = new THREE.Vector3()
      .crossVectors(direction, firstPerpendicular)
      .normalize()
    const sharedAnchors = this.createSharedAnchors(
      cubeCenters,
      firstPerpendicular,
      secondPerpendicular,
    )

    const strandStyles = this.createStrandStyles()
    const strands = strandStyles.map((style, index) => {
      const points = this.createJaggedPoints(
        sharedAnchors,
        firstPerpendicular,
        secondPerpendicular,
        index,
        strandStyles.length,
      )
      const curve = this.createAngularCurve(points)
      const geometry = new THREE.TubeGeometry(
        curve,
        Math.max(
          1,
          Math.round(this.config.minTubularSegments),
          points.length * Math.max(1, Math.round(this.config.tubularSegmentsPerPoint)),
        ),
        style.radius,
        Math.max(3, Math.round(this.config.radialSegments)),
        false,
      )
      const drawCount = geometry.getIndex()?.count ?? 0
      geometry.setDrawRange(0, 0)
      const material = new THREE.MeshBasicMaterial({
        color: style.color,
        transparent: true,
        opacity: style.opacity,
        depthTest: this.config.depthTest,
        depthWrite: this.config.depthWrite,
        blending: this.config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
        side: this.config.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
        toneMapped: this.config.toneMapped,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.renderOrder = this.config.renderOrderBase + index
      this.scene.add(mesh)

      return {
        mesh,
        material,
        drawCount,
        baseOpacity: style.opacity,
      }
    })

    return { strands }
  }

  private createJaggedPoints(
    sharedAnchors: THREE.Vector3[],
    firstPerpendicular: THREE.Vector3,
    secondPerpendicular: THREE.Vector3,
    strandIndex: number,
    strandCount: number,
  ): THREE.Vector3[] {
    const anchors = this.createStrandAnchors(
      sharedAnchors,
      firstPerpendicular,
      secondPerpendicular,
      strandIndex,
      strandCount,
    )
    const points: THREE.Vector3[] = [anchors[0].clone()]
    const subdivisions = Math.max(1, Math.round(this.config.subdivisions))
    const strandAngle = (strandIndex / strandCount) * Math.PI * 2

    for (let index = 1; index < anchors.length; index += 1) {
      const start = anchors[index - 1]
      const end = anchors[index]

      for (let step = 1; step <= subdivisions; step += 1) {
        const progress = step / subdivisions
        const point = start.clone().lerp(end, progress)

        if (step < subdivisions) {
          const angle =
            strandAngle + THREE.MathUtils.randFloatSpread(this.config.expansionAngleRandomness)
          const expansion =
            this.config.expansionBase + Math.sin(Math.PI * progress) * this.config.expansionAmount
          point.addScaledVector(
            firstPerpendicular,
            Math.cos(angle) * expansion + THREE.MathUtils.randFloatSpread(this.config.jitter),
          )
          point.addScaledVector(
            secondPerpendicular,
            Math.sin(angle) * expansion + THREE.MathUtils.randFloatSpread(this.config.jitter),
          )
        }

        points.push(point)
      }
    }

    return points
  }

  private createStrandAnchors(
    sharedAnchors: THREE.Vector3[],
    firstPerpendicular: THREE.Vector3,
    secondPerpendicular: THREE.Vector3,
    strandIndex: number,
    strandCount: number,
  ): THREE.Vector3[] {
    const baseAngle = (strandIndex / strandCount) * Math.PI * 2

    return sharedAnchors.map((anchor) => {
      const angle =
        baseAngle + THREE.MathUtils.randFloatSpread(this.config.strandAnchorAngleRandomness)
      const radius = this.randomBetween(
        this.config.strandAnchorRadiusMin,
        this.config.strandAnchorRadiusMax,
      )

      return anchor
        .clone()
        .addScaledVector(firstPerpendicular, Math.cos(angle) * radius)
        .addScaledVector(secondPerpendicular, Math.sin(angle) * radius)
    })
  }

  private createSharedAnchors(
    cubeCenters: THREE.Vector3[],
    firstPerpendicular: THREE.Vector3,
    secondPerpendicular: THREE.Vector3,
  ): THREE.Vector3[] {
    return cubeCenters.map((center) => {
      const angle = THREE.MathUtils.randFloat(0, Math.PI * 2)
      const radius = this.randomBetween(
        this.config.sharedAnchorRadiusMin,
        this.config.sharedAnchorRadiusMax,
      )

      return center
        .clone()
        .addScaledVector(firstPerpendicular, Math.cos(angle) * radius)
        .addScaledVector(secondPerpendicular, Math.sin(angle) * radius)
    })
  }

  private createAngularCurve(points: THREE.Vector3[]): THREE.CurvePath<THREE.Vector3> {
    const path = new THREE.CurvePath<THREE.Vector3>()

    for (let index = 1; index < points.length; index += 1) {
      path.add(new THREE.LineCurve3(points[index - 1], points[index]))
    }

    return path
  }

  private createStrandStyles(): StrandStyle[] {
    const count = Math.max(1, Math.round(this.config.strandCount))
    const core = new THREE.Color(this.config.coreColor)
    const middle = new THREE.Color(this.config.middleColor)
    const edge = new THREE.Color(this.config.edgeColor)

    return Array.from({ length: count }, (_, index) => {
      const progress = count === 1 ? 0 : index / (count - 1)
      const color =
        progress <= 0.5
          ? core.clone().lerp(middle, progress * 2)
          : middle.clone().lerp(edge, (progress - 0.5) * 2)

      return {
        color: color.getHex(),
        radius: THREE.MathUtils.lerp(this.config.coreRadius, this.config.edgeRadius, progress),
        opacity: THREE.MathUtils.lerp(this.config.coreOpacity, this.config.edgeOpacity, progress),
      }
    })
  }

  private randomBetween(first: number, second: number): number {
    return THREE.MathUtils.randFloat(Math.min(first, second), Math.max(first, second))
  }

  private disposePaths(paths: Set<LightningPath>): void {
    paths.forEach(({ strands }) => {
      strands.forEach(({ mesh, material }) => {
        mesh.removeFromParent()
        mesh.geometry.dispose()
        material.dispose()
      })
    })
    paths.clear()
  }
}
