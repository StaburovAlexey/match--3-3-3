import * as THREE from 'three'

export interface CubeClearGlowPathOptions {
  arcOutward: number
  endOutward: number
  controlYProgress: number
  endY: number
}

export interface CubeClearGlowPath {
  start: THREE.Vector3
  control: THREE.Vector3
  end: THREE.Vector3
  side: -1 | 1
}

const centerThreshold = 0.04
const horizontalLimit = 0.95

export function getCubeClearGlowSide(screenX: number, pieceId: string): -1 | 1 {
  if (screenX < -centerThreshold) return -1
  if (screenX > centerThreshold) return 1

  let hash = 0
  for (let index = 0; index < pieceId.length; index += 1) {
    hash = (hash * 31 + pieceId.charCodeAt(index)) | 0
  }
  return Math.abs(hash) % 2 === 0 ? -1 : 1
}

export function createCubeClearGlowPath(
  start: THREE.Vector3,
  pieceId: string,
  options: CubeClearGlowPathOptions,
): CubeClearGlowPath {
  const side = getCubeClearGlowSide(start.x, pieceId)
  const control = new THREE.Vector3(
    THREE.MathUtils.clamp(start.x + side * options.arcOutward, -horizontalLimit, horizontalLimit),
    THREE.MathUtils.lerp(start.y, options.endY, options.controlYProgress),
    start.z,
  )
  const end = new THREE.Vector3(
    THREE.MathUtils.clamp(start.x + side * options.endOutward, -horizontalLimit, horizontalLimit),
    options.endY,
    start.z,
  )

  return { start: start.clone(), control, end, side }
}

export function getQuadraticBezierPoint(
  path: CubeClearGlowPath,
  progress: number,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  const time = THREE.MathUtils.clamp(progress, 0, 1)
  const inverse = 1 - time
  return target
    .copy(path.start)
    .multiplyScalar(inverse * inverse)
    .addScaledVector(path.control, 2 * inverse * time)
    .addScaledVector(path.end, time * time)
}
