import { elementTypes, type ElementType } from '../model/Element.ts'

export type RandomSource = () => number

export class RandomElementSource {
  private readonly random: RandomSource

  constructor(random: RandomSource = Math.random) {
    this.random = random
  }

  next(): ElementType {
    return elementTypes[Math.floor(this.random() * elementTypes.length)]
  }
}
