import type { AnimationResult } from '../../../core/flow/GamePresentation.ts'

export class TimelineScope {
  private readonly timelines = new Set<GSAPTimeline>()
  private disposed = false

  play(timeline: GSAPTimeline): Promise<AnimationResult> {
    if (this.disposed) {
      timeline.kill()
      return Promise.resolve('cancelled')
    }
    this.timelines.add(timeline)
    return new Promise((resolve) => {
      let settled = false
      const finish = (result: AnimationResult): void => {
        if (settled) return
        settled = true
        this.timelines.delete(timeline)
        resolve(result)
      }
      timeline.eventCallback('onComplete', () => finish('completed'))
      timeline.eventCallback('onInterrupt', () => finish('cancelled'))
      timeline.play(0)
    })
  }

  killAll(): void {
    Array.from(this.timelines).forEach((timeline) => timeline.kill())
    this.timelines.clear()
  }

  dispose(): void {
    this.disposed = true
    this.killAll()
  }
}
