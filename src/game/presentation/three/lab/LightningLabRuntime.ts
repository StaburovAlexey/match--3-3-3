import { gsap } from 'gsap'
import GUI from 'lil-gui'
import * as THREE from 'three'
import { RandomElementSource } from '../../../core/board/RandomElementSource.ts'
import { createCubeShellBoard } from '../../../core/board/createCubeShellBoard.ts'
import type { BoardItem, MatchEffect } from '../../../core/model/Board.ts'
import type { ArrowOrientation } from '../../../core/model/Element.ts'
import { CubeBoardView } from '../board/CubeBoardView.ts'
import { ArrowLightningAnimator } from '../effects/ArrowLightningAnimator.ts'
import {
  createArrowLightningConfig,
  type ArrowLightningConfig,
} from '../effects/ArrowLightningConfig.ts'
import { ThreeScene } from '../scene/ThreeScene.ts'

interface LightningLabSettings {
  orientation: ArrowOrientation
  layer: number
  autoReplay: boolean
  replayDelay: number
  background: string
  cubeScale: number
  cameraX: number
  cameraY: number
  cameraZ: number
}

interface LightningLabActions {
  play: () => void
  randomize: () => void
  reset: () => void
  copyJson: () => void
}

export class LightningLabRuntime {
  private readonly scene: ThreeScene
  private readonly items: BoardItem[]
  private readonly board: CubeBoardView
  private readonly config = createArrowLightningConfig()
  private readonly lightning: ArrowLightningAnimator
  private readonly gui: GUI
  private readonly settings: LightningLabSettings = {
    orientation: 'horizontal',
    layer: 1,
    autoReplay: true,
    replayDelay: 0.5,
    background: '#111827',
    cubeScale: 1,
    cameraX: 2,
    cameraY: 1.5,
    cameraZ: 2,
  }
  private readonly actions: LightningLabActions
  private replayCall: gsap.core.Tween | null = null
  private feedbackCall: gsap.core.Tween | null = null
  private disposed = false

