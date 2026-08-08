<script setup lang="ts">
import { computed, nextTick, reactive, shallowRef } from 'vue'
import type { HudShakeReason } from '../../core/model/RewardTarget.ts'
import ScreenCrackOverlay from '../../pvp/components/ScreenCrackOverlay.vue'
import {
  createHudShakeStyle,
  getHudShakeScale,
  getScreenCrackIntensity,
  HUD_EFFECTS_LAB_DEFAULTS,
  HUD_SCREEN_CRACK_BOMB_BOOST,
  HUD_SHAKE_BOMB_BOOST,
  type HudEffectsLabDefaults,
  type HudShakeStyleConfig,
  type ScreenCrackIntensity,
} from '../../pvp/config/HudEffectsConfig.ts'

type LabEvent = 'match' | 'bomb' | 'cracks'
type PreviewTarget = 'header' | 'portrait' | 'bar' | 'stats' | 'ability' | 'button'

const settings = reactive<HudEffectsLabDefaults>({ ...HUD_EFFECTS_LAB_DEFAULTS })
const activeEvent = shallowRef<LabEvent>('match')
const lastEvent = shallowRef('Готово к запуску')
const crackPulseId = shallowRef(0)
const isShaking = shallowRef(false)

const previewTargets: readonly PreviewTarget[] = [
  'header',
  'portrait',
  'bar',
  'stats',
  'ability',
  'button',
]

const shakeStyles = reactive<Record<PreviewTarget, Record<string, string>>>(
  Object.fromEntries(previewTargets.map((target) => [target, {}])) as Record<
    PreviewTarget,
    Record<string, string>
  >,
)

const crackReason = computed<HudShakeReason>(() =>
  activeEvent.value === 'bomb' ? 'bomb' : 'match',
)

const crackIntensity = computed<ScreenCrackIntensity | null>(() => {
  const multiplier =
    activeEvent.value === 'cracks' ? Math.max(2, settings.cascadeLevel) : settings.cascadeLevel
  const base = getScreenCrackIntensity(crackReason.value, multiplier)
  if (!base) return null

  const eventBoost =
    crackReason.value === 'bomb' ? settings.bombBoost / HUD_SCREEN_CRACK_BOMB_BOOST : 1
  const visualStrength = settings.crackStrength * eventBoost
  const defaults = HUD_EFFECTS_LAB_DEFAULTS

  return {
    strength: base.strength * visualStrength,
    opacity: Math.min(
      0.98,
      base.opacity * (settings.crackOpacity / defaults.crackOpacity) * visualStrength,
    ),
    width: base.width * (settings.crackWidth / defaults.crackWidth) * visualStrength,
    scale: 1 + (base.scale - 1) * (settings.crackScale / defaults.crackScale) * visualStrength,
    duration:
      base.duration *
      (settings.crackDuration / defaults.crackDuration) *
      (0.9 + visualStrength * 0.1),
    glow: base.glow * (settings.crackGlow / defaults.crackGlow) * visualStrength,
  }
})

const shakeStrength = computed(() => {
  const reason = activeEvent.value === 'bomb' ? 'bomb' : 'match'
  const base = getHudShakeScale(reason, settings.cascadeLevel)
  if (base === null) return 0

  return base * (reason === 'bomb' ? settings.bombBoost / HUD_SHAKE_BOMB_BOOST : 1)
})

const effectLabel = computed(() => {
  if (activeEvent.value === 'bomb') return `Bomb · X${settings.cascadeLevel}`
  if (activeEvent.value === 'cracks') return `Трещины · X${settings.cascadeLevel}`
  return `Каскад · X${settings.cascadeLevel}`
})

function createShakeStyle(): Record<string, string> {
  const targetScale = 0.86 + Math.random() * 0.28
  const scale = shakeStrength.value * targetScale
  const config: HudShakeStyleConfig = {
    distanceMin: settings.shakeDistance * 0.65,
    distanceMax: settings.shakeDistance,
    angleMin: settings.shakeAngle * 0.65,
    angleMax: settings.shakeAngle,
    durationMin: settings.shakeDuration * 0.9,
    durationMax: settings.shakeDuration * 1.1,
    delayMax: settings.shakeDelay,
  }
  return createHudShakeStyle(scale, config)
}

