import { createSparkBurstConfig, type SparkBurstConfig } from './SparkBurstConfig.ts'

export interface BombExplosionConfig extends SparkBurstConfig {
  chainDelay: number
  explosionRadius: number
  flashSize: number
  flashGrowDuration: number
  flashFadeDelay: number
  flashFadeDuration: number
  flashOpacity: number
  ringCount: number
  ringTubeRadius: number
  ringRadialSegments: number
  ringTubularSegments: number
  ringOpacity: number
  ringDuration: number
  ringFadeDelay: number
  ringFadeDuration: number
  flashColor: string
  ringColor: string
  darkFlashColor: string
  darkRingColor: string
  flashWhiteMix: number
  ringHighlightMix: number
}

export function createBombExplosionConfig(): BombExplosionConfig {
  return {
    ...createSparkBurstConfig(),
    chainDelay: 0.1,
    explosionRadius: 0.69,
    flashSize: 0.78,
    flashGrowDuration: 0.21,
    flashFadeDelay: 0,
    flashFadeDuration: 0.84,
    flashOpacity: 1,
    ringCount: 3,
    ringTubeRadius: 0.029,
    ringRadialSegments: 3,
    ringTubularSegments: 15,
    ringOpacity: 0.85,
    ringDuration: 0.89,
    ringFadeDelay: 0,
    ringFadeDuration: 0.63,
    flashColor: '#ffffff',
    ringColor: '#ffb347',
    darkFlashColor: '#240033',
    darkRingColor: '#7c2cff',
    flashWhiteMix: 0.24,
    ringHighlightMix: 0.95,
  }
}
