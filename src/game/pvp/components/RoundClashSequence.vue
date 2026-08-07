<script setup lang="ts">
import { gsap } from 'gsap'
import { nextTick, onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue'
import type { CombatantState, RoundResolutionResult } from '../core/PvPBattleTypes.ts'
import RoundClashAnimation from './RoundClashAnimation.vue'
import RoundClashIntro from './RoundClashIntro.vue'
import {
  createRoundClashEffectSchedule,
  createRoundClashHealthTrack,
  getRoundClashHealthAtTime,
  roundClashTimelineConfig,
  type RoundClashEffectMoment,
  type RoundClashHealthProgress,
  type RoundClashHealthTrack,
} from './RoundClashTimeline.ts'

interface SequenceElements {
  intro: HTMLElement
  backdrop: HTMLElement
  arena: HTMLElement
  opponentFighter: HTMLElement
  playerFighter: HTMLElement
}

const props = defineProps<{
  player: CombatantState
  opponent: CombatantState
  resolution: RoundResolutionResult | null
}>()

const emit = defineEmits<{
  prepared: [resolution: RoundResolutionResult]
  started: []
  finished: []
  dismissed: []
  healthProgress: [health: RoundClashHealthProgress]
}>()

const isActive = shallowRef(false)
const sequence = shallowRef(0)
const effects = shallowRef<readonly RoundClashEffectMoment[]>([])
const sequenceRoot = useTemplateRef<HTMLDivElement>('sequenceRoot')
let activeTimeline: gsap.core.Timeline | null = null
let animationContext: gsap.Context | null = null
let activeRun = 0

function stopTimeline(): void {
  activeTimeline?.kill()
  activeTimeline = null
  animationContext?.revert()
  animationContext = null
}

function completeSequence(run: number): void {
  if (run !== activeRun) return
  activeTimeline = null
  emit('finished')
}

function abortSequence(run: number): void {
  if (run !== activeRun) return
  stopTimeline()
  isActive.value = false
  emit('finished')
  emit('dismissed')
}

function getSequenceElements(root: HTMLElement): SequenceElements | null {
  const intro = root.querySelector<HTMLElement>('[data-round-clash-intro]')
  const backdrop = root.querySelector<HTMLElement>('[data-round-clash-backdrop]')
  const arena = root.querySelector<HTMLElement>('[data-round-clash-arena]')
  const opponentFighter = root.querySelector<HTMLElement>('[data-round-clash-fighter="opponent"]')
  const playerFighter = root.querySelector<HTMLElement>('[data-round-clash-fighter="player"]')

  if (!intro || !backdrop || !arena || !opponentFighter || !playerFighter) return null
  return { intro, backdrop, arena, opponentFighter, playerFighter }
}

function addIntro(timeline: gsap.core.Timeline, intro: HTMLElement): void {
  const { introDuration } = roundClashTimelineConfig

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
  elements: SequenceElements,
): void {
  const { introDuration, overlayFadeDuration } = roundClashTimelineConfig
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

function addArenaShake(
  timeline: gsap.core.Timeline,
  arena: HTMLElement,
  effect: RoundClashEffectMoment,
  start: number,
  reducedMotion: boolean,
): void {
  if (reducedMotion) return
  const durationByKind = {
    explosion: roundClashTimelineConfig.explosionShakeDuration,
    lightning: roundClashTimelineConfig.lightningShakeDuration,
    flash: roundClashTimelineConfig.flashShakeDuration,
  } satisfies Record<RoundClashEffectMoment['kind'], number>
  const duration = durationByKind[effect.kind] * effect.durationScale

  timeline
    .to(
      arena,
      {
        x: effect.shakeX,
        y: effect.shakeY,
        rotation: effect.shakeRotation,
        duration: duration * 0.22,
        ease: 'power4.out',
      },
      start,
    )
    .to(
      arena,
      {
        x: effect.shakeX * -0.55,
        y: effect.shakeY * -0.55,
        rotation: effect.shakeRotation * -0.55,
        duration: duration * 0.26,
        ease: 'power2.inOut',
      },
      start + duration * 0.22,
    )
    .to(
      arena,
      {
        x: effect.shakeX * 0.25,
        y: effect.shakeY * 0.25,
        rotation: effect.shakeRotation * 0.25,
        duration: duration * 0.2,
        ease: 'power2.inOut',
      },
      start + duration * 0.48,
    )
    .to(
      arena,
      { x: 0, y: 0, rotation: 0, duration: duration * 0.32, ease: 'power2.out' },
      start + duration * 0.68,
    )
}

function addLightning(
  timeline: gsap.core.Timeline,
  effectRoot: HTMLElement,
  effect: RoundClashEffectMoment,
  start: number,
): void {
  const paths = effectRoot.querySelectorAll<SVGElement>('[data-round-clash-lightning-path]')
  const duration = roundClashTimelineConfig.lightningDuration * effect.durationScale
  const drawDuration = Math.min(0.16, duration * 0.3)
  const fadeDuration = Math.min(0.18, duration * 0.34)

  timeline
    .set(
      effectRoot,
      {
        autoAlpha: 0,
        xPercent: -50,
        yPercent: -50,
        rotation: effect.rotation,
        scaleX: effect.scale * effect.flipX,
        scaleY: effect.scale,
      },
      0,
    )
    .set(paths, { strokeDashoffset: 1 }, 0)
    .set(effectRoot, { autoAlpha: 1 }, start)
    .to(paths, { strokeDashoffset: 0, duration: drawDuration, ease: 'power2.out' }, start)
    .to(
      effectRoot,
      {
        autoAlpha: 0.22,
        duration: 0.035,
        repeat: effect.flickerCount,
        yoyo: true,
        ease: 'none',
      },
      start + drawDuration,
    )
    .to(
      effectRoot,
      {
        autoAlpha: 0,
        scaleX: effect.scale * effect.flipX * 1.08,
        scaleY: effect.scale * 1.08,
        duration: fadeDuration,
        ease: 'power2.in',
      },
      start + duration - fadeDuration,
    )
}

function addExplosion(
  timeline: gsap.core.Timeline,
  effectRoot: HTMLElement,
  effect: RoundClashEffectMoment,
  start: number,
): void {
  const flash = effectRoot.querySelector<HTMLElement>('[data-round-clash-explosion-flash]')
  const rings = effectRoot.querySelectorAll<HTMLElement>('[data-round-clash-explosion-ring]')
  const duration = roundClashTimelineConfig.explosionDuration * effect.durationScale

  if (!flash || rings.length === 0) return

  timeline
    .set(
      effectRoot,
      {
        autoAlpha: 0,
        xPercent: -50,
        yPercent: -50,
        rotation: effect.rotation,
        scaleX: effect.scale * effect.flipX,
        scaleY: effect.scale,
      },
      0,
    )
    .set(flash, { autoAlpha: 0, scale: 0.16 }, 0)
    .set(rings, { autoAlpha: 0, scale: 0.18 }, 0)
    .set(effectRoot, { autoAlpha: 1 }, start)
    .set(flash, { autoAlpha: 1 }, start)
    .to(flash, { autoAlpha: 0, scale: 1.7, duration: duration * 0.68, ease: 'power3.out' }, start)
    .set(rings, { autoAlpha: 0.9 }, start + 0.02)
    .to(
      rings,
      {
        autoAlpha: 0,
        scale: 2.25,
        duration: duration * 0.88,
        stagger: duration * 0.06,
        ease: 'power2.out',
      },
      start + 0.02,
    )
    .set(effectRoot, { autoAlpha: 0 }, start + duration)
}

function addFlash(
  timeline: gsap.core.Timeline,
  effectRoot: HTMLElement,
  effect: RoundClashEffectMoment,
  start: number,
): void {
  const flash = effectRoot.querySelector<HTMLElement>('[data-round-clash-flash]')
  const duration = roundClashTimelineConfig.flashDuration * effect.durationScale

  if (!flash) return

  timeline
    .set(
      effectRoot,
      {
        autoAlpha: 0,
        xPercent: -50,
        yPercent: -50,
        rotation: effect.rotation,
        scaleX: effect.scale * effect.flipX,
        scaleY: effect.scale,
      },
      0,
    )
    .set(flash, { autoAlpha: 0, scale: 0.18 }, 0)
    .set(effectRoot, { autoAlpha: 1 }, start)
    .to(flash, { autoAlpha: 1, scale: 0.75, duration: duration * 0.18, ease: 'power4.out' }, start)
    .to(
      flash,
      { autoAlpha: 0, scale: 1.8, duration: duration * 0.82, ease: 'power2.out' },
      start + duration * 0.18,
    )
    .set(effectRoot, { autoAlpha: 0 }, start + duration)
}

function addCombatEffects(
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  elements: SequenceElements,
  effectMoments: readonly RoundClashEffectMoment[],
  reducedMotion: boolean,
): void {
  effectMoments.forEach((effect) => {
    const effectRoot = root.querySelector<HTMLElement>(`[data-round-clash-effect="${effect.id}"]`)
    if (!effectRoot) return
    const start = roundClashTimelineConfig.introDuration + effect.offset

    if (effect.kind === 'lightning') {
      addLightning(timeline, effectRoot, effect, start)
    } else if (effect.kind === 'explosion') {
      addExplosion(timeline, effectRoot, effect, start)
    } else {
      addFlash(timeline, effectRoot, effect, start)
    }
    addArenaShake(timeline, elements.arena, effect, start, reducedMotion)
  })
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
): void {
  const { introDuration, healthDuration } = roundClashTimelineConfig
  const healthClock = { elapsed: 0 }
  const emitProgress = () => {
    emit('healthProgress', {
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
      onUpdate: emitProgress,
      onComplete: emitProgress,
    },
    introDuration,
  )
}

function startTimeline(resolution: RoundResolutionResult, run: number): void {
  const root = sequenceRoot.value
  if (!root || run !== activeRun) return
  const elements = getSequenceElements(root)

  if (!elements) {
    abortSequence(run)
    return
  }

  animationContext = gsap.context(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => completeSequence(run),
    })

    timeline.call(() => emit('prepared', resolution), [], 0)
    timeline.call(() => emit('started'), [], roundClashTimelineConfig.introDuration)
    addIntro(timeline, elements.intro)
    addBattleScene(timeline, root, elements)
    addHealthAnimation(timeline, createHealthTracks(resolution))
    addCombatEffects(timeline, root, elements, effects.value, reducedMotion)

    if (reducedMotion) {
      timeline.timeScale(100)
    }
    activeTimeline = timeline
  }, root)

  activeTimeline?.play(0)
}

