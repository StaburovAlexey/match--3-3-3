import { roundClashConfig } from './RoundClashConfig.ts'
import type { RoundClashEffectMoment } from './RoundClashTypes.ts'

function addArenaShake(
  timeline: gsap.core.Timeline,
  arena: HTMLElement,
  effect: RoundClashEffectMoment,
  start: number,
  reducedMotion: boolean,
): void {
  if (reducedMotion) return
  const durationByKind = {
    explosion: roundClashConfig.explosionShakeDuration,
    lightning: roundClashConfig.lightningShakeDuration,
    flash: roundClashConfig.flashShakeDuration,
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
  const duration = roundClashConfig.lightningDuration * effect.durationScale
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
  const duration = roundClashConfig.explosionDuration * effect.durationScale

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
  const duration = roundClashConfig.flashDuration * effect.durationScale

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

export function addRoundClashEffects(
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  arena: HTMLElement,
  effects: readonly RoundClashEffectMoment[],
  reducedMotion: boolean,
): void {
  effects.forEach((effect) => {
    const effectRoot = root.querySelector<HTMLElement>(`[data-round-clash-effect="${effect.id}"]`)
    if (!effectRoot) return
    const start = roundClashConfig.introDuration + effect.offset

    if (effect.kind === 'lightning') {
      addLightning(timeline, effectRoot, effect, start)
    } else if (effect.kind === 'explosion') {
      addExplosion(timeline, effectRoot, effect, start)
    } else {
      addFlash(timeline, effectRoot, effect, start)
    }
    addArenaShake(timeline, arena, effect, start, reducedMotion)
  })
}
