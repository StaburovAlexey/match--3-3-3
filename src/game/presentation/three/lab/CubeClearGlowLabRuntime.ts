import { gsap } from 'gsap'
import GUI from 'lil-gui'
import * as THREE from 'three'
import type { BoardItem, BoardPiece } from '../../../core/model/Board.ts'
import { elementTypes, type ElementType } from '../../../core/model/Element.ts'
import { CubeBoardView } from '../board/CubeBoardView.ts'
import { CubeClearGlowAnimator } from '../effects/CubeClearGlowAnimator.ts'
import {
  createCubeClearGlowConfig,
  type CubeClearGlowConfig,
} from '../effects/CubeClearGlowConfig.ts'
import { ThreeScene } from '../scene/ThreeScene.ts'

type PreviewPosition = 'left' | 'center' | 'right'
type NumberConfigKey = {
  [Key in keyof CubeClearGlowConfig]: CubeClearGlowConfig[Key] extends number ? Key : never
}[keyof CubeClearGlowConfig]
type BooleanConfigKey = {
  [Key in keyof CubeClearGlowConfig]: CubeClearGlowConfig[Key] extends boolean ? Key : never
}[keyof CubeClearGlowConfig]

interface CubeClearGlowLabSettings {
  elementType: ElementType
  previewPosition: PreviewPosition
  autoReplay: boolean
  replayDelay: number
  background: string
  cameraX: number
  cameraY: number
  cameraZ: number
}

interface CubeClearGlowLabActions {
  play: () => void
  reset: () => void
  copyJson: () => void
}

export class CubeClearGlowLabRuntime {
  private readonly scene: ThreeScene
  private readonly piece: BoardPiece = {
    id: 'clear-glow-preview',
    elementType: 'ice',
    special: null,
    active: true,
  }
  private readonly board: CubeBoardView
  private readonly config = createCubeClearGlowConfig()
  private readonly glow: CubeClearGlowAnimator
  private readonly gui: GUI
  private readonly settings: CubeClearGlowLabSettings = {
    elementType: 'ice',
    previewPosition: 'center',
    autoReplay: true,
    replayDelay: 0.65,
    background: '#111827',
    cameraX: 2,
    cameraY: 1.5,
    cameraZ: 2,
  }
  private readonly actions: CubeClearGlowLabActions
  private playback: gsap.core.Timeline | null = null
  private replayCall: gsap.core.Tween | null = null
  private feedbackCall: gsap.core.Tween | null = null
  private disposed = false

