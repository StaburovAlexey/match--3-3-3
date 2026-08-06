import { BoardGrid } from '../core/board/BoardGrid.ts'
import { BoardRefillPlanner } from '../core/board/BoardRefillPlanner.ts'
import { PlayableBoardGenerator } from '../core/board/PlayableBoardGenerator.ts'
import { RandomBiomeSource } from '../core/board/RandomBiomeSource.ts'
import { RandomElementSource } from '../core/board/RandomElementSource.ts'
import { createCubeShellBoard } from '../core/board/createCubeShellBoard.ts'
import type {
  AbilityActivationRequest,
  AbilityBeginResult,
  AbilityCancelledResult,
  AbilityConfirmResult,
  AbilityInteractionState,
  AbilityStateListener,
} from '../core/ability/AbilityContract.ts'
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

export interface GameRuntimeErrorEvent {
  context: string
  error: unknown
}

export interface ThreeGameRuntimeOptions {
  reportError?: (event: GameRuntimeErrorEvent) => void
}

export class ThreeGameRuntime {
  readonly biomeType: BiomeType
  private readonly scene: ThreeScene
  private readonly biomeBackground: BiomeBackground
  private readonly board: CubeBoardView
  private readonly stars: CubeStarEmitter
  private readonly presentation: ThreeGamePresentation
  private readonly controller: GameController
  private readonly raycaster: CubeRaycaster
  private readonly reportError: (error: unknown, context: string) => void
  private disposed = false

  constructor(container: HTMLElement, options: ThreeGameRuntimeOptions = {}) {
    const elements = new RandomElementSource()
    const grid = new BoardGrid(createCubeShellBoard(elements))
    const validator = new MatchValidator(grid)
    this.reportError = (error, context) => {
      options.reportError?.({ error, context })
      if (import.meta.env.DEV && !options.reportError) console.error(`[${context}]`, error)
    }

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
      this.reportError,
    )
    this.raycaster = new CubeRaycaster(
      this.scene.renderer,
      this.scene.camera,
      this.board.cubes,
      (pieceId) => {
        this.controller.selectCameraSegmentSide(this.scene.getCameraSideAxis())
        void this.controller
          .handlePieceClick(pieceId)
          .catch((error) => this.reportError(error, 'cube-click'))
      },
    )
    this.scene.setUpdateHandler((time) => {
      this.biomeBackground.update(time)
      this.board.update(time)
    })
  }

  start(): Promise<void> {
    return this.controller.start().catch((error: unknown) => {
      this.reportError(error, 'game-start')
      throw error
    })
  }

  rebuildBoard(): Promise<void> {
    return this.controller.requestRebuild()
  }

  beginAbility(request: AbilityActivationRequest): AbilityBeginResult {
    return this.controller.beginAbility(request)
  }

  cancelAbility(): AbilityCancelledResult | null {
    return this.controller.cancelAbility()
  }

  confirmAbility(): Promise<AbilityConfirmResult> {
    return this.controller.confirmAbility()
  }

  get abilityState(): AbilityInteractionState {
    return this.controller.abilityState
  }

  subscribeAbilityState(listener: AbilityStateListener): () => void {
    return this.controller.subscribeAbilityState(listener)
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
