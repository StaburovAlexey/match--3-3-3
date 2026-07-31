import { gsap } from 'gsap'
import * as THREE from 'three'
import { gameEvents } from '../../logic/events/GameEvents.ts'
import type { SwapEventPayload } from '../../logic/events/GameEvents.ts'
import type { Cube } from '../objects/Cube.ts'

interface StarParticle {
  sprite: THREE.Sprite
  material: THREE.SpriteMaterial
}

export class CubeStarEmitter {
  private readonly unsubscribeSwap: () => void
  private readonly unsubscribeRejected: () => void
  private readonly texture: THREE.CanvasTexture
  private readonly particles: StarParticle[]
  private readonly trailTimelines = new Set<gsap.core.Timeline>()
  private readonly particleTimelines = new Set<gsap.core.Timeline>()

  constructor(scene: THREE.Scene, particleCount = 48) {
    this.texture = this.createTexture()
    this.particles = Array.from({ length: particleCount }, () => {
      const material = new THREE.SpriteMaterial({
        map: this.texture,
        color: 0xffffc2,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
      })
      const sprite = new THREE.Sprite(material)
      sprite.visible = false
      sprite.renderOrder = 20
      scene.add(sprite)

      return { sprite, material }
    })

    this.unsubscribeSwap = gameEvents.on('swap-requested', this.handleSwap)
    this.unsubscribeRejected = gameEvents.on('swap-rejected', this.handleRejected)
  }

  private handleSwap = ({ first, second }: SwapEventPayload): void => {
    const firstMovement = second.position.clone().sub(first.position)
    const secondMovement = first.position.clone().sub(second.position)

    this.scheduleTrail(first, 0.35, 0.28, firstMovement, undefined, false, true)
    this.scheduleTrail(second, 0.35, 0.28, secondMovement, undefined, false, true)
  }

  private handleRejected = ({ first, second }: SwapEventPayload): void => {
    const firstStart = first.position.clone()
    const secondStart = second.position.clone()
    const centerDistance = firstStart.distanceTo(secondStart)
    const contactDistance = first.cubeGeometry.axis
    const impactProgress =
      centerDistance > 0
        ? THREE.MathUtils.clamp((centerDistance - contactDistance) / centerDistance, 0, 1)
        : 0
    const firstImpact = firstStart.clone().lerp(secondStart, impactProgress)
    const contactPoint = firstImpact.clone().lerp(secondStart, 0.5)
    const worldContactPoint = first.parent ? first.parent.localToWorld(contactPoint) : contactPoint
    const firstMovement = secondStart.clone().sub(firstStart)
    const secondMovement = firstStart.clone().sub(secondStart)

    this.scheduleTrail(first, 0.06, 0.18, firstMovement, worldContactPoint, true)
    this.scheduleTrail(second, 0.06, 0.18, secondMovement, worldContactPoint, true)
  }

  private scheduleTrail(
    cube: Cube,
    delay: number,
    duration: number,
    movementDirection: THREE.Vector3,
    origin?: THREE.Vector3,
    spreadAroundAxis = false,
    smoothTrail = false,
  ): void {
    const timeline = gsap.timeline({
      onComplete: () => {
        this.trailTimelines.delete(timeline)
      },
    })

    for (let elapsed = delay; elapsed < delay + duration; elapsed += 0.045) {
      timeline.call(
        () =>
          this.burst(
            cube,
            smoothTrail ? 3 : 2,
            movementDirection,
            origin,
            spreadAroundAxis,
            smoothTrail,
          ),
        [],
        elapsed,
      )
    }

    this.trailTimelines.add(timeline)
  }

