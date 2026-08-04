import { biomeTypes, type BiomeType } from '../model/Biome.ts'

export class RandomBiomeSource {
  private readonly random: () => number

  constructor(random: () => number = Math.random) {
    this.random = random
  }

  next(): BiomeType {
    const index = Math.floor(this.random() * biomeTypes.length)
    return biomeTypes[Math.min(Math.max(index, 0), biomeTypes.length - 1)]
  }
}
