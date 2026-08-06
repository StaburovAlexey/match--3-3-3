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
  target?: THREE.Vector3,
): CubeClearGlowPath {
  const side = getCubeClearGlowSide(start.x, pieceId)
  const end = target
    ? target.clone().setZ(start.z)
    : new THREE.Vector3(
        THREE.MathUtils.clamp(
          start.x + side * options.endOutward,
          -horizontalLimit,
          horizontalLimit,
        ),
        options.endY,
        start.z,
      )
  const control = new THREE.Vector3(
    target
      ? THREE.MathUtils.clamp(
          THREE.MathUtils.lerp(start.x, end.x, 0.5) + side * options.arcOutward,
          -horizontalLimit,
          horizontalLimit,
        )
      : THREE.MathUtils.clamp(
          start.x + side * options.arcOutward,
          -horizontalLimit,
          horizontalLimit,
        ),
    THREE.MathUtils.lerp(start.y, end.y, options.controlYProgress),
    start.z,
  )

  return { start: start.clone(), control, end, side }
}

export function updateCubeClearGlowPathTarget(
  path: CubeClearGlowPath,
  target: THREE.Vector3,
  options: CubeClearGlowPathOptions,
): void {
  path.end.set(target.x, target.y, path.start.z)
  path.control.set(
    THREE.MathUtils.clamp(
      THREE.MathUtils.lerp(path.start.x, path.end.x, 0.5) + path.side * options.arcOutward,
      -horizontalLimit,
      horizontalLimit,
    ),
    THREE.MathUtils.lerp(path.start.y, path.end.y, options.controlYProgress),
    path.start.z,
  )
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
