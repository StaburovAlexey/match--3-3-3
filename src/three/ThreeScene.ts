import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { gsap } from 'gsap'
import GUI from 'lil-gui'
import { textureLoader } from './TextureLoader'
import Stats from 'stats.js'

export default class ThreeScene {
  private readonly container: HTMLElement
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly resizeObserver: ResizeObserver
  private readonly stats: Stats
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
    await textureLoader.loadAll({
      matcap: '/texture/304FB1_69A1EF_5081DF_5C8CE6-256px.png',
    })

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
    const torusGeometry = new THREE.TorusGeometry(0.055, 0.014, 8, 16)
    const torusMaterial = new THREE.MeshMatcapMaterial({
      matcap: textureLoader.get('matcap'),
      color: 0x8feaff,
    })
    const material = new THREE.MeshMatcapMaterial({
      matcap: textureLoader.get('matcap'),
      color: 0xbdeeff,
      opacity: 0.35,
      transparent: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    const crackUniforms = this.setupProceduralCracks(material)
    this.setupMatcapMaterialGui(material, crackUniforms)

    const group = new THREE.Group()
    const r = 4
    for (let y = 0; y < r; y++) {
      for (let x = 0; x < r; x++) {
        for (let z = 0; z < r; z++) {
          const cube = new THREE.Mesh(geometry, material)
          cube.position.set((x - 1) * step, y * step, (z - 1) * step)
          cube.scale.setScalar(0)

          const torus = new THREE.Mesh(torusGeometry, torusMaterial)
          torus.rotation.x = Math.PI / 2
          torus.renderOrder = 1
          cube.renderOrder = 2
          cube.add(torus)

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

  private setupProceduralCracks(material: THREE.Material) {
    const uniforms = {
      uCrackScale: { value: 7 },
      uCrackWidth: { value: 0.055 },
      uCrackStrength: { value: 0.9 },
      uCrackFillStrength: { value: 0.18 },
      uCrackHighlightStrength: { value: 0.22 },
      uCrackColor: { value: new THREE.Color(0x23647c) },
      uCrackFillColor: { value: new THREE.Color(0x6fc7df) },
      uCrackHighlightColor: { value: new THREE.Color(0xffffff) },
    }

    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)

      const crackFunctions = /* glsl */ `
        uniform float uCrackScale;
        uniform float uCrackWidth;
        uniform float uCrackStrength;
        uniform float uCrackFillStrength;
        uniform float uCrackHighlightStrength;
        uniform vec3 uCrackColor;
        uniform vec3 uCrackFillColor;
        uniform vec3 uCrackHighlightColor;

        varying vec3 vCrackWorldPosition;
        varying vec3 vCrackWorldNormal;

        vec2 crackHash(vec2 p) {
          p = vec2(
            dot(p, vec2(127.1, 311.7)),
            dot(p, vec2(269.5, 183.3))
          );
          return fract(sin(p) * 43758.5453);
        }

        float crackVoronoi(vec2 uv, float width) {
          vec2 cell = floor(uv);
          vec2 local = fract(uv);
          float nearest = 10.0;
          float secondNearest = 10.0;

          for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
              vec2 offset = vec2(float(x), float(y));
              vec2 point = crackHash(cell + offset);
              float distanceToPoint = length(offset + point - local);

              if (distanceToPoint < nearest) {
                secondNearest = nearest;
                nearest = distanceToPoint;
              } else if (distanceToPoint < secondNearest) {
                secondNearest = distanceToPoint;
              }
            }
          }

          float edgeDistance = secondNearest - nearest;
          return 1.0 - smoothstep(0.0, width, edgeDistance);
        }

        float proceduralCracks(float width) {
          vec3 position = vCrackWorldPosition * uCrackScale;
          vec3 normal = abs(normalize(vCrackWorldNormal));
          normal = pow(normal, vec3(4.0));
          normal /= max(normal.x + normal.y + normal.z, 0.0001);

          float crackXY = crackVoronoi(position.xy, width);
          float crackXZ = crackVoronoi(position.xz, width);
          float crackYZ = crackVoronoi(position.yz, width);

          return (
            crackXY * normal.z +
            crackXZ * normal.y +
            crackYZ * normal.x
          );
        }
      `

      shader.vertexShader = `
        varying vec3 vCrackWorldPosition;
        varying vec3 vCrackWorldNormal;
      `
        .concat(shader.vertexShader)
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
            vCrackWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
            vCrackWorldNormal = normalize(mat3(modelMatrix) * normal);`,
        )

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `${crackFunctions}\n#include <common>`)
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
            float crack = proceduralCracks(uCrackWidth);
            float crackFill = proceduralCracks(uCrackWidth * 4.0);
            float crackHighlight = proceduralCracks(uCrackWidth * 0.3);
            diffuseColor.rgb = mix(
              diffuseColor.rgb,
              uCrackFillColor,
              crackFill * uCrackFillStrength
            );
            diffuseColor.rgb = mix(diffuseColor.rgb, uCrackColor, crack * uCrackStrength);
            diffuseColor.rgb = mix(
              diffuseColor.rgb,
              uCrackHighlightColor,
              crackHighlight * uCrackHighlightStrength
            );`,
        )
    }

    material.customProgramCacheKey = () => 'procedural-ice-cracks-v1'

    return uniforms
  }

  setupMatcapMaterialGui(
    material: THREE.MeshMatcapMaterial,
    crackUniforms: ReturnType<ThreeScene['setupProceduralCracks']>,
  ): void {
    this.gui?.destroy()

    const gui = new GUI({ title: 'Matcap ice' })
    const materialFolder = gui.addFolder('Material')

    materialFolder.addColor(material, 'color').name('color')
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

    const crackFolder = gui.addFolder('Procedural cracks')
    crackFolder.add(crackUniforms.uCrackScale, 'value', 1, 20, 0.1).name('scale')
    crackFolder.add(crackUniforms.uCrackWidth, 'value', 0.005, 0.2, 0.005).name('width')
    crackFolder.add(crackUniforms.uCrackStrength, 'value', 0, 1, 0.01).name('strength')
    crackFolder.add(crackUniforms.uCrackFillStrength, 'value', 0, 1, 0.01).name('fill strength')
    crackFolder
      .add(crackUniforms.uCrackHighlightStrength, 'value', 0, 1, 0.01)
      .name('white highlight')
    crackFolder.addColor(crackUniforms.uCrackColor, 'value').name('color')
    crackFolder.addColor(crackUniforms.uCrackFillColor, 'value').name('fill color')
    crackFolder.addColor(crackUniforms.uCrackHighlightColor, 'value').name('highlight color')

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
