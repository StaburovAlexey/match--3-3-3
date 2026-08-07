import * as THREE from 'three'
import type { BiomeType } from '../../../core/model/Biome.ts'
import { createRadialGlowTexture } from '../effects/createRadialGlowTexture.ts'
import {
  biomePalettes,
  resolveVersusBiomePalette,
  type BiomePalette,
  type VersusBiomeTypes,
} from './BiomePalette.ts'

interface BiomeParticleState {
  x: number
  y: number
  z: number
  phase: number
  speed: number
  drift: number
}

interface BackgroundFrame {
  origin: THREE.Vector3
  right: THREE.Vector3
  up: THREE.Vector3
  visibleWidth: number
  visibleHeight: number
}

const particleCount = 64

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
  private readonly cameraDirection = new THREE.Vector3()
  private readonly cameraRotation = new THREE.Quaternion()
  private readonly lastCameraPosition = new THREE.Vector3()
  private readonly lastCameraRotation = new THREE.Quaternion()
  private lastCameraAspect = 0
  private lastCameraFov = 0
  private hasCameraFrame = false
  private readonly backgroundFrame: BackgroundFrame = {
    origin: new THREE.Vector3(),
    right: new THREE.Vector3(),
    up: new THREE.Vector3(),
    visibleWidth: 0,
    visibleHeight: 0,
  }
  private backgroundTexture: THREE.CanvasTexture
  private backgroundMaterial: THREE.SpriteMaterial
  private biome: BiomeType
  private readonly versusBackground?: VersusBiomeTypes
  private disposed = false

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    biome: BiomeType,
    versusBackground?: VersusBiomeTypes,
  ) {
    this.scene = scene
    this.camera = camera
    this.biome = biome
    this.versusBackground = versusBackground
    this.particleTexture = createRadialGlowTexture()
    this.backgroundTexture = this.createBackgroundTexture(biome)
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
    if (this.disposed || this.versusBackground || this.biome === biome) return
    this.biome = biome
    this.backgroundTexture.dispose()
    this.backgroundTexture = this.createBackgroundTexture(biome)
    this.backgroundMaterial.map = this.backgroundTexture
    this.backgroundMaterial.needsUpdate = true
    this.applyPalette(biome)
  }

  update(time: number): void {
    if (this.disposed) return
    const frame = this.updateBackgroundFrame()
    this.updateBackgroundTransform(frame)
    this.updateParticles(time, frame)
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

  private createBackgroundTexture(biome: BiomeType): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Не удалось создать canvas для фона биома')

    if (this.versusBackground) {
      this.drawVersusBackground(context, canvas, this.versusBackground)
    } else {
      this.drawSingleBiomeBackground(context, canvas, biomePalettes[biome])
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    return texture
  }

  private drawSingleBiomeBackground(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    palette: BiomePalette,
  ): void {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, palette.backgroundTop)
    gradient.addColorStop(1, palette.backgroundBottom)
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    this.drawGlow(context, canvas, palette.particle, 256, 220, 360)
  }

  private drawVersusBackground(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    types: VersusBiomeTypes,
  ): void {
    const { opponent, player } = resolveVersusBiomePalette(types)
    const gradient = context.createLinearGradient(canvas.width, 0, 0, canvas.height)
    gradient.addColorStop(0, opponent.backgroundTop)
    gradient.addColorStop(0.42, opponent.backgroundBottom)
    gradient.addColorStop(0.54, player.backgroundTop)
    gradient.addColorStop(1, player.backgroundBottom)
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)

    this.drawGlow(context, canvas, opponent.particle, 332, 140, 300)
    this.drawGlow(context, canvas, player.particle, 180, 372, 300)
  }

  private drawGlow(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    color: string,
    x: number,
    y: number,
    radius: number,
  ): void {
    const glow = context.createRadialGradient(x, y, 0, x, y, radius)
    glow.addColorStop(0, `${color}55`)
    glow.addColorStop(0.45, `${color}15`)
    glow.addColorStop(1, `${color}00`)
    context.fillStyle = glow
    context.fillRect(0, 0, canvas.width, canvas.height)
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
    if (this.versusBackground) {
      this.applyVersusPalette(this.versusBackground)
      return
    }

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

  private applyVersusPalette(types: VersusBiomeTypes): void {
    const { opponent, player } = resolveVersusBiomePalette(types)
    this.scene.background = new THREE.Color(player.backgroundBottom)
    const colors = this.particles.geometry.getAttribute('color') as THREE.BufferAttribute

    this.particleStates.forEach((state, index) => {
      const horizontalPosition = state.x / 1.9
      const verticalPosition = state.y / 1.6
      const playerMix = THREE.MathUtils.smoothstep(
        -horizontalPosition - verticalPosition,
        -0.2,
        0.12,
      )
      const highlightMix = (index % 7) / 7
      const opponentColor = new THREE.Color(opponent.particle).lerp(
        new THREE.Color(opponent.particleHighlight),
        highlightMix,
      )
      const playerColor = new THREE.Color(player.particle).lerp(
        new THREE.Color(player.particleHighlight),
        highlightMix,
      )
      opponentColor.lerp(playerColor, playerMix)
      colors.setXYZ(index, opponentColor.r, opponentColor.g, opponentColor.b)
    })
    colors.needsUpdate = true
  }

  private updateBackgroundTransform(frame: BackgroundFrame): void {
    this.background.position.copy(frame.origin)
    this.background.scale.set(frame.visibleWidth, frame.visibleHeight, 1)
  }

  private updateParticles(time: number, frame: BackgroundFrame): void {
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

  private updateBackgroundFrame(): BackgroundFrame {
    const cameraFrameChanged =
      !this.hasCameraFrame ||
      !this.camera.position.equals(this.lastCameraPosition) ||
      !this.camera.quaternion.equals(this.lastCameraRotation) ||
      this.camera.aspect !== this.lastCameraAspect ||
      this.camera.fov !== this.lastCameraFov

    if (!cameraFrameChanged) return this.backgroundFrame

    this.lastCameraPosition.copy(this.camera.position)
    this.lastCameraRotation.copy(this.camera.quaternion)
    this.lastCameraAspect = this.camera.aspect
    this.lastCameraFov = this.camera.fov
    this.hasCameraFrame = true

    const distance = this.camera.position.length() + 1.5
    this.camera.getWorldDirection(this.cameraDirection)
    this.camera.getWorldQuaternion(this.cameraRotation)
    this.backgroundFrame.right.set(1, 0, 0).applyQuaternion(this.cameraRotation).normalize()
    this.backgroundFrame.up.set(0, 1, 0).applyQuaternion(this.cameraRotation).normalize()
    this.backgroundFrame.origin
      .copy(this.camera.position)
      .addScaledVector(this.cameraDirection, distance)
    const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5))

    this.backgroundFrame.visibleWidth = visibleHeight * this.camera.aspect
    this.backgroundFrame.visibleHeight = visibleHeight
    return this.backgroundFrame
  }
}
