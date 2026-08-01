import type { BoardItem } from '../model/Board.ts'
import type { RandomElementSource } from './RandomElementSource.ts'

export function createCubeShellBoard(elements: RandomElementSource, size = 4): BoardItem[] {
  const items: BoardItem[] = []
  let id = 0

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      for (let z = 0; z < size; z += 1) {
        const isOuter =
          x === 0 || x === size - 1 || y === 0 || y === size - 1 || z === 0 || z === size - 1
        if (!isOuter) continue

        items.push({
          piece: {
            id: `piece-${id}`,
            elementType: elements.next(),
            special: null,
            active: true,
          },
          position: { x, y, z },
        })
        id += 1
      }
    }
  }

  return items
}
