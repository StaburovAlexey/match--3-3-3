import { gsap } from 'gsap'
import GUI from 'lil-gui'
import * as THREE from 'three'
import { RandomElementSource } from '../../../core/board/RandomElementSource.ts'
import { createCubeShellBoard } from '../../../core/board/createCubeShellBoard.ts'
import type { BoardItem, BoardPiece, GridPosition, MatchEffect } from '../../../core/model/Board.ts'
import { elementTypes, type ElementType } from '../../../core/model/Element.ts'
import { SpecialClearAnimator } from '../animation/SpecialClearAnimator.ts'
import { CubeShakeAnimator } from '../animation/CubeShakeAnimator.ts'
import { CubeBoardView } from '../board/CubeBoardView.ts'
import { BombExplosionAnimator } from '../effects/BombExplosionAnimator.ts'
import {
  createBombExplosionConfig,
  type BombExplosionConfig,
} from '../effects/BombExplosionConfig.ts'
import { ThreeScene } from '../scene/ThreeScene.ts'

interface BombExplosionLabSettings {
  elementType: ElementType
  bombCount: number
  autoReplay: boolean
  replayDelay: number
  background: string
  cameraX: number
  cameraY: number
  cameraZ: number
}

interface BombExplosionLabActions {
  play: () => void
  randomize: () => void
  reset: () => void
  copyJson: () => void
}

const sourcePositions: readonly GridPosition[] = [
  { x: 3, y: 1, z: 3 },
  { x: 2, y: 1, z: 3 },
  { x: 1, y: 2, z: 3 },
  { x: 2, y: 2, z: 3 },
]

export class BombExplosionLabRuntime {
  private readonly scene: ThreeScene
  private readonly items: BoardItem[]
  private readonly board: CubeBoardView
  private readonly shake = new CubeShakeAnimator()
  private readonly specialClear = new SpecialClearAnimator(this.shake)
  private readonly config = createBombExplosionConfig()
  private readonly explosion: BombExplosionAnimator
  private readonly gui: GUI
  private readonly settings: BombExplosionLabSettings = {
    elementType: 'fire',
    bombCount: 1,
    autoReplay: true,
    replayDelay: 0.65,
    background: '#111827',
    cameraX: 2,
    cameraY: 1.5,
    cameraZ: 2,
  }
  private readonly actions: BombExplosionLabActions
  private playback: gsap.core.Timeline | null = null
  private replayCall: gsap.core.Tween | null = null
  private feedbackCall: gsap.core.Tween | null = null
  private disposed = false

  constructor(sceneContainer: HTMLElement, guiContainer: HTMLElement) {
    this.items = createCubeShellBoard(new RandomElementSource(() => 0))
    this.scene = new ThreeScene(sceneContainer)
    this.board = new CubeBoardView(this.items)
    this.scene.scene.add(this.board.object)
    this.explosion = new BombExplosionAnimator(this.scene.scene, this.board, this.config)
    this.actions = {
      play: () => this.play(),
      randomize: () => this.play(),
      reset: () => this.reset(),
      copyJson: () => void this.copyJson(),
    }
    this.gui = new GUI({
      container: guiContainer,
      width: 360,
      title: 'Bomb Explosion Lab',
      closeFolders: true,
    })

    this.scene.setUpdateHandler((time) => this.board.update(time))
    this.createGui()
    this.updateScene()
    this.play()
  }

  play(): void {
    if (this.disposed) return
    this.stopPlayback()
    this.prepareBoard()
    const effects = this.createEffects()
    const affectedCubes = Array.from(
      new Set(effects.flatMap((effect) => effect.pieces).map((piece) => this.board.getCube(piece))),
    )
    const sequence = this.explosion.createSequence(effects)
    const timeline = gsap.timeline({
      onComplete: () => {
        this.playback = null
        this.specialClear.finish(affectedCubes)
        if (this.settings.autoReplay && !this.disposed) {
          this.replayCall = gsap.delayedCall(this.settings.replayDelay, () => this.play())
        }
      },
      onInterrupt: () => {
        this.playback = null
        this.specialClear.finish(affectedCubes)
      },
    })
    timeline.add(this.specialClear.createTimeline(affectedCubes, sequence.lastActivationOffset), 0)
    timeline.add(sequence.timeline, this.specialClear.peakTime)
    this.playback = timeline
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stopPlayback()
    this.gui.destroy()
    this.explosion.destroy()
    this.specialClear.destroy()
    this.shake.destroy()
    this.board.dispose()
    this.scene.dispose()
  }