function trigger(event: LabEvent): void {
  activeEvent.value = event
  lastEvent.value = `${effectLabel.value} · ${new Date().toLocaleTimeString()}`

  if (event !== 'cracks' && (event === 'bomb' || settings.cascadeLevel > 1)) {
    previewTargets.forEach((target) => {
      shakeStyles[target] = createShakeStyle()
    })
    isShaking.value = false
    void nextTick(() => {
      isShaking.value = true
    })
  } else {
    isShaking.value = false
  }

  crackPulseId.value += 1
}

function resetSettings(): void {
  Object.assign(settings, HUD_EFFECTS_LAB_DEFAULTS)
  isShaking.value = false
  lastEvent.value = 'Настройки сброшены'
}

async function copySettings(): Promise<void> {
  try {
    await navigator.clipboard.writeText(JSON.stringify(settings, null, 2))
    lastEvent.value = 'Настройки скопированы в буфер обмена'
  } catch {
    lastEvent.value = 'Не удалось скопировать настройки'
  }
}
</script>

<template>
  <main class="hud-effects-lab">
    <section class="hud-effects-lab__preview" aria-label="HUD effects preview">
      <ScreenCrackOverlay
        :pulse-id="crackPulseId"
        :reason="crackReason"
        :multiplier="settings.cascadeLevel"
        :intensity="crackIntensity"
        :color="settings.crackColor"
      />

      <div class="hud-effects-lab__mock-hud">
        <header
          class="hud-effects-lab__target hud-effects-lab__header pvp-hud-shake-target"
          :class="{ 'pvp-hud-shake-target--active': isShaking }"
          :style="shakeStyles.header"
        >
          <strong>ShadowRift</strong>
          <span>♦ 1250</span>
        </header>

        <div
          class="hud-effects-lab__target hud-effects-lab__portrait pvp-hud-shake-target"
          :class="{ 'pvp-hud-shake-target--active': isShaking }"
          :style="shakeStyles.portrait"
        >
          PORTRAIT
        </div>

        <div
          class="hud-effects-lab__target hud-effects-lab__bar pvp-hud-shake-target"
          :class="{ 'pvp-hud-shake-target--active': isShaking }"
          :style="shakeStyles.bar"
        >
          <span />
          <b>◉ 60 / 100</b>
        </div>

        <div
          class="hud-effects-lab__target hud-effects-lab__stats pvp-hud-shake-target"
          :class="{ 'pvp-hud-shake-target--active': isShaking }"
          :style="shakeStyles.stats"
        >
          <span>⚔ 24</span><span>🛡 18</span><span>✦ 12</span><span>◈ 9</span>
        </div>

        <div
          class="hud-effects-lab__target hud-effects-lab__ability pvp-hud-shake-target"
          :class="{ 'pvp-hud-shake-target--active': isShaking }"
          :style="shakeStyles.ability"
        >
          ABILITY
        </div>

        <button
          class="hud-effects-lab__target hud-effects-lab__button pvp-hud-shake-target"
          :class="{ 'pvp-hud-shake-target--active': isShaking }"
          :style="shakeStyles.button"
          type="button"
          @click="trigger('match')"
        >
          Continue
        </button>
      </div>

      <div class="hud-effects-lab__preview-caption">
        <strong>{{ effectLabel }}</strong>
        <span>{{ lastEvent }}</span>
      </div>
    </section>

    <aside class="hud-effects-lab__panel" aria-label="HUD effects settings">
      <header class="hud-effects-lab__panel-header">
        <div>
          <p>DEV LAB</p>
          <h1>HUD Effects Lab</h1>
        </div>
        <a href="./">В игру</a>
      </header>

      <div class="hud-effects-lab__actions">
        <button type="button" @click="trigger('match')">Каскад X{{ settings.cascadeLevel }}</button>
        <button type="button" @click="trigger('bomb')">Bomb</button>
        <button type="button" @click="trigger('cracks')">Только трещины</button>
        <button type="button" @click="resetSettings">Сбросить</button>
        <button type="button" @click="copySettings">Скопировать JSON</button>
      </div>

      <section class="hud-effects-lab__group">
        <h2>Событие</h2>
        <label>
          <span
            >Уровень каскада <output>X{{ settings.cascadeLevel }}</output></span
          >
          <input v-model.number="settings.cascadeLevel" type="range" min="1" max="5" step="1" />
        </label>
        <label>
          <span
            >Усиление Bomb <output>{{ settings.bombBoost.toFixed(2) }}</output></span
          >
          <input v-model.number="settings.bombBoost" type="range" min="1" max="2.5" step="0.05" />
        </label>
      </section>

      <section class="hud-effects-lab__group">
        <h2>HUD shake</h2>
        <label>
          <span
            >Дистанция <output>{{ settings.shakeDistance.toFixed(1) }} px</output></span
          >
          <input v-model.number="settings.shakeDistance" type="range" min="0" max="12" step="0.5" />
        </label>
        <label>
          <span
            >Угол <output>{{ settings.shakeAngle.toFixed(2) }}°</output></span
          >
          <input v-model.number="settings.shakeAngle" type="range" min="0" max="6" step="0.1" />
        </label>
        <label>
          <span
            >Длительность <output>{{ settings.shakeDuration }} ms</output></span
          >
          <input
            v-model.number="settings.shakeDuration"
            type="range"
            min="80"
            max="900"
            step="10"
          />
        </label>
        <label>
          <span
            >Случайная задержка <output>{{ settings.shakeDelay }} ms</output></span
          >
          <input v-model.number="settings.shakeDelay" type="range" min="0" max="240" step="5" />
        </label>
      </section>

      <section class="hud-effects-lab__group">
        <h2>Screen cracks</h2>
        <label>
          <span
            >Сила <output>{{ settings.crackStrength.toFixed(2) }}</output></span
          >
          <input v-model.number="settings.crackStrength" type="range" min="0" max="2" step="0.05" />
        </label>
        <label>
          <span
            >Opacity <output>{{ settings.crackOpacity.toFixed(2) }}</output></span
          >
          <input v-model.number="settings.crackOpacity" type="range" min="0" max="1" step="0.02" />
        </label>
        <label>
          <span
            >Толщина <output>{{ settings.crackWidth.toFixed(2) }}</output></span
          >
          <input v-model.number="settings.crackWidth" type="range" min="0.2" max="4" step="0.05" />
        </label>
        <label>
          <span
            >Масштаб <output>{{ settings.crackScale.toFixed(2) }}</output></span
          >
          <input
            v-model.number="settings.crackScale"
            type="range"
            min="0.8"
            max="1.35"
            step="0.01"
          />
        </label>
        <label>
          <span
            >Длительность <output>{{ settings.crackDuration }} ms</output></span
          >
          <input
            v-model.number="settings.crackDuration"
            type="range"
            min="120"
            max="1400"
            step="10"
          />
        </label>
        <label>
          <span
            >Glow <output>{{ settings.crackGlow.toFixed(2) }} rem</output></span
          >
          <input v-model.number="settings.crackGlow" type="range" min="0" max="3" step="0.05" />
        </label>
        <label class="hud-effects-lab__color">
          <span>Цвет</span>
          <input v-model="settings.crackColor" type="color" />
        </label>
      </section>
    </aside>
  </main>