  private burst(
    cube: Cube,
    count: number,
    movementDirection: THREE.Vector3,
    source?: THREE.Vector3,
    spreadAroundAxis = false,
    smoothTrail = false,
  ): void {
    const oppositeDirection = movementDirection.clone().normalize().negate()
    const cubeOrigin = (source ?? cube.getWorldPosition(new THREE.Vector3())).clone()
    let origin = cubeOrigin

    if (smoothTrail) {
      const axis = movementDirection.clone().normalize()
      const reference =
        Math.abs(axis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
      const faceWidth = new THREE.Vector3().crossVectors(axis, reference).normalize()
      const faceHeight = new THREE.Vector3().crossVectors(axis, faceWidth).normalize()

      origin = cubeOrigin
        .addScaledVector(oppositeDirection, cube.cubeGeometry.axis * 0.5)
        .addScaledVector(faceWidth, THREE.MathUtils.randFloatSpread(cube.cubeGeometry.axis))
        .addScaledVector(faceHeight, THREE.MathUtils.randFloatSpread(cube.cubeGeometry.axis))
    } else {
      const spreadRadius = cube.cubeGeometry.axis * 0.35
      origin.add(
        new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(spreadRadius),
          THREE.MathUtils.randFloatSpread(spreadRadius),
          THREE.MathUtils.randFloatSpread(spreadRadius),
        ),
      )
    }

    for (let index = 0; index < count; index += 1) {
      const particle = this.particles.find(({ sprite }) => !sprite.visible)

      if (!particle) {
        return
      }

      const { sprite, material } = particle
      const randomSpread = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloat(-0.7, 1.4),
        THREE.MathUtils.randFloatSpread(2),
      ).normalize()
      const direction = spreadAroundAxis
        ? this.getCircumferenceDirection(movementDirection)
        : oppositeDirection
            .clone()
            .multiplyScalar(smoothTrail ? 0.92 : 0.8)
            .add(randomSpread.multiplyScalar(smoothTrail ? 0.16 : 0.75))
            .normalize()
      const distance = smoothTrail
        ? THREE.MathUtils.randFloat(0.08, 0.2)
        : THREE.MathUtils.randFloat(0.16, 0.4)
      const target = origin.clone().addScaledVector(direction, distance)
      const size = smoothTrail
        ? THREE.MathUtils.randFloat(0.014, 0.028)
        : THREE.MathUtils.randFloat(0.012, 0.025)
      const duration = smoothTrail
        ? THREE.MathUtils.randFloat(0.55, 0.8)
        : THREE.MathUtils.randFloat(0.22, 0.4)

      gsap.killTweensOf([sprite.position, sprite.scale, material])
      sprite.visible = true
      sprite.position.copy(origin)
      sprite.scale.setScalar(size)
      material.opacity = 1

      const timeline = gsap.timeline({
        onComplete: () => {
          sprite.visible = false
          material.opacity = 0
          this.particleTimelines.delete(timeline)
        },
        onInterrupt: () => {
          this.particleTimelines.delete(timeline)
        },
      })

      timeline
        .to(
          sprite.position,
          {
            x: target.x,
            y: target.y,
            z: target.z,
            duration,
            ease: 'power2.out',
          },
          0,
        )
        .to(
          sprite.scale,
          {
            x: size * 0.15,
            y: size * 0.15,
            z: size * 0.15,
            duration,
            ease: 'power2.in',
          },
          0,
        )
        .to(
          material,
          {
            opacity: 0,
            duration: duration * 0.65,
            ease: 'power1.in',
          },
          duration * 0.35,
        )

      this.particleTimelines.add(timeline)
    }
  }

  private getCircumferenceDirection(axisDirection: THREE.Vector3): THREE.Vector3 {
    const axis = axisDirection.clone().normalize()
    const reference =
      Math.abs(axis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const firstBasis = new THREE.Vector3().crossVectors(axis, reference).normalize()
    const secondBasis = new THREE.Vector3().crossVectors(axis, firstBasis).normalize()
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2)

    return firstBasis.multiplyScalar(Math.cos(angle)).addScaledVector(secondBasis, Math.sin(angle))
  }

  private createTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Не удалось создать canvas-контекст для звёздных частиц')
    }

    const center = 16
    const glow = context.createRadialGradient(center, center, 0, center, center, 16)
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)')
    glow.addColorStop(0.18, 'rgba(255, 255, 220, 0.95)')
    glow.addColorStop(1, 'rgba(255, 255, 180, 0)')

    context.fillStyle = glow
    context.fillRect(0, 0, 32, 32)
    context.fillStyle = 'rgba(255, 255, 255, 0.95)'
    context.fillRect(15, 4, 2, 24)
    context.fillRect(4, 15, 24, 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  destroy(): void {
    this.unsubscribeSwap()
    this.unsubscribeRejected()
    this.trailTimelines.forEach((timeline) => timeline.kill())
    this.trailTimelines.clear()
    this.particleTimelines.forEach((timeline) => timeline.kill())
    this.particleTimelines.clear()

    this.particles.forEach(({ sprite, material }) => {
      sprite.removeFromParent()
      material.dispose()
    })

    this.texture.dispose()
  }
}
