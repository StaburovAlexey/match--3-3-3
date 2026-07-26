import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { gsap } from 'gsap'
import GUI from 'lil-gui'

export default class ThreeScene {
  private readonly container: HTMLElement
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly resizeObserver: ResizeObserver
  private gui: GUI | null = null
  private triangle: number

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

    /*        this.scene.add(new THREE.GridHelper(10, 10, 0x64748b, 0x334155))*/
    this.scene.add(new THREE.AxesHelper(3))
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x475569, 2))

    void this.createCubes()
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.container)
    this.resize()
    this.renderer.setAnimationLoop(() => this.render())
  }

  private async createCubes(): Promise<void> {
    const timeline = gsap.timeline()
    const cubeGeometry: Record<string, number> = { axis: 0.2, s: 1, r: 0.02 }
    const gap: number = 0.05
    const step: number = cubeGeometry.axis + gap

    const geometry = new RoundedBoxGeometry(
      cubeGeometry.axis,
      cubeGeometry.axis,
      cubeGeometry.axis,
      cubeGeometry.s,
      cubeGeometry.r,
    )
    /*    const material = new THREE.MeshDepthMaterial()*/
    /*  const material = new THREE.MeshMatcapMaterial({
      matcap: textureLoader.get('matcap126'),
      transparent: true,
      opacity: 0.7,
    })*/ /*
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      metalness: 0.5,
      roughness: 0.1,

    })*/
    const material = new THREE.MeshPhysicalMaterial({
      metalness: 0,
      roughness: 0,
      transmission: 1,
      ior: 1.5,
      thickness: 0.1,
    })
    this.setupMaterialGui(material)

    const group = new THREE.Group()

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          const cube = new THREE.Mesh(geometry, material)
          cube.position.set((x - 1) * step, y * step, (z - 1) * step)
          cube.scale.setScalar(0)
          group.add(cube)
        }
      }
    }
    const box = new THREE.Box3().setFromObject(group)
    const centerGroup = box.getCenter(new THREE.Vector3())
    group.position.sub(centerGroup)
    this.scene.add(group)
    const firstDuration = 0.08
    const secondDuration = 0.1
    const children = group.children

    children.forEach((child, index) => {
      const startTime = index * firstDuration

      timeline.to(
        child.scale,
        {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: firstDuration,
          ease: 'power2.out',
        },
        startTime,
      )
      if (index > 0) {
        timeline.to(
          children[index - 1].scale,
          {
            x: 1,
            y: 1,
            z: 1,
            duration: secondDuration,
            ease: 'power2.out',
          },
          startTime,
        )
      }
    })
    const lastChild = children[children.length - 1]

    if (lastChild) {
      timeline.to(
        lastChild.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: secondDuration,
          ease: 'power2.out',
        },
        children.length * firstDuration,
      )
    }
  }

  private setupMaterialGui(material: THREE.MeshPhysicalMaterial): void {
    this.gui?.destroy()

    const gui = new GUI({ title: 'Material' })
    const physicalFolder = gui.addFolder('Physical')

    physicalFolder.addColor(material, 'color').name('color')
    physicalFolder.add(material, 'metalness', 0, 1, 0.01)
    physicalFolder.add(material, 'roughness', 0, 1, 0.01)
    physicalFolder.add(material, 'transmission', 0, 1, 0.01)
    physicalFolder.add(material, 'ior', 1, 2.333, 0.001)
    physicalFolder.add(material, 'thickness', 0, 5, 0.01)
    physicalFolder.add(material, 'clearcoat', 0, 1, 0.01)
    physicalFolder.add(material, 'clearcoatRoughness', 0, 1, 0.01)

    const renderFolder = gui.addFolder('Render')
    renderFolder.add(material, 'opacity', 0, 1, 0.01)
    renderFolder.add(material, 'transparent').onChange(() => {
      material.needsUpdate = true
    })
    renderFolder.add(material, 'wireframe').onChange(() => {
      material.needsUpdate = true
    })
    renderFolder.add(material, 'flatShading').onChange(() => {
      material.needsUpdate = true
    })
    renderFolder.add(material, 'depthTest')
    renderFolder.add(material, 'depthWrite')

    this.gui = gui
  }

  private resize(): void {
    const { clientWidth, clientHeight } = this.container
    if (!clientWidth || !clientHeight) return

    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight, false)
  }

  private render(): void {
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    const locTriangle = this.renderer.info.render.triangles
    if (locTriangle !== this.triangle) {
      this.triangle = locTriangle
      console.log(`Отрисовано треугольников: ${this.triangle}`)
    }
  }

  dispose(): void {
    this.resizeObserver.disconnect()
    this.renderer.setAnimationLoop(null)
    this.controls.dispose()
    this.gui?.destroy()
    this.gui = null

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
