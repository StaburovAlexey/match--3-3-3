import * as THREE from 'three'
import type { BiomeType } from '../../../core/model/Biome.ts'
import { createRadialGlowTexture } from '../effects/createRadialGlowTexture.ts'
import { biomePalettes, type BiomePalette } from './BiomePalette.ts'

interface BiomeParticleState {
  x: number
  y: number
  z: number
  phase: number
  speed: number
  drift: number
}

const particleCount = 48

export class BiomeBackground {
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly background = new THREE.Sprite()
  private readonly particles: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>
  private readonly particleGeometry: THREE.BufferGeometry
  private readonly particleMaterial: THREE.PointsMaterial
  private readonly particlePositions: THREE.BufferAttribute
  private readonly particleStates: BiomeParticleState[]
  private readonly particleTexture: THREE.CanvasTexture
  private readonly worldParticlePosition = new THREE.Vector3()
  private backgroundTexture: THREE.CanvasTexture
  private backgroundMaterial: THREE.SpriteMaterial
  private biome: BiomeType
  private disposed = false

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, biome: BiomeType) {
    this.scene = scene
    this.camera = camera
    this.biome = biome
    this.particleTexture = createRadialGlowTexture()
    this.backgroundTexture = this.createGradientTexture(biomePalettes[biome])
    this.backgroundMaterial = this.createBackgroundMaterial(this.backgroundTexture)
    this.background.material = this.backgroundMaterial
    this.background.renderOrder = -100
    this.background.frustumCulled = false
    this.scene.add(this.background)

    const particles = this.createParticles(biomePalettes[biome])
    this.particles = particles.points
    this.particleGeometry = particles.geometry
    this.particleMaterial = particles.material
    this.particlePositions = particles.positions
    this.particleStates = particles.states
    this.scene.add(this.particles)
    this.applyPalette(biome)
  }

  get currentBiome(): BiomeType {
    return this.biome
  }

  setBiome(biome: BiomeType): void {
    if (this.disposed || this.biome === biome) return
    this.biome = biome
    this.backgroundTexture.dispose()
    this.backgroundTexture = this.createGradientTexture(biomePalettes[biome])
    this.backgroundMaterial.map = this.backgroundTexture
    this.backgroundMaterial.needsUpdate = true
    this.applyPalette(biome)
  }

  update(time: number): void {
    if (this.disposed) return
    this.updateBackgroundTransform()
    this.updateParticles(time)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.background.removeFromParent()
    this.particles.removeFromParent()
    this.backgroundMaterial.dispose()
    this.backgroundTexture.dispose()
    this.particleMaterial.dispose()
    this.particleGeometry.dispose()
    this.particleTexture.dispose()
  }

  private createBackgroundMaterial(texture: THREE.CanvasTexture): THREE.SpriteMaterial {
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: false,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    })
  }

  private createGradientTexture(palette: BiomePalette): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Не удалось создать canvas для фона биома')

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, palette.backgroundTop)
    gradient.addColorStop(1, palette.backgroundBottom)
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)

    const glow = context.createRadialGradient(256, 220, 0, 256, 220, 360)
    glow.addColorStop(0, `${palette.particle}55`)
    glow.addColorStop(0.45, `${palette.particle}15`)
    glow.addColorStop(1, `${palette.particle}00`)
    context.fillStyle = glow
    context.fillRect(0, 0, canvas.width, canvas.height)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    return texture
  }

  private createParticles(palette: BiomePalette): {
    points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>
    geometry: THREE.BufferGeometry
    material: THREE.PointsMaterial
    positions: THREE.BufferAttribute
    states: BiomeParticleState[]
  } {
    const positions = new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3)
    const colors = new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3)
    const geometry = new THREE.BufferGeometry()
    const states: BiomeParticleState[] = []
    const particleColor = new THREE.Color(palette.particle)
    const highlightColor = new THREE.Color(palette.particleHighlight)

    for (let index = 0; index < particleCount; index += 1) {
      const state: BiomeParticleState = {
        x: THREE.MathUtils.randFloatSpread(3.8),
        y: THREE.MathUtils.randFloatSpread(3.2),
        z: 0,
        phase: Math.random() * Math.PI * 2,
        speed: THREE.MathUtils.randFloat(0.25, 0.7),
        drift: THREE.MathUtils.randFloat(0.015, 0.05),
      }
      states.push(state)
      positions.setXYZ(index, state.x, state.y, state.z)
      const color = particleColor.clone().lerp(highlightColor, Math.random() * 0.7)
      colors.setXYZ(index, color.r, color.g, color.b)
    }

    geometry.setAttribute('position', positions)
    geometry.setAttribute('color', colors)
    const material = new THREE.PointsMaterial({
      map: this.particleTexture,
      color: 0xffffff,
      size: 0.075,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.42,
      alphaTest: 0.01,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      toneMapped: false,
    })
    const points = new THREE.Points(geometry, material)
    points.renderOrder = -90
    points.frustumCulled = false
    return { points, geometry, material, positions, states }
  }

  private applyPalette(biome: BiomeType): void {
    const palette = biomePalettes[biome]
    this.scene.background = new THREE.Color(palette.backgroundBottom)
    const colors = this.particles.geometry.getAttribute('color') as THREE.BufferAttribute
    const particleColor = new THREE.Color(palette.particle)
    const highlightColor = new THREE.Color(palette.particleHighlight)
    this.particleStates.forEach((_state, index) => {
      const color = particleColor.clone().lerp(highlightColor, (index % 7) / 7)
      colors.setXYZ(index, color.r, color.g, color.b)
    })
    colors.needsUpdate = true
  }

  private updateBackgroundTransform(): void {
    const frame = this.getBackgroundFrame()
    this.background.position.copy(frame.origin)
    this.background.scale.set(frame.visibleWidth, frame.visibleHeight, 1)
  }

  private updateParticles(time: number): void {
    const frame = this.getBackgroundFrame()
    this.particleStates.forEach((state, index) => {
      const x = state.x + Math.sin(time * state.speed + state.phase) * state.drift
      const y = state.y + Math.cos(time * state.speed * 0.8 + state.phase) * state.drift
      this.worldParticlePosition
        .copy(frame.origin)
        .addScaledVector(frame.right, (x * frame.visibleWidth) / 2)
        .addScaledVector(frame.up, (y * frame.visibleHeight) / 2)
      this.particlePositions.setXYZ(
        index,
        this.worldParticlePosition.x,
        this.worldParticlePosition.y,
        this.worldParticlePosition.z,
      )
    })
    this.particlePositions.needsUpdate = true
  }

  private getBackgroundFrame(): {
    origin: THREE.Vector3
    right: THREE.Vector3
    up: THREE.Vector3
    visibleWidth: number
    visibleHeight: number
  } {
    const distance = this.camera.position.length() + 1.5
    const direction = this.camera.getWorldDirection(new THREE.Vector3())
    const cameraRotation = this.camera.getWorldQuaternion(new THREE.Quaternion())
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraRotation).normalize()
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cameraRotation).normalize()
    const origin = this.camera.position.clone().addScaledVector(direction, distance)
    const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5))

    return {
      origin,
      right,
      up,
      visibleWidth: visibleHeight * this.camera.aspect,
      visibleHeight,
    }
  }
}
