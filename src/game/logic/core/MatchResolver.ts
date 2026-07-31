import { gameEvents } from '../events/GameEvents.ts'
import type { MatchGroup, RefillEventPayload, SwapEventPayload } from '../events/GameEvents.ts'
import CubesGrid from './cubesGrid.ts'
import MatchFinder from './MatchFinder.ts'
import MatchValidator from './MatchValidator.ts'

export default class MatchResolver {
  private readonly finder: MatchFinder
  private readonly validator: MatchValidator
  private readonly unsubscribeSwapCompleted: () => void
  private readonly unsubscribeFieldRefilled: () => void

  constructor(grid: CubesGrid) {
    this.finder = new MatchFinder(grid)
    this.validator = new MatchValidator(grid)
    this.unsubscribeSwapCompleted = gameEvents.on('swap-completed', this.handleSwapCompleted)
    this.unsubscribeFieldRefilled = gameEvents.on('field-refilled', this.handleFieldRefilled)
  }

  private handleSwapCompleted = ({ first, second }: SwapEventPayload): void => {
    this.emitMatches(this.finder.findMatchesFrom([first, second]))
  }

  private handleFieldRefilled = ({ cubes }: RefillEventPayload): void => {
    const matches = this.finder.findMatchesFrom(cubes)

    if (matches.length > 0) {
      this.emitMatches(matches)
      return
    }

    if (!this.validator.hasAvailableSwap()) {
      gameEvents.emit('board-rebuild-requested', { reason: 'deadlock' })
      return
    }

    this.emitMatches([])
  }

  private emitMatches(matches: MatchGroup[]): void {
    gameEvents.emit('matches-found', { matches })
  }

  destroy(): void {
    this.unsubscribeSwapCompleted()
    this.unsubscribeFieldRefilled()
  }
}
