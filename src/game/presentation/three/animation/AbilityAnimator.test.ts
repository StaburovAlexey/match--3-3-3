import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { BoardGrid } from '../../../core/board/BoardGrid.ts'
import { AbilityPlanner } from '../../../core/ability/AbilityPlanner.ts'
import type { BoardItem } from '../../../core/model/Board.ts'
import { AbilityAnimator } from './AbilityAnimator.ts'
import { CubeShakeAnimator } from './CubeShakeAnimator.ts'
import { Cube } from '../board/Cube.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'

describe('AbilityAnimator', () => {
  it('фиксирует позиции всех кубов после поворота нескольких сегментов', async () => {
    const items: BoardItem[] = Array.from({ length: 18 }, (_, index) => {
      const x = index % 3
      const z = Math.floor(index / 3) % 3
      const y = Math.floor(index / 9) + 1
      return {
        piece: { id: `${x}:${y}:${z}`, elementType: 'ice', special: null, active: true },
        position: { x, y, z },
      }
    })
    const grid = new BoardGrid(items)
    const object = new THREE.Group()
    const cubes = new Map<string, Cube>()
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshMatcapMaterial()
    const board = {
      object,
      getCube: (piece: { id: string }) => {
        const cube = cubes.get(piece.id)
        if (!cube) throw new Error(`Cube ${piece.id} not found`)
        return cube
      },
      getLocalPosition: (position: { x: number; y: number; z: number }) =>
        new THREE.Vector3(position.x, position.y, position.z),
    } as unknown as CubeBoardView

    items.forEach(({ piece, position }) => {
      const cube = new Cube(piece.id, material, { axis: 1, segments: 1, radius: 0 }, geometry)
      cube.position.copy(board.getLocalPosition(position))
      cubes.set(piece.id, cube)
      object.add(cube)
    })

    const planner = new AbilityPlanner(grid)
    const animator = new AbilityAnimator(board, new CubeShakeAnimator())
    const selectionPlan = planner.create({
      type: 'rotateSegment',
      axis: 'y',
      segments: [
        { coordinate: 1, quarterTurns: 0, direction: 1 },
        { coordinate: 2, quarterTurns: 0, direction: 1 },
      ],
    })
    await animator.preview(selectionPlan, 'selection')

    const plan = planner.create({
      type: 'rotateSegment',
      axis: 'y',
      segments: [
        { coordinate: 1, quarterTurns: 1, direction: 1 },
        { coordinate: 2, quarterTurns: 1, direction: 1 },
      ],
    })
    await animator.preview(plan, 'rotation')
    await expect(animator.play(plan)).resolves.toBe('completed')

    const firstCube = cubes.get('0:1:1')
    const secondCube = cubes.get('0:2:1')
    expect(firstCube?.position.toArray()).toEqual([1, 1, 2])
    expect(secondCube?.position.toArray()).toEqual([1, 2, 2])
    animator.destroy()
    geometry.dispose()
    material.dispose()
  })

  it.each([
    ['x', 1],
    ['x', 2],
    ['x', 3],
    ['y', 1],
    ['y', 2],
    ['y', 3],
    ['z', 1],
    ['z', 2],
    ['z', 3],
  ] as const)(
    'не меняет вид сегментов при фиксации поворота %s на %i четверти',
    async (axis, quarterTurns) => {
      const items: BoardItem[] = Array.from({ length: 27 }, (_, index) => {
        const x = index % 3
        const z = Math.floor(index / 3) % 3
        const y = Math.floor(index / 9)
        return {
          piece: { id: `${x}:${y}:${z}`, elementType: 'ice', special: null, active: true },
          position: { x, y, z },
        }
      })
      const grid = new BoardGrid(items)
      const object = new THREE.Group()
      const cubes = new Map<string, Cube>()
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshMatcapMaterial()
      const board = {
        object,
        getCube: (piece: { id: string }) => {
          const cube = cubes.get(piece.id)
          if (!cube) throw new Error(`Cube ${piece.id} not found`)
          return cube
        },
        getLocalPosition: (position: { x: number; y: number; z: number }) =>
          new THREE.Vector3(position.x, position.y, position.z),
      } as unknown as CubeBoardView

      items.forEach(({ piece, position }) => {
        const cube = new Cube(piece.id, material, { axis: 1, segments: 1, radius: 0 }, geometry)
        cube.position.copy(board.getLocalPosition(position))
        cubes.set(piece.id, cube)
        object.add(cube)
      })

      const planner = new AbilityPlanner(grid)
      const animator = new AbilityAnimator(board, new CubeShakeAnimator())
      const plan = planner.create({
        type: 'rotateSegment',
        axis,
        segments: [
          { coordinate: 0, quarterTurns, direction: 1 },
          { coordinate: 2, quarterTurns, direction: -1 },
        ],
      })
      await animator.preview(plan, 'rotation')
      const previewQuaternions = new Map(
        plan.pieces.map((piece) => [
          piece.id,
          board.getCube(piece).getWorldQuaternion(new THREE.Quaternion()),
        ]),
      )

      plan.positionChanges.forEach(({ piece, to }) => {
        const actual = board.getCube(piece).getWorldPosition(new THREE.Vector3())
        const expected = board.getLocalPosition(to)
        expect(actual.x).toBeCloseTo(expected.x)
        expect(actual.y).toBeCloseTo(expected.y)
        expect(actual.z).toBeCloseTo(expected.z)
        const previewQuaternion = previewQuaternions.get(piece.id)
        expect(previewQuaternion).toBeDefined()
        expect(
          board
            .getCube(piece)
            .getWorldQuaternion(new THREE.Quaternion())
            .angleTo(previewQuaternion!),
        ).toBeCloseTo(0)
      })

      await expect(animator.play(plan)).resolves.toBe('completed')
      plan.positionChanges.forEach(({ piece, to }) => {
        const actual = board.getCube(piece).position
        const expected = board.getLocalPosition(to)
        expect(actual.x).toBeCloseTo(expected.x)
        expect(actual.y).toBeCloseTo(expected.y)
        expect(actual.z).toBeCloseTo(expected.z)
      })

      animator.destroy()
      geometry.dispose()
      material.dispose()
    },
  )
})
