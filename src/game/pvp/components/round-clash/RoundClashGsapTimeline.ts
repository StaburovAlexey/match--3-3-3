import { gsap } from 'gsap'
import type { RoundResolutionResult } from '../../core/PvPBattleTypes.ts'
import { roundClashConfig } from './RoundClashConfig.ts'
import { addRoundClashEffects } from './RoundClashGsapEffects.ts'
import { createRoundClashHealthTrack, getRoundClashHealthAtTime } from './RoundClashModel.ts'
import type {
  RoundClashEffectMoment,
  RoundClashHealthProgress,
  RoundClashHealthTrack,
} from './RoundClashTypes.ts'

interface RoundClashElements {
  readonly intro: HTMLElement
  readonly backdrop: HTMLElement
  readonly arena: HTMLElement
  readonly opponentFighter: HTMLElement
  readonly playerFighter: HTMLElement
}

interface RoundClashGsapTimelineOptions {
  readonly root: HTMLElement
  readonly resolution: RoundResolutionResult
  readonly effects: readonly RoundClashEffectMoment[]
  readonly reducedMotion: boolean
  readonly onStarted: () => void
  readonly onHealthProgress: (health: RoundClashHealthProgress) => void
  readonly onFinished: () => void
}

export interface RoundClashGsapTimelineHandle {
  play: () => void
  kill: () => void
}

function resolveElements(root: HTMLElement): RoundClashElements | null {
  const intro = root.querySelector<HTMLElement>('[data-round-clash-intro]')
  const backdrop = root.querySelector<HTMLElement>('[data-round-clash-backdrop]')
  const arena = root.querySelector<HTMLElement>('[data-round-clash-arena]')
  const opponentFighter = root.querySelector<HTMLElement>('[data-round-clash-fighter="opponent"]')
  const playerFighter = root.querySelector<HTMLElement>('[data-round-clash-fighter="player"]')

  if (!intro || !backdrop || !arena || !opponentFighter || !playerFighter) return null
  return { intro, backdrop, arena, opponentFighter, playerFighter }
}

function addIntro(timeline: gsap.core.Timeline, intro: HTMLElement): void {
  const { introDuration } = roundClashConfig

  timeline
    .set(intro, { autoAlpha: 0, xPercent: -50, yPercent: -50, y: -16, scale: 0.58 }, 0)
    .to(intro, { autoAlpha: 1, y: 0, scale: 1.16, duration: 0.24, ease: 'back.out(1.8)' }, 0)
    .to(intro, { scale: 0.9, y: 2, duration: 0.18, ease: 'power2.out' }, 0.24)
    .to(intro, { scale: 1.06, y: -1, duration: 0.18, ease: 'power2.out' }, 0.42)
    .to(intro, { scale: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.6)
    .to(
      intro,
      { autoAlpha: 0, y: -6, scale: 1.04, duration: 0.3, ease: 'power2.in' },
      introDuration - 0.3,
    )
}

function addBattleScene(
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  elements: RoundClashElements,
): void {
  const { introDuration, overlayFadeDuration } = roundClashConfig
  const overlap = Math.min(6.72, Math.max(2.56, root.clientWidth * 0.0065))

  timeline
    .set(elements.backdrop, { autoAlpha: 0 }, 0)
    .set(elements.arena, { x: 0, y: 0, rotation: 0 }, 0)
    .set(
      elements.opponentFighter,
      {
        autoAlpha: 0,
        xPercent: -100,
        yPercent: -50,
        x: overlap,
        y: 0,
        scale: 1.08,
        rotation: 0,
      },
      0,
    )
    .set(
      elements.playerFighter,
      {
        autoAlpha: 0,
        xPercent: 0,
        yPercent: -50,
        x: -overlap,
        y: 0,
        scale: 1.08,
        rotation: 0,
      },
      0,
    )
    .to(
      elements.backdrop,
      { autoAlpha: 1, duration: overlayFadeDuration, ease: 'power1.out' },
      introDuration,
    )
    .set([elements.opponentFighter, elements.playerFighter], { autoAlpha: 1 }, introDuration)
}

function createHealthTracks(resolution: RoundResolutionResult): {
  player: RoundClashHealthTrack
  opponent: RoundClashHealthTrack
} {
  return {
    player: createRoundClashHealthTrack({
      currentHp: resolution.playerSnapshot.currentHp,
      maxHp: resolution.playerSnapshot.maxHp,
      damageTaken: resolution.playerDamageTaken,
      hpAfter: resolution.playerHpAfter,
    }),
    opponent: createRoundClashHealthTrack({
      currentHp: resolution.opponentSnapshot.currentHp,
      maxHp: resolution.opponentSnapshot.maxHp,
      damageTaken: resolution.opponentDamageTaken,
      hpAfter: resolution.opponentHpAfter,
    }),
  }
}

function addHealthAnimation(
  timeline: gsap.core.Timeline,
  tracks: { player: RoundClashHealthTrack; opponent: RoundClashHealthTrack },
  onHealthProgress: (health: RoundClashHealthProgress) => void,
): void {
  const { introDuration, healthDuration } = roundClashConfig
  const healthClock = { elapsed: 0 }
  const publishProgress = () => {
    onHealthProgress({
      player: getRoundClashHealthAtTime(tracks.player, healthClock.elapsed),
      opponent: getRoundClashHealthAtTime(tracks.opponent, healthClock.elapsed),
    })
  }

  timeline.to(
    healthClock,
    {
      elapsed: healthDuration,
      duration: healthDuration,
      ease: 'none',
      onUpdate: publishProgress,
      onComplete: publishProgress,
    },
    introDuration,
  )
}

export function createRoundClashGsapTimeline(
  options: RoundClashGsapTimelineOptions,
): RoundClashGsapTimelineHandle | null {
  const elements = resolveElements(options.root)
  if (!elements) return null

  let timeline: gsap.core.Timeline | null = null
  let context: gsap.Context | null = null

  context = gsap.context(() => {
    const nextTimeline = gsap.timeline({
      paused: true,
      onComplete: options.onFinished,
    })

    nextTimeline.call(options.onStarted, [], roundClashConfig.introDuration)
    addIntro(nextTimeline, elements.intro)
    addBattleScene(nextTimeline, options.root, elements)
    addHealthAnimation(
      nextTimeline,
      createHealthTracks(options.resolution),
      options.onHealthProgress,
    )
    addRoundClashEffects(
      nextTimeline,
      options.root,
      elements.arena,
      options.effects,
      options.reducedMotion,
    )

    if (options.reducedMotion) nextTimeline.timeScale(100)
    timeline = nextTimeline
  }, options.root)

  if (!timeline) {
    context.revert()
    return null
  }

  return {
    play: () => timeline?.play(0),
    kill: () => {
      timeline?.kill()
      timeline = null
      context?.revert()
      context = null
    },
  }
}