</template>

<style scoped>
.hud-effects-lab {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 25rem);
  overflow: hidden;
  color: #f5f1ff;
  background: #090711;
}

.hud-effects-lab__preview {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  place-items: center;
  background:
    radial-gradient(circle at 50% 48%, rgb(127 56 179 / 30%), transparent 36%),
    linear-gradient(145deg, #101d31 0%, #130b23 48%, #07141f 100%);
}

.hud-effects-lab__preview::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgb(255 255 255 / 60%) 0 0.08rem, transparent 0.13rem);
  background-size: 7rem 7rem;
  opacity: 0.25;
}

.hud-effects-lab__mock-hud {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(90%, 38rem);
  grid-template-columns: 7rem 1fr;
  gap: 0.65rem;
  padding: 1.2rem;
  border: 1px solid rgb(205 160 255 / 30%);
  border-radius: 1rem;
  background: rgb(10 7 22 / 72%);
  box-shadow: 0 1rem 4rem rgb(0 0 0 / 35%);
}

.hud-effects-lab__target {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 2.2rem;
  place-items: center;
  border: 1px solid rgb(222 198 255 / 35%);
  border-radius: 0.55rem;
  color: #f8f4ff;
  background: rgb(52 35 78 / 70%);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.hud-effects-lab__header {
  display: flex;
  justify-content: space-between;
  grid-column: 1 / -1;
  padding: 0.6rem 0.75rem;
}

.hud-effects-lab__header span {
  color: #ffd33d;
}

.hud-effects-lab__portrait {
  min-height: 8rem;
  grid-row: span 3;
  color: #d7c5ff;
  background: radial-gradient(circle at 50% 30%, #654f87, #21152f 72%);
}

.hud-effects-lab__bar {
  display: block;
  overflow: hidden;
  padding: 0.55rem;
  text-align: center;
}

.hud-effects-lab__bar span {
  position: absolute;
  inset: 0 auto 0 0;
  width: 60%;
  background: #bf62f2;
}

.hud-effects-lab__bar b {
  position: relative;
  z-index: 1;
  font-size: 0.68rem;
}

.hud-effects-lab__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.25rem;
  padding: 0.45rem;
  color: #e9e3f5;
  font-size: 0.68rem;
}

.hud-effects-lab__ability {
  color: #e8fbff;
  background: rgb(17 99 123 / 72%);
}

.hud-effects-lab__button {
  width: max-content;
  justify-self: center;
  padding: 0.5rem 1.1rem;
  border-color: #e4b82e;
  background: rgb(102 69 15 / 85%);
  cursor: pointer;
}

.hud-effects-lab__preview-caption {
  position: absolute;
  right: 1.1rem;
  bottom: 1rem;
  left: 1.1rem;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: rgb(239 231 255 / 80%);
  font-size: 0.74rem;
}

.hud-effects-lab__preview-caption strong {
  color: #fff;
}

.hud-effects-lab__panel {
  overflow: auto;
  padding: 1rem;
  border-left: 1px solid rgb(218 185 255 / 18%);
  background: rgb(15 10 28 / 96%);
}

.hud-effects-lab__panel-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.hud-effects-lab__panel-header p {
  margin: 0 0 0.25rem;
  color: #d393ff;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.hud-effects-lab__panel-header h1 {
  margin: 0;
  font-size: 1.35rem;
}

.hud-effects-lab__panel-header a {
  color: #91dfff;
  font-size: 0.76rem;
}

.hud-effects-lab__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  margin-bottom: 1rem;
}

