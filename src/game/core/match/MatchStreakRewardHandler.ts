export const maxMatchMultiplier = 5

export class MatchStreakRewardHandler {
  private multiplier = 0

  reset(): void {
    this.multiplier = 0
  }

  nextMultiplier(): number {
    this.multiplier = Math.min(maxMatchMultiplier, this.multiplier + 1)
    return this.multiplier
  }
}
