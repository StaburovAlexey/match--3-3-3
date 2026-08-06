import type { BiomeType } from '../../../core/model/Biome.ts'

export interface BiomePalette {
  backgroundTop: string
  backgroundBottom: string
  particle: string
  particleHighlight: string
}

export interface VersusBiomeTypes {
  opponentElementType: BiomeType
  playerElementType: BiomeType
}

export interface VersusBiomePalette {
  opponent: BiomePalette
  player: BiomePalette
}

export const biomePalettes: Record<BiomeType, BiomePalette> = {
  ice: {
    backgroundTop: '#061426',
    backgroundBottom: '#174b73',
    particle: '#79dfff',
    particleHighlight: '#e8fbff',
  },
  fire: {
    backgroundTop: '#210806',
    backgroundBottom: '#76200d',
    particle: '#ff6a3d',
    particleHighlight: '#ffd18a',
  },
  earth: {
    backgroundTop: '#0c160e',
    backgroundBottom: '#35471c',
    particle: '#8bd84c',
    particleHighlight: '#e2f5a1',
  },
  dark: {
    backgroundTop: '#080516',
    backgroundBottom: '#29105b',
    particle: '#a858ff',
    particleHighlight: '#edc8ff',
  },
  light: {
    backgroundTop: '#2d2406',
    backgroundBottom: '#c8942f',
    particle: '#ffe681',
    particleHighlight: '#fffef0',
  },
}

export function resolveVersusBiomePalette(types: VersusBiomeTypes): VersusBiomePalette {
  return {
    opponent: biomePalettes[types.opponentElementType],
    player: biomePalettes[types.playerElementType],
  }
}