  constructor(sceneContainer: HTMLElement, guiContainer: HTMLElement) {
    const items: BoardItem[] = [{ piece: this.piece, position: { x: 1, y: 1, z: 1 } }]
    this.scene = new ThreeScene(sceneContainer)
    this.board = new CubeBoardView(items)
    this.scene.scene.add(this.board.object)
    this.glow = new CubeClearGlowAnimator(
      this.scene.scene,
      this.scene.camera,
      this.board,
      this.config,
    )
    this.actions = {
      play: () => this.play(),
      reset: () => this.reset(),
      copyJson: () => void this.copyJson(),
    }
    this.gui = new GUI({
      container: guiContainer,
      width: 360,
      title: 'Cube Clear Glow Lab',
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
    this.prepareCube()

    const cube = this.board.getCube(this.piece)
    const clearStart = 0.07
    const shrinkDuration = 0.14
    const timeline = gsap.timeline({
      onComplete: () => {
        this.playback = null
      },
      onInterrupt: () => {
        this.playback = null
      },
    })
    timeline.to(
      cube.scale,
      { x: 1.12, y: 1.12, z: 1.12, duration: clearStart, ease: 'back.out(1.7)' },
      0,
    )
    timeline.call(() => this.glow.createTimeline([{ piece: this.piece }]), [], clearStart)
    timeline.to(
      cube.scale,
      { x: 0, y: 0, z: 0, duration: shrinkDuration, ease: 'power2.in' },
      clearStart,
    )
    this.playback = timeline

    if (this.settings.autoReplay) {
      const glowDuration = Math.max(
        this.config.duration,
        this.config.fadeDelay + this.config.fadeDuration,
      )
      this.replayCall = gsap.delayedCall(
        clearStart + glowDuration + this.settings.replayDelay,
        () => this.play(),
      )
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stopPlayback()
    this.gui.destroy()
    this.glow.destroy()
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
      .add(this.settings, 'previewPosition', {
        Слева: 'left',
        'По центру': 'center',
        Справа: 'right',
      })
      .name('Позиция куба')
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
    playback.add(this.actions, 'reset').name('Сбросить всё')
    playback.add(this.actions, 'copyJson').name('Скопировать JSON')
    playback.open()

    const appearance = this.gui.addFolder('Свечение')
    this.addNumber(appearance, 'coreSize', 0.005, 0.3, 0.001, 'Размер ядра')
    this.addNumber(appearance, 'haloSize', 0.01, 0.5, 0.001, 'Размер ореола')
    this.addNumber(appearance, 'endScale', 0, 2, 0.01, 'Размер в конце')
    this.addNumber(appearance, 'coreOpacity', 0, 1, 0.01, 'Яркость ядра')
    this.addNumber(appearance, 'haloOpacity', 0, 1, 0.01, 'Яркость ореола')
    this.addNumber(appearance, 'coreWhiteMix', 0, 1, 0.01, 'Белый в ядре')

    const motion = this.gui.addFolder('Траектория')
    this.addNumber(motion, 'duration', 0.05, 3, 0.01, 'Время полёта')
    this.addNumber(motion, 'arcOutward', 0, 2, 0.01, 'Изгиб наружу')
    this.addNumber(motion, 'endOutward', -1, 1, 0.01, 'Смещение в конце')
    this.addNumber(motion, 'controlYProgress', 0, 1, 0.01, 'Высота изгиба')
    this.addNumber(motion, 'endY', -2, 0, 0.01, 'Нижняя граница')
    this.addNumber(motion, 'fadeDelay', 0, 3, 0.01, 'Задержка fade')
    this.addNumber(motion, 'fadeDuration', 0.01, 3, 0.01, 'Время fade')

    const colors = this.gui.addFolder('Цвета элементов')
    colors.addColor(this.config.colors, 'ice').name('Лёд')
    colors.addColor(this.config.colors, 'fire').name('Огонь')
    colors.addColor(this.config.colors, 'earth').name('Земля')
    colors.addColor(this.config.colors, 'dark').name('Тьма')
    colors.addColor(this.config.colors, 'light').name('Свет')

    const material = this.gui.addFolder('Материал')
    this.addNumber(material, 'alphaTest', 0, 1, 0.001, 'Alpha test')
    this.addBoolean(material, 'depthTest', 'Тест глубины')
    this.addBoolean(material, 'depthWrite', 'Запись глубины')
    this.addBoolean(material, 'additiveBlending', 'Свечение')
    this.addBoolean(material, 'toneMapped', 'Tone mapping')
    this.addNumber(material, 'renderOrderBase', 0, 100, 1, 'Порядок отрисовки')

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

    appearance.onFinishChange(() => this.play())
    motion.onFinishChange(() => this.play())
    colors.onFinishChange(() => this.play())
    material.onFinishChange(() => this.play())
  }

  private addNumber(
    folder: GUI,
    property: NumberConfigKey,
    min: number,
    max: number,
    step: number,
    name: string,
  ): void {
    folder.add(this.config, property, min, max, step).name(name)
  }

  private addBoolean(folder: GUI, property: BooleanConfigKey, name: string): void {
    folder.add(this.config, property).name(name)
  }

  private prepareCube(): void {
    this.piece.elementType = this.settings.elementType
    this.piece.active = true
    this.piece.special = null
    this.board.syncPiece(this.piece)
    const cube = this.board.getCube(this.piece)
    cube.visible = true
    cube.scale.setScalar(1)
    this.placeCubeAtPreviewPosition()
  }

  private placeCubeAtPreviewPosition(): void {
    const targetX: Record<PreviewPosition, number> = {
      left: -0.55,
      center: 0,
      right: 0.55,
    }
    const currentWorld = this.board.getWorldPosition(this.piece)
    const depth = currentWorld.clone().project(this.scene.camera).z
    const targetWorld = new THREE.Vector3(
      targetX[this.settings.previewPosition],
      0,
      depth,
    ).unproject(this.scene.camera)
    this.board.object.position.add(targetWorld.sub(currentWorld))
  }

  private stopPlayback(): void {
    this.replayCall?.kill()
    this.replayCall = null
    this.feedbackCall?.kill()
    this.feedbackCall = null
    this.playback?.kill()
    this.playback = null
    this.glow.stop()
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
    const defaults = createCubeClearGlowConfig()
    const { colors, ...values } = defaults
    Object.assign(this.config, values)
    Object.assign(this.config.colors, colors)
    Object.assign(this.settings, {
      elementType: 'ice',
      previewPosition: 'center',
      autoReplay: true,
      replayDelay: 0.65,
      background: '#111827',
      cameraX: 2,
      cameraY: 1.5,
      cameraZ: 2,
    } satisfies CubeClearGlowLabSettings)
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay())
    this.updateScene()
    this.play()
  }

  private async copyJson(): Promise<void> {
    const json = JSON.stringify(this.config, null, 2)

    try {
      await navigator.clipboard.writeText(json)
      this.gui.title('Cube Clear Glow Lab — JSON скопирован')
      this.feedbackCall?.kill()
      this.feedbackCall = gsap.delayedCall(1.5, () => {
        this.feedbackCall = null
        if (!this.disposed) this.gui.title('Cube Clear Glow Lab')
      })
    } catch {
      console.info('CubeClearGlowConfig:', json)
      this.gui.title('Cube Clear Glow Lab — JSON в консоли')
    }
  }
}