  constructor(sceneContainer: HTMLElement, guiContainer: HTMLElement) {
    this.items = createCubeShellBoard(new RandomElementSource(() => 0))
    this.scene = new ThreeScene(sceneContainer)
    this.board = new CubeBoardView(this.items)
    this.board.cubes.forEach((cube) => cube.scale.setScalar(this.settings.cubeScale))
    this.scene.scene.add(this.board.object)
    this.lightning = new ArrowLightningAnimator(this.scene.scene, this.board, this.config)
    this.actions = {
      play: () => this.play(),
      randomize: () => this.play(),
      reset: () => this.reset(),
      copyJson: () => void this.copyJson(),
    }
    this.gui = new GUI({
      container: guiContainer,
      width: 360,
      title: 'Lightning Lab',
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
    const effect = this.createEffect()
    const timeline = this.lightning.createTimeline([effect])

    if (this.settings.autoReplay) {
      this.replayCall = gsap.delayedCall(timeline.totalDuration() + this.settings.replayDelay, () =>
        this.play(),
      )
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stopPlayback()
    this.gui.destroy()
    this.board.dispose()
    this.scene.dispose()
  }

  private createGui(): void {
    const playback = this.gui.addFolder('Воспроизведение')
    playback
      .add(this.settings, 'orientation', {
        Горизонтальная: 'horizontal',
        Вертикальная: 'vertical',
      })
      .name('Ориентация')
      .onFinishChange(() => this.play())
    playback
      .add(this.settings, 'layer', 0, 3, 1)
      .name('Слой')
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
    playback.add(this.actions, 'randomize').name('Новый разряд')
    playback.add(this.actions, 'reset').name('Сбросить всё')
    playback.add(this.actions, 'copyJson').name('Скопировать JSON')
    playback.open()

    const geometry = this.gui.addFolder('Геометрия')
    this.addNumber(geometry, 'strandCount', 1, 24, 1, 'Количество линий')
    this.addNumber(geometry, 'subdivisions', 1, 10, 1, 'Изломов между кубами')
    this.addNumber(geometry, 'coreRadius', 0.0005, 0.04, 0.0005, 'Толщина центра')
    this.addNumber(geometry, 'edgeRadius', 0.0005, 0.04, 0.0005, 'Толщина края')
    this.addNumber(geometry, 'minTubularSegments', 1, 200, 1, 'Мин. сегментов')
    this.addNumber(geometry, 'tubularSegmentsPerPoint', 1, 20, 1, 'Сегментов на точку')
    this.addNumber(geometry, 'radialSegments', 3, 16, 1, 'Радиальных сегментов')

    const spread = this.gui.addFolder('Разброс и форма')
    this.addNumber(spread, 'sharedAnchorRadiusMin', 0, 0.2, 0.001, 'Общий радиус min')
    this.addNumber(spread, 'sharedAnchorRadiusMax', 0, 0.2, 0.001, 'Общий радиус max')
    this.addNumber(spread, 'strandAnchorRadiusMin', 0, 0.1, 0.001, 'Разнос линий min')
    this.addNumber(spread, 'strandAnchorRadiusMax', 0, 0.1, 0.001, 'Разнос линий max')
    this.addNumber(spread, 'strandAnchorAngleRandomness', 0, Math.PI * 2, 0.01, 'Случайность угла')
    this.addNumber(spread, 'expansionBase', 0, 0.2, 0.001, 'Расширение')
    this.addNumber(spread, 'expansionAmount', 0, 0.2, 0.001, 'Пульсация ширины')
    this.addNumber(
      spread,
      'expansionAngleRandomness',
      0,
      Math.PI * 2,
      0.01,
      'Случайность расширения',
    )
    this.addNumber(spread, 'jitter', 0, 0.1, 0.001, 'Ломаность')

    const appearance = this.gui.addFolder('Цвет и материал')
    this.addColor(appearance, 'coreColor', 'Цвет центра')
    this.addColor(appearance, 'middleColor', 'Средний цвет')
    this.addColor(appearance, 'edgeColor', 'Цвет края')
    this.addNumber(appearance, 'coreOpacity', 0, 1, 0.01, 'Прозрачность центра')
    this.addNumber(appearance, 'edgeOpacity', 0, 1, 0.01, 'Прозрачность края')
    this.addBoolean(appearance, 'depthTest', 'Тест глубины')
    this.addBoolean(appearance, 'depthWrite', 'Запись глубины')
    this.addBoolean(appearance, 'additiveBlending', 'Свечение')
    this.addBoolean(appearance, 'doubleSided', 'Две стороны')
    this.addBoolean(appearance, 'toneMapped', 'Tone mapping')
    this.addNumber(appearance, 'renderOrderBase', 0, 100, 1, 'Порядок отрисовки')

    const timing = this.gui.addFolder('Тайминги')
    this.addNumber(timing, 'pathDelay', 0, 1, 0.005, 'Задержка граней')
    this.addNumber(timing, 'travelDuration', 0.01, 3, 0.01, 'Проход молнии')
    this.addNumber(timing, 'flickerOpacityFactor', 0, 1, 0.01, 'Глубина мерцания')
    this.addNumber(timing, 'flickerDuration', 0.005, 1, 0.005, 'Шаг мерцания')
    this.addNumber(timing, 'flickerCount', 0, 20, 1, 'Мерцаний')
    this.addNumber(timing, 'fadeDuration', 0.01, 3, 0.01, 'Исчезновение')

    const scene = this.gui.addFolder('Сцена')
    scene
      .addColor(this.settings, 'background')
      .name('Фон')
      .onChange(() => this.updateScene())
    scene
      .add(this.settings, 'cubeScale', 0, 1.4, 0.01)
      .name('Размер кубов')
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

    geometry.onFinishChange(() => this.play())
    spread.onFinishChange(() => this.play())
    appearance.onFinishChange(() => this.play())
    timing.onFinishChange(() => this.play())
  }

  private addNumber(
    folder: GUI,
    property: keyof ArrowLightningConfig,
    min: number,
    max: number,
    step: number,
    name: string,
  ): void {
    folder.add(this.config, property, min, max, step).name(name)
  }

  private addBoolean(folder: GUI, property: keyof ArrowLightningConfig, name: string): void {
    folder.add(this.config, property).name(name)
  }

  private addColor(folder: GUI, property: keyof ArrowLightningConfig, name: string): void {
    folder.addColor(this.config, property).name(name)
  }

  private createEffect(): MatchEffect {
    const fixedAxis = this.settings.orientation === 'vertical' ? 'x' : 'y'
    const pieces = this.items
      .filter(({ position }) => position[fixedAxis] === this.settings.layer)
      .map(({ piece }) => piece)

    return {
      source: pieces[0],
      type: 'arrow',
      orientation: this.settings.orientation,
      pieces,
    }
  }

  private stopPlayback(): void {
    this.replayCall?.kill()
    this.replayCall = null
    this.feedbackCall?.kill()
    this.feedbackCall = null
    this.lightning.destroy()
  }

  private updateScene(): void {
    this.scene.scene.background = new THREE.Color(this.settings.background)
    this.board.cubes.forEach((cube) => cube.scale.setScalar(this.settings.cubeScale))
    this.scene.camera.position.set(
      this.settings.cameraX,
      this.settings.cameraY,
      this.settings.cameraZ,
    )
    this.scene.camera.lookAt(0, 0, 0)
  }

  private reset(): void {
    Object.assign(this.config, createArrowLightningConfig())
    Object.assign(this.settings, {
      orientation: 'horizontal',
      layer: 1,
      autoReplay: true,
      replayDelay: 0.5,
      background: '#111827',
      cubeScale: 1,
      cameraX: 2,
      cameraY: 1.5,
      cameraZ: 2,
    } satisfies LightningLabSettings)
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay())
    this.updateScene()
    this.play()
  }

  private async copyJson(): Promise<void> {
    const json = JSON.stringify(this.config, null, 2)

    try {
      await navigator.clipboard.writeText(json)
      this.gui.title('Lightning Lab — JSON скопирован')
      this.feedbackCall?.kill()
      this.feedbackCall = gsap.delayedCall(1.5, () => {
        this.feedbackCall = null
        if (!this.disposed) this.gui.title('Lightning Lab')
      })
    } catch {
      console.info('ArrowLightningConfig:', json)
      this.gui.title('Lightning Lab — JSON в консоли')
    }
  }
}
