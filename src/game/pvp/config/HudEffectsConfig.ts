import type { HudShakeReason } from '../../core/model/RewardTarget.ts'

export interface HudShakeStyleConfig {
  distanceMin: number
  distanceMax: number
  angleMin: number
  angleMax: number
  durationMin: number
  durationMax: number
  delayMax: number
}

export interface ScreenCrackIntensity {
  strength: number
  opacity: number
  width: number
  scale: number
  duration: number
  glow: number
}

export interface HudEffectsLabDefaults {
  cascadeLevel: number
  shakeDistance: number
  shakeAngle: number
  shakeDuration: number
  shakeDelay: number
  bombBoost: number
  crackStrength: number
  crackOpacity: number
  crackWidth: number
  crackScale: number
  crackDuration: number
  crackGlow: number
  crackColor: string
}

export const HUD_EFFECTS_MAX_MULTIPLIER = 5

export const HUD_SHAKE_STYLE_DEFAULTS: HudShakeStyleConfig = {
  distanceMin: 1.5,
  distanceMax: 3.5,
  angleMin: 0.35,
  angleMax: 0.9,
  durationMin: 220,
  durationMax: 320,
  delayMax: 45,
}

export const HUD_SHAKE_BOMB_BOOST = 1.45
export const HUD_SCREEN_CRACK_COLOR = '#e4efff'
export const HUD_SCREEN_CRACK_BOMB_BOOST = 1.3

export const HUD_EFFECTS_LAB_DEFAULTS: HudEffectsLabDefaults = {
  cascadeLevel: 3,
  shakeDistance: 3,
  shakeAngle: 0.8,
  shakeDuration: 300,
  shakeDelay: 45,
  bombBoost: HUD_SHAKE_BOMB_BOOST,
  crackStrength: 1,
  crackOpacity: 0.58,
  crackWidth: 1.35,
  crackScale: 1.04,
  crackDuration: 520,
  crackGlow: 1.1,
  crackColor: HUD_SCREEN_CRACK_COLOR,
}

function clampMultiplier(multiplier: number): number {
  return Math.min(HUD_EFFECTS_MAX_MULTIPLIER, Math.max(1, Math.floor(multiplier)))
}

export function getCascadeProgress(multiplier: number): number {
  return (clampMultiplier(multiplier) - 1) / (HUD_EFFECTS_MAX_MULTIPLIER - 1)
}

export function getHudShakeScale(reason: HudShakeReason, multiplier: number): number | null {
  const normalizedMultiplier = clampMultiplier(multiplier)
  if (reason === 'match' && normalizedMultiplier <= 1) return null

  const cascadeScale = 0.95 + getCascadeProgress(normalizedMultiplier) * 0.95
  return cascadeScale * (reason === 'bomb' ? HUD_SHAKE_BOMB_BOOST : 1)
}

export function getScreenCrackIntensity(
  reason: HudShakeReason,
  multiplier: number,
): ScreenCrackIntensity | null {
  const normalizedMultiplier = clampMultiplier(multiplier)
  if (reason === 'match' && normalizedMultiplier <= 1) return null

  const cascadeProgress = getCascadeProgress(normalizedMultiplier)
  const strength =
    (0.35 + cascadeProgress * 1.35) * (reason === 'bomb' ? HUD_SCREEN_CRACK_BOMB_BOOST : 1)

  return {
    strength,
    opacity: 0.22 + Math.min(2.2, strength) * 0.3,
    width: 0.85 + strength * 0.95,
    scale: 1 + strength * 0.12,
    duration: 330 + strength * 180,
    glow: 0.45 + strength * 0.9,
  }
}

function randomSigned(min: number, max: number, random: () => number): number {
  const magnitude = min + random() * (max - min)
  return random() < 0.5 ? -magnitude : magnitude
}

export function createHudShakeStyle(
  scale: number,
  config: HudShakeStyleConfig = HUD_SHAKE_STYLE_DEFAULTS,
  random: () => number = Math.random,
): Record<string, string> {
  return {
    '--pvp-hud-shake-x': `${randomSigned(config.distanceMin, config.distanceMax, random) * scale}px`,
    '--pvp-hud-shake-y': `${randomSigned(config.distanceMin, config.distanceMax, random) * scale}px`,
    '--pvp-hud-shake-angle': `${randomSigned(config.angleMin, config.angleMax, random) * scale}deg`,
    '--pvp-hud-shake-duration': `${(config.durationMin + random() * (config.durationMax - config.durationMin)) * scale}ms`,
    '--pvp-hud-shake-delay': `${random() * config.delayMax}ms`,
  }
}
