import { BoardGrid } from '../core/board/BoardGrid.ts'
import { BoardRefillPlanner } from '../core/board/BoardRefillPlanner.ts'
import { PlayableBoardGenerator } from '../core/board/PlayableBoardGenerator.ts'
import { RandomBiomeSource } from '../core/board/RandomBiomeSource.ts'
import { RandomElementSource } from '../core/board/RandomElementSource.ts'
import { createCubeShellBoard } from '../core/board/createCubeShellBoard.ts'
import { GameController } from '../core/flow/GameController.ts'
import type { BiomeType } from '../core/model/Biome.ts'
import { MatchFinder } from '../core/match/MatchFinder.ts'
import { MatchResolver } from '../core/match/MatchResolver.ts'
import { MatchValidator } from '../core/match/MatchValidator.ts'
import { SpecialEffectResolver } from '../core/match/SpecialEffectResolver.ts'
import { ThreeGamePresentation } from '../presentation/three/ThreeGamePresentation.ts'
import { CubeBoardView } from '../presentation/three/board/CubeBoardView.ts'
import { CubeStarEmitter } from '../presentation/three/effects/CubeStarEmitter.ts'
import { CubeRaycaster } from '../presentation/three/input/CubeRaycaster.ts'
import { resolveCrackRenderMode } from '../presentation/three/materials/CrackRenderMode.ts'
import { BiomeBackground } from '../presentation/three/biome/BiomeBackground.ts'
import { ThreeScene } from '../presentation/three/scene/ThreeScene.ts'

export class ThreeGameRuntime {
  readonly biomeType: BiomeType
  private readonly scene: ThreeScene
  private readonly biomeBackground: BiomeBackground
  private readonly board: CubeBoardView
  private readonly stars: CubeStarEmitter
  private readonly presentation: ThreeGamePresentation
  private readonly controller: GameController
  private readonly raycaster: CubeRaycaster
  private disposed = false

  constructor(container: HTMLElement) {
    const elements = new RandomElementSource()
    const grid = new BoardGrid(createCubeShellBoard(elements))
    const validator = new MatchValidator(grid)

    this.scene = new ThreeScene(container)
    this.biomeType = new RandomBiomeSource().next()
    this.biomeBackground = new BiomeBackground(this.scene.scene, this.scene.camera, this.biomeType)
    this.board = new CubeBoardView(grid.items, resolveCrackRenderMode(window.location.search))
    this.scene.scene.add(this.board.object)
    this.stars = new CubeStarEmitter(this.scene.scene)
    this.presentation = new ThreeGamePresentation(
      this.board,
      this.stars,
      this.scene.scene,
      this.scene.camera,
    )
    this.controller = new GameController(
      grid,
      validator,
      new MatchResolver(new MatchFinder(grid), new SpecialEffectResolver(grid)),
      new BoardRefillPlanner(grid, elements),
      new PlayableBoardGenerator(grid, validator, elements),
      this.presentation,
    )
    this.raycaster = new CubeRaycaster(
      this.scene.renderer,
      this.scene.camera,
      this.board.cubes,
      (pieceId) => void this.controller.handlePieceClick(pieceId),
    )
    this.scene.setUpdateHandler((time) => {
      this.biomeBackground.update(time)
      this.board.update(time)
    })
  }

  start(): Promise<void> {
    return this.controller.start()
  }

  rebuildBoard(): Promise<void> {
    return this.controller.requestRebuild()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.controller.dispose()
    this.raycaster.dispose()
    this.presentation.dispose()
    this.stars.destroy()
    this.board.dispose()
    this.biomeBackground.dispose()
    this.scene.dispose()
  }
}
