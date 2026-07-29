import * as THREE from 'three'
import type { Cube } from '../objects/Cube.ts'

export class CubeRaycaster {
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly renderer: THREE.WebGLRenderer
  private readonly camera: THREE.PerspectiveCamera
  private readonly cubes: Cube[]
  private readonly pointerDownPosition = new THREE.Vector2()
  private pointerId: number | null = null
  private activePointers = 0
  private multiTouch = false
  private static readonly clickDistance = 5

  constructor(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, cubes: Cube[]) {
    this.renderer = renderer
    this.camera = camera
    this.cubes = cubes
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown)
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp)
    this.renderer.domElement.addEventListener('pointercancel', this.handlePointerCancel)
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.activePointers += 1

    if (this.activePointers > 1) {
      this.multiTouch = true
      return
    }

    if (event.button !== 0) return

    this.pointerId = event.pointerId
    this.pointerDownPosition.set(event.clientX, event.clientY)
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.activePointers = Math.max(0, this.activePointers - 1)

    if (event.pointerId !== this.pointerId) return

    this.pointerId = null

    const distance = Math.hypot(
      event.clientX - this.pointerDownPosition.x,
      event.clientY - this.pointerDownPosition.y,
    )

    const isClick = !this.multiTouch && distance <= CubeRaycaster.clickDistance
    this.multiTouch = false

    if (!isClick) return

    const rect = this.renderer.domElement.getBoundingClientRect()

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)

    const intersections = this.raycaster.intersectObjects(this.cubes, false)
    const cube = intersections[0]?.object

    if (cube) {
      console.log('Нажат куб:', cube)
    }
  }

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    this.activePointers = Math.max(0, this.activePointers - 1)

    if (event.pointerId === this.pointerId) {
      this.pointerId = null
    }

    this.multiTouch = false
  }

  dispose(): void {
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown)
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp)
    this.renderer.domElement.removeEventListener('pointercancel', this.handlePointerCancel)
  }
}