watch(
  () => props.resolution,
  (resolution) => {
    const wasActive = isActive.value
    activeRun += 1
    const run = activeRun
    stopTimeline()

    if (!resolution) {
      isActive.value = false
      effects.value = []
      if (wasActive) emit('dismissed')
      return
    }

    sequence.value += 1
    effects.value = createRoundClashEffectSchedule(
      props.player.elementType,
      props.opponent.elementType,
    )
    isActive.value = true
    void nextTick(() => startTimeline(resolution, run))
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  activeRun += 1
  stopTimeline()
})
</script>

<template>
  <div
    v-if="isActive"
    :key="sequence"
    ref="sequenceRoot"
    class="round-clash-sequence"
    aria-hidden="true"
  >
    <div class="round-clash-sequence__backdrop" data-round-clash-backdrop />
    <RoundClashIntro />
    <RoundClashAnimation :player="props.player" :opponent="props.opponent" :effects="effects" />
  </div>
</template>

<style scoped>
.round-clash-sequence {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.round-clash-sequence__backdrop {
  position: absolute;
  z-index: 4;
  inset: 0;
  visibility: hidden;
  background: rgb(0 0 0 / 68%);
  backdrop-filter: brightness(0.48) saturate(0.72);
  -webkit-backdrop-filter: brightness(0.48) saturate(0.72);
  opacity: 0;
  pointer-events: none;
}
</style>