  private createGui(): void {
    const playback = this.gui.addFolder('Воспроизведение')
    playback
      .add(this.settings, 'elementType', {
        Лёд: elementTypes[0],
        Огонь: elementTypes[1],
        Земля: elementTypes[2],
        Тьма: elementTypes[3],
        Свет: elementTypes[4],
      })
      .name('Тип элемента')
      .onFinishChange(() => this.play())
    playback
      .add(this.settings, 'bombCount', 1, sourcePositions.length, 1)
      .name('Bomb в цепочке')
      .onFinishChange(() => this.play())
    playback
      .add(this.settings, 'autoReplay')
      .name('Автоповтор')
      .onFinishChange(() => this.play())
    playback
      .add(this.settings, 'replayDelay', 0, 3, 0.01)
      .name('Пауза повтора')
      .onFinishChange(() => this.play())
    playback.add(this.actions, 'play').name('Запустить')
    playback.add(this.actions, 'randomize').name('Новый взрыв')
    playback.add(this.actions, 'reset').name('Сбросить всё')
    playback.add(this.actions, 'copyJson').name('Скопировать JSON')
    playback.open()

    const particles = this.gui.addFolder('Искры')
    this.addNumber(particles, 'particleCount', 1, 256, 1, 'Количество')
    this.addNumber(particles, 'particleSize', 0.001, 0.15, 0.001, 'Начальный размер')
    this.addNumber(particles, 'particleEndSize', 0, 0.1, 0.001, 'Конечный размер')
    this.addNumber(particles, 'particleDistanceMin', 0, 2, 0.01, 'Дальность min')
    this.addNumber(particles, 'particleDistanceMax', 0, 2, 0.01, 'Дальность max')
    this.addNumber(particles, 'particleDuration', 0.01, 3, 0.01, 'Время полёта')
    this.addNumber(particles, 'particleFadeDelay', 0, 2, 0.01, 'Задержка исчезновения')
    this.addNumber(particles, 'particleFadeDuration', 0.01, 3, 0.01, 'Исчезновение')
    this.addNumber(particles, 'particleOpacity', 0, 1, 0.01, 'Прозрачность')
    this.addNumber(particles, 'gravity', -1, 1, 0.01, 'Гравитация')

    const flash = this.gui.addFolder('Вспышка')
    this.addNumber(flash, 'flashSize', 0, 2, 0.01, 'Размер')
    this.addNumber(flash, 'flashGrowDuration', 0.01, 2, 0.01, 'Увеличение')
    this.addNumber(flash, 'flashFadeDelay', 0, 2, 0.01, 'Задержка исчезновения')
    this.addNumber(flash, 'flashFadeDuration', 0.01, 2, 0.01, 'Исчезновение')
    this.addNumber(flash, 'flashOpacity', 0, 1, 0.01, 'Прозрачность')

    const rings = this.gui.addFolder('Ударная волна')
    this.addNumber(rings, 'ringCount', 1, 3, 1, 'Количество колец')
    this.addNumber(rings, 'explosionRadius', 0, 2, 0.01, 'Радиус')
    this.addNumber(rings, 'ringTubeRadius', 0.001, 0.15, 0.001, 'Толщина')
    this.addNumber(rings, 'ringRadialSegments', 3, 24, 1, 'Радиальные сегменты')
    this.addNumber(rings, 'ringTubularSegments', 3, 128, 1, 'Сегменты окружности')
    this.addNumber(rings, 'ringOpacity', 0, 1, 0.01, 'Прозрачность')
    this.addNumber(rings, 'ringDuration', 0.01, 3, 0.01, 'Расширение')
    this.addNumber(rings, 'ringFadeDelay', 0, 2, 0.01, 'Задержка исчезновения')
    this.addNumber(rings, 'ringFadeDuration', 0.01, 3, 0.01, 'Исчезновение')

    const colors = this.gui.addFolder('Цвета')
    this.addBoolean(colors, 'useElementColors', 'Цвет элемента')
    this.addColor(colors, 'flashColor', 'Цвет вспышки')
    this.addColor(colors, 'ringColor', 'Цвет волны')
    this.addColor(colors, 'particleColor', 'Цвет искр')
    this.addColor(colors, 'darkFlashColor', 'Dark: вспышка')
    this.addColor(colors, 'darkRingColor', 'Dark: волна')
    this.addColor(colors, 'darkParticleColor', 'Dark: искры')
    this.addNumber(colors, 'flashWhiteMix', 0, 1, 0.01, 'Белый во вспышке')
    this.addNumber(colors, 'ringHighlightMix', 0, 1, 0.01, 'Highlight волны')
    this.addNumber(colors, 'particleWhiteMix', 0, 1, 0.01, 'Белый в искрах')

    const material = this.gui.addFolder('Материал')
    this.addNumber(material, 'alphaTest', 0, 1, 0.001, 'Alpha test')
    this.addBoolean(material, 'depthTest', 'Тест глубины')
    this.addBoolean(material, 'depthWrite', 'Запись глубины')
    this.addBoolean(material, 'additiveBlending', 'Свечение')
    this.addBoolean(material, 'toneMapped', 'Tone mapping')
    this.addNumber(material, 'renderOrderBase', 0, 100, 1, 'Порядок отрисовки')

    const timing = this.gui.addFolder('Цепочка')
    this.addNumber(timing, 'chainDelay', 0, 2, 0.01, 'Задержка bomb')

    const scene = this.gui.addFolder('Сцена')
    scene
      .addColor(this.settings, 'background')
      .name('Фон')
      .onChange(() => this.updateScene())
    scene
      .add(this.settings, 'cameraX', -5, 5, 0.05)
      .name('Камера X')
      .onChange(() => this.updateScene())
    scene
      .add(this.settings, 'cameraY', -5, 5, 0.05)
      .name('Камера Y')
      .onChange(() => this.updateScene())
    scene
      .add(this.settings, 'cameraZ', -5, 5, 0.05)
      .name('Камера Z')
      .onChange(() => this.updateScene())

    particles.onFinishChange(() => this.play())
    flash.onFinishChange(() => this.play())
    rings.onFinishChange(() => this.play())
    colors.onFinishChange(() => this.play())
    material.onFinishChange(() => this.play())
    timing.onFinishChange(() => this.play())
  }

