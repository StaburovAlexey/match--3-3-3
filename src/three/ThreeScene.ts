import * as THREE from 'three'
// import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { gsap } from 'gsap'
import GUI from 'lil-gui'
// import { textureLoader } from './TextureLoader'
import Stats from 'stats.js'
import type { CrackUniforms } from './ProceduralCracks'
import {
  // crackPalettes,
  elementTypes,
  // settingCrack,
  type ElementType,
} from './ElementMaterialConfig'
import { Cube } from './Cube.ts'
import { MaterialsCubes } from './MaterialsCubes.ts'

export default class ThreeScene {
  private readonly container: HTMLElement
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly resizeObserver: ResizeObserver
  private readonly stats: Stats
  private readonly timer = new THREE.Timer()
  private crackUniforms = new Map<ElementType, CrackUniforms>()
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

    const materials = new MaterialsCubes()
    this.crackUniforms = materials.cracks
    this.setupMatcapMaterialGui(materials.all, this.crackUniforms)
    const group = new THREE.Group()
    const r = 4
    for (let y = 0; y < r; y++) {
      for (let x = 0; x < r; x++) {
        for (let z = 0; z < r; z++) {
          const type = elementTypes[Math.floor(Math.random() * elementTypes.length)]
          const material = materials.getMaterialsCube(type)
          const cube = new Cube(type, material)
          cube.position.set((x - 1) * step, y * step, (z - 1) * step)
          cube.scale.setScalar(0)
          group.add(cube)
        }
      }
    }
    console.log('crackUniforms', this.crackUniforms)
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

  private setupMatcapMaterialGui(
    materials: Map<ElementType, THREE.MeshMatcapMaterial>,
    crackUniforms: Map<ElementType, CrackUniforms>,
  ): void {
    this.gui?.destroy()

    const gui = new GUI({ title: 'Element materials' })

    materials.forEach((material, type) => {
      const materialFolder = gui.addFolder(type)

      // Proxy through getHex()/set() so lil-gui reads/writes sRGB hex,
      // not THREE.Color's internal linear r/g/b values.
      const matColorProxy = {
        get hex() {
          return material.color.getHex()
        },
        set hex(v: number) {
          material.color.set(v)
        },
      }
      materialFolder.addColor(matColorProxy, 'hex').name('material color')
      materialFolder.add(material, 'opacity', 0, 1, 0.01)
      materialFolder.add(material, 'transparent').onChange(() => {
        material.needsUpdate = true
      })
      materialFolder.add(material, 'wireframe').onChange(() => {
        material.needsUpdate = true
      })
      materialFolder.add(material, 'flatShading').onChange(() => {
        material.needsUpdate = true
      })
      materialFolder.add(material, 'depthTest')
      materialFolder.add(material, 'depthWrite')

      const uniforms = crackUniforms.get(type)
      if (!uniforms) return

      const crackFolder = materialFolder.addFolder('Cracks')
      crackFolder.add(uniforms.uCrackScale, 'value', 1, 20, 0.1).name('scale')
      crackFolder.add(uniforms.uCrackWidth, 'value', 0.005, 0.2, 0.005).name('width')
      crackFolder.add(uniforms.uCrackStrength, 'value', 0, 1, 0.01).name('strength')
      crackFolder.add(uniforms.uCrackFillStrength, 'value', 0, 1, 0.01).name('fill strength')
      crackFolder
        .add(uniforms.uCrackHighlightStrength, 'value', 0, 1, 0.01)
        .name('highlight strength')
      crackFolder
        .add(uniforms.uCrackHighlightSpeed, 'value', 0, 12, 0.1)
        .name('highlight blink speed')
      crackFolder.add(uniforms.uCrackHighlightGlow, 'value', 0, 3, 0.01).name('highlight glow')
      crackFolder.add(uniforms.uCrackDeformStrength, 'value', 0, 0.25, 0.005).name('voronoi deform')
      crackFolder.add(uniforms.uCrackDeformSpeed, 'value', 0, 5, 0.1).name('voronoi speed')
      const crackColorProxy = {
        get hex() {
          return uniforms.uCrackColor.value.getHex()
        },
        set hex(v: number) {
          uniforms.uCrackColor.value.set(v)
        },
      }
      const fillColorProxy = {
        get hex() {
          return uniforms.uCrackFillColor.value.getHex()
        },
        set hex(v: number) {
          uniforms.uCrackFillColor.value.set(v)
        },
      }
      const highlightColorProxy = {
        get hex() {
          return uniforms.uCrackHighlightColor.value.getHex()
        },
        set hex(v: number) {
          uniforms.uCrackHighlightColor.value.set(v)
        },
      }
      crackFolder.addColor(crackColorProxy, 'hex').name('crack color')
      crackFolder.addColor(fillColorProxy, 'hex').name('fill color')
      crackFolder.addColor(highlightColorProxy, 'hex').name('highlight color')
    })

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
    this.resizeObserver.disconnect()
    this.renderer.setAnimationLoop(null)
    this.controls.dispose()
    this.timer.dispose()
    this.stats.dom.remove()
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
