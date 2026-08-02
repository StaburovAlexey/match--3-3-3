export interface SparkBurstConfig {
  particleCount: number
  particleSize: number
  particleEndSize: number
  particleDistanceMin: number
  particleDistanceMax: number
  particleDuration: number
  particleFadeDelay: number
  particleFadeDuration: number
  gravity: number
  particleOpacity: number
  alphaTest: number
  useElementColors: boolean
  particleColor: string
  darkParticleColor: string
  particleWhiteMix: number
  depthTest: boolean
  depthWrite: boolean
  additiveBlending: boolean
  toneMapped: boolean
  renderOrderBase: number
}

export function createSparkBurstConfig(): SparkBurstConfig {
  return {
    particleCount: 30,
    particleSize: 0.075,
    particleEndSize: 0,
    particleDistanceMin: 0.77,
    particleDistanceMax: 0.94,
    particleDuration: 1.07,
    particleFadeDelay: 0,
    particleFadeDuration: 1.18,
    gravity: 0.1,
    particleOpacity: 1,
    alphaTest: 0.01,
    useElementColors: true,
    particleColor: '#fff4bd',
    darkParticleColor: '#b45cff',
    particleWhiteMix: 0.19,
    depthTest: false,
    depthWrite: false,
    additiveBlending: true,
    toneMapped: false,
    renderOrderBase: 40,
  }
}