  private addNumber(
    folder: GUI,
    property: keyof BombExplosionConfig,
    min: number,
    max: number,
    step: number,
    name: string,
  ): void {
    folder.add(this.config, property, min, max, step).name(name)
  }

  private addBoolean(folder: GUI, property: keyof BombExplosionConfig, name: string): void {
    folder.add(this.config, property).name(name)
  }

  private addColor(folder: GUI, property: keyof BombExplosionConfig, name: string): void {
    folder.addColor(this.config, property).name(name)
  }

  private prepareBoard(): void {
    this.items.forEach(({ piece }) => {
      piece.elementType = this.settings.elementType
      piece.special = null
      piece.active = true
    })
    this.getBombSources().forEach((piece) => {
      piece.special = { type: 'bomb' }
    })
    this.board.syncPieces(this.items.map(({ piece }) => piece))
    this.board.cubes.forEach((cube) => {
      cube.visible = true
      cube.scale.setScalar(1)
    })
  }

  private createEffects(): MatchEffect[] {
    return this.getBombSources().map((source) => ({
      source,
      type: 'bomb',
      pieces: this.getAffectedPieces(source),
    }))
  }

  private getBombSources(): BoardPiece[] {
    return sourcePositions
      .slice(0, Math.round(this.settings.bombCount))
      .map((position) =>
        this.items.find(
          ({ position: candidate }) =>
            candidate.x === position.x && candidate.y === position.y && candidate.z === position.z,
        ),
      )
      .filter((item): item is BoardItem => Boolean(item))
      .map(({ piece }) => piece)
  }

  private getAffectedPieces(source: BoardPiece): BoardPiece[] {
    const sourcePosition = this.items.find(({ piece }) => piece === source)?.position
    if (!sourcePosition) return []

    return this.items
      .filter(({ position }) => {
        const distance =
          Math.abs(position.x - sourcePosition.x) +
          Math.abs(position.y - sourcePosition.y) +
          Math.abs(position.z - sourcePosition.z)
        return distance <= 2
      })
      .map(({ piece }) => piece)
  }

  private stopPlayback(): void {
    this.replayCall?.kill()
    this.replayCall = null
    this.feedbackCall?.kill()
    this.feedbackCall = null
    this.playback?.kill()
    this.playback = null
    this.explosion.stop()
    this.specialClear.finish(this.board.cubes)
  }

  private updateScene(): void {
    this.scene.scene.background = new THREE.Color(this.settings.background)
    this.scene.camera.position.set(
      this.settings.cameraX,
      this.settings.cameraY,
      this.settings.cameraZ,
    )
    this.scene.camera.lookAt(0, 0, 0)
  }

  private reset(): void {
    Object.assign(this.config, createBombExplosionConfig())
    Object.assign(this.settings, {
      elementType: 'fire',
      bombCount: 1,
      autoReplay: true,
      replayDelay: 0.65,
      background: '#111827',
      cameraX: 2,
      cameraY: 1.5,
      cameraZ: 2,
    } satisfies BombExplosionLabSettings)
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay())
    this.updateScene()
    this.play()
  }

  private async copyJson(): Promise<void> {
    const json = JSON.stringify(this.config, null, 2)

    try {
      await navigator.clipboard.writeText(json)
      this.gui.title('Bomb Explosion Lab — JSON скопирован')
      this.feedbackCall?.kill()
      this.feedbackCall = gsap.delayedCall(1.5, () => {
        this.feedbackCall = null
        if (!this.disposed) this.gui.title('Bomb Explosion Lab')
      })
    } catch {
      console.info('BombExplosionConfig:', json)
      this.gui.title('Bomb Explosion Lab — JSON в консоли')
    }
  }
}
