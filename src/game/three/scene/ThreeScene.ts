import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'stats.js'
import type { Cracks } from '../materials/MaterialsCubes.ts'
import GroupCubes from '../objects/groupCubes.ts'
import CubesGrid from '../../logic/core/cubesGrid.ts'
import type { Cube } from '../objects/Cube.ts'
import { CubeRaycaster } from '../input/CubeRaycaster.ts'
import { SelectionController } from '../../logic/core/SelectionController.ts'
import { CubeSelectionAnimator } from '../animations/CubeSelectionAnimator.ts'
import { CubeSpawnAnimator } from '../animations/CubeSpawnAnimator.ts'
import { CubeSwapAnimator } from '../animations/CubeSwapAnimator.ts'
import { CubeStarEmitter } from '../animations/CubeStarEmitter.ts'
import { CubeShakeAnimator } from '../animations/CubeShakeAnimator.ts'

export default class ThreeScene {
  private readonly container: HTMLElement
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly resizeObserver: ResizeObserver
  private readonly stats: Stats
  private readonly timer = new THREE.Timer()
  private crackUniforms: Cracks = new Map()
  private triangle: number
  private grid: CubesGrid
  private readonly raycaster: CubeRaycaster
  private readonly selectionController: SelectionController
  private readonly selectionAnimator: CubeSelectionAnimator
  private readonly spawnAnimator: CubeSpawnAnimator
  private readonly swapAnimator: CubeSwapAnimator
  private readonly starEmitter: CubeStarEmitter
  private readonly shakeAnimator: CubeShakeAnimator
  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x111827)
    this.triangle = 0
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    this.camera.position.set(2, 1.5, 2)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.target.set(0, 0, 0)

    this.stats = new Stats()
    this.stats.showPanel(0)
    this.stats.dom.style.position = 'absolute'
    this.stats.dom.style.top = '0'
    this.stats.dom.style.left = '0'
    this.stats.dom.style.zIndex = '10'
    this.container.appendChild(this.stats.dom)
    this.timer.connect(document)

    /*        this.scene.add(new THREE.GridHelper(10, 10, 0x64748b, 0x334155))*/
    this.scene.add(new THREE.AxesHelper(3))
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x475569, 2))

    this.grid = new CubesGrid()
    this.selectionController = new SelectionController(this.grid)
    this.shakeAnimator = new CubeShakeAnimator()
    this.selectionAnimator = new CubeSelectionAnimator(this.shakeAnimator)
    this.spawnAnimator = new CubeSpawnAnimator()
    this.swapAnimator = new CubeSwapAnimator(this.grid, this.shakeAnimator)
    this.starEmitter = new CubeStarEmitter(this.scene)
    const cubes = this.createCubes()
    this.spawnAnimator.play(cubes)
    this.raycaster = new CubeRaycaster(this.renderer, this.camera, cubes)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.container)
    this.resize()
    this.renderer.setAnimationLoop(() => this.render())
  }

  private createCubes(): Cube[] {
    const cubes = new GroupCubes()
    this.grid.createGrid(cubes.getCubes)
    this.crackUniforms = cubes.cracks
    this.scene.add(cubes.object)
    return cubes.getCubes
  }

  private resize(): void {
    const { clientWidth, clientHeight } = this.container
    if (!clientWidth || !clientHeight) return

    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight, false)
  }

  private render(): void {
    this.stats.begin()
    this.timer.update()
    const time = this.timer.getElapsed()
    this.crackUniforms.forEach((uniforms) => {
      uniforms.uCrackTime.value = time
    })
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    const locTriangle = this.renderer.info.render.triangles
    if (locTriangle !== this.triangle) {
      this.triangle = locTriangle
      console.log(`Отрисовано треугольников: ${this.triangle}`)
    }
    this.stats.end()
  }

  dispose(): void {
    this.raycaster.dispose()
    this.resizeObserver.disconnect()
    this.renderer.setAnimationLoop(null)
    this.selectionController.destroy()
    this.selectionAnimator.destroy()
    this.spawnAnimator.destroy()
    this.swapAnimator.destroy()
    this.shakeAnimator.destroy()
    this.starEmitter.destroy()
    this.grid.destroy()
    this.controls.dispose()
    this.timer.dispose()
    this.stats.dom.remove()

    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return

      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material.dispose())
    })

    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
