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

    this.scheduleTrail(first, 0.35, 0.28, firstMovement)
    this.scheduleTrail(second, 0.35, 0.28, secondMovement)
  }

  private handleRejected = ({ first, second }: SwapEventPayload): void => {
    const movement = second.position.clone().sub(first.position)
    this.scheduleTrail(first, 0.3, 0.36, movement)
  }

  private scheduleTrail(
    cube: Cube,
    delay: number,
    duration: number,
    movementDirection: THREE.Vector3,
  ): void {
    const timeline = gsap.timeline({
      onComplete: () => {
        this.trailTimelines.delete(timeline)
      },
    })

    for (let elapsed = delay; elapsed < delay + duration; elapsed += 0.045) {
      timeline.call(() => this.burst(cube, 2, movementDirection), [], elapsed)
    }

    this.trailTimelines.add(timeline)
  }

  private burst(cube: Cube, count: number, movementDirection: THREE.Vector3): void {
    const origin = cube.localToWorld(
      new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(cube.cubeGeometry.axis * 0.65),
        THREE.MathUtils.randFloatSpread(cube.cubeGeometry.axis * 0.65),
        THREE.MathUtils.randFloatSpread(cube.cubeGeometry.axis * 0.65),
      ),
    )
    const oppositeDirection = movementDirection.clone().normalize().negate()

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
      const direction = oppositeDirection
        .clone()
        .multiplyScalar(0.8)
        .add(randomSpread.multiplyScalar(0.75))
        .normalize()
      const distance = THREE.MathUtils.randFloat(0.16, 0.4)
      const target = origin.clone().addScaledVector(direction, distance)
      const size = THREE.MathUtils.randFloat(0.012, 0.025)
      const duration = THREE.MathUtils.randFloat(0.22, 0.4)

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
