import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'stats.js'

export class ThreeScene {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  readonly renderer = new THREE.WebGLRenderer({ antialias: true })
  private readonly controls: OrbitControls
  private readonly resizeObserver: ResizeObserver
  private readonly stats = new Stats()
  private readonly timer = new THREE.Timer()
  private readonly container: HTMLElement
  private updateHandler: ((time: number) => void) | null = null
  private triangleCount = 0

  constructor(container: HTMLElement) {
    this.container = container
    this.scene.background = new THREE.Color(0x111827)
    this.camera.position.set(2, 1.5, 2)
    this.camera.lookAt(0, 0, 0)

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.target.set(0, 0, 0)

    this.stats.showPanel(0)
    this.stats.dom.style.position = 'absolute'
    this.stats.dom.style.top = '0'
    this.stats.dom.style.left = '0'
    this.stats.dom.style.zIndex = '10'
    this.container.appendChild(this.stats.dom)

    this.timer.connect(document)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.container)
    this.resize()
    this.renderer.setAnimationLoop(this.render)
  }

  setUpdateHandler(handler: (time: number) => void): void {
    this.updateHandler = handler
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    this.updateHandler = null
    this.controls.dispose()
    this.timer.dispose()
    this.stats.dom.remove()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private readonly render = (): void => {
    this.stats.begin()
    this.timer.update()
    this.controls.update()
    this.updateHandler?.(this.timer.getElapsed())
    this.renderer.render(this.scene, this.camera)

    const triangles = this.renderer.info.render.triangles
    if (triangles !== this.triangleCount) {
      this.triangleCount = triangles
      console.log(`Отрисовано треугольников: ${this.triangleCount}`)
    }
    this.stats.end()
  }

  private resize(): void {
    const { clientWidth, clientHeight } = this.container
    if (!clientWidth || !clientHeight) return
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight, false)
  }
}