.hud-effects-lab__actions button {
  min-height: 2.2rem;
  border: 1px solid #79549e;
  border-radius: 0.45rem;
  color: #fff;
  background: #24153a;
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
}

.hud-effects-lab__actions button:hover,
.hud-effects-lab__button:hover {
  filter: brightness(1.2);
}

.hud-effects-lab__group {
  margin-bottom: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgb(218 185 255 / 18%);
}

.hud-effects-lab__group h2 {
  margin: 0 0 0.65rem;
  color: #f1d7ff;
  font-size: 0.82rem;
}

.hud-effects-lab__group label {
  display: grid;
  gap: 0.25rem;
  margin: 0.55rem 0;
  color: #d6cbe1;
  font-size: 0.71rem;
}

.hud-effects-lab__group label > span {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.hud-effects-lab__group output {
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.hud-effects-lab__group input[type='range'] {
  width: 100%;
  accent-color: #d179ff;
}

.hud-effects-lab__color {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.hud-effects-lab__color input {
  width: 2.2rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

@container game (max-width: 48rem) {
  .hud-effects-lab {
    height: auto;
    min-height: 100%;
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .hud-effects-lab__preview {
    min-height: 26rem;
  }

  .hud-effects-lab__panel {
    border-top: 1px solid rgb(218 185 255 / 18%);
    border-left: 0;
  }
}
</style>
