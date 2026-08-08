<script setup lang="ts">
import { reactive, shallowRef, watch } from 'vue'
import type { PvPBattlePhase } from '../../core/PvPBattleTypes.ts'
import type {
  PvPDevCommandResult,
  PvPDevRoundPatch,
  PvPDevRoundSetup,
} from '../../core/PvPBattleDevTypes.ts'
import PvPDevCombatantEditor from './PvPDevCombatantEditor.vue'
import { usePvPDevEventSequence, type PvPDevComboMultiplier } from './usePvPDevEventSequence.ts'

const props = defineProps<{
  setup: PvPDevRoundSetup | null
  phase: PvPBattlePhase
  round: number
  maxRounds: number
  playerMaxHp: number
  opponentMaxHp: number
  activeMultiplier: number
  mutationEnabled: boolean
  canContinue: boolean
  feedback: PvPDevCommandResult | null
}>()

const emit = defineEmits<{
  combo: [multiplier: PvPDevComboMultiplier]
  bomb: []
  resetEffects: []
  applyRound: [patch: PvPDevRoundPatch]
  forceRound: []
  continueRound: []
}>()

const isOpen = shallowRef(false)
const draft = reactive<PvPDevRoundPatch>(createEmptyPatch())
const comboLevels: readonly PvPDevComboMultiplier[] = [2, 3, 4, 5]
const sequence = usePvPDevEventSequence({ onCombo: (multiplier) => emit('combo', multiplier) })

watch(
  () => props.setup,
  (setup) => {
    if (setup) copySetupToDraft(setup)
  },
  { immediate: true },
)

watch(
  () => props.mutationEnabled,
  (enabled) => {
    if (!enabled) sequence.stop()
  },
)

function createEmptyPatch(): PvPDevRoundPatch {
  const emptyCombatant = () => ({
    hp: 0,
    energy: 0,
    fireDamage: 0,
    iceDamage: 0,
    earthDefense: 0,
    lightDefense: 0,
  })
  return { currentTurn: 1, player: emptyCombatant(), opponent: emptyCombatant() }
}

function copySetupToDraft(setup: PvPDevRoundSetup): void {
  draft.currentTurn = setup.currentTurn
  draft.player = { ...setup.player }
  draft.opponent = { ...setup.opponent }
}

function togglePanel(): void {
  isOpen.value = !isOpen.value
  if (!isOpen.value) sequence.stop()
}

function triggerCombo(multiplier: PvPDevComboMultiplier): void {
  sequence.stop()
  emit('combo', multiplier)
}

function triggerBomb(): void {
  sequence.stop()
  emit('bomb')
}

function applyRound(): void {
  emit('applyRound', {
    currentTurn: draft.currentTurn,
    player: { ...draft.player },
    opponent: { ...draft.opponent },
  })
}

function forceRound(): void {
  sequence.stop()
  emit('forceRound')
}
</script>

<template>
  <aside class="pvp-dev-tools" aria-label="Dev-инструменты PvP">
    <button
      class="pvp-dev-tools__toggle"
      type="button"
      :aria-expanded="isOpen"
      aria-controls="pvp-dev-tools-panel"
      aria-label="Открыть dev-инструменты PvP"
      title="PvP Dev Tools"
      @click="togglePanel"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 3h6l1 3 3 1v4h2v2h-2v4l-3 1-1 3H9l-1-3-3-1v-4H3v-2h2V7l3-1 1-3Z" />
        <path d="M9 9h6v6H9z" />
      </svg>
    </button>

    <section
      v-show="isOpen"
      id="pvp-dev-tools-panel"
      class="pvp-dev-tools__panel"
      aria-label="Панель событий PvP"
    >
      <header class="pvp-dev-tools__header">
        <div>
          <strong class="pvp-dev-tools__title">PVP DEV</strong>
          <span class="pvp-dev-tools__meta">
            Раунд {{ props.round }}/{{ props.maxRounds }} · {{ props.phase }}
          </span>
        </div>
        <button
          class="pvp-dev-tools__close"
          type="button"
          aria-label="Закрыть"
          @click="togglePanel"
        >
          ×
        </button>
      </header>

      <div class="pvp-dev-tools__body">
        <section class="pvp-dev-tools__section">
          <div class="pvp-dev-tools__section-heading">
            <span>Эффекты</span>
            <span>активен ×{{ Math.max(1, props.activeMultiplier) }}</span>
          </div>
          <div class="pvp-dev-tools__actions pvp-dev-tools__actions--four">
            <button
              v-for="multiplier in comboLevels"
              :key="multiplier"
              class="pvp-dev-tools__button"
              type="button"
              @click="triggerCombo(multiplier)"
            >
              ×{{ multiplier }}
            </button>
          </div>
          <div class="pvp-dev-tools__actions">
            <button
              class="pvp-dev-tools__button pvp-dev-tools__button--accent"
              type="button"
              :disabled="sequence.isRunning.value"
              @click="sequence.runComboSequence"
            >
              {{ sequence.isRunning.value ? 'Каскад идёт…' : 'Каскад ×2→×5' }}
            </button>
            <button
              class="pvp-dev-tools__button pvp-dev-tools__button--danger"
              type="button"
              @click="triggerBomb"
            >
              Bomb
            </button>
            <button class="pvp-dev-tools__button" type="button" @click="emit('resetEffects')">
              Сброс
            </button>
          </div>
        </section>

        <section v-if="props.setup" class="pvp-dev-tools__section">
          <div class="pvp-dev-tools__section-heading">
            <span>Текущий раунд</span>
            <button
              class="pvp-dev-tools__link"
              type="button"
              @click="copySetupToDraft(props.setup)"
            >
              Вернуть значения
            </button>
          </div>
          <label class="pvp-dev-tools__turn">
            <span>Ход</span>
            <input
              v-model.number="draft.currentTurn"
              class="pvp-dev-tools__turn-input"
              type="number"
              inputmode="numeric"
              min="1"
              :max="props.setup.maxTurns"
              step="1"
              :disabled="!props.mutationEnabled"
            />
            <span>/ {{ props.setup.maxTurns }}</span>
          </label>
          <PvPDevCombatantEditor
            v-model="draft.player"
            title="Игрок"
            :max-hp="props.playerMaxHp"
            :disabled="!props.mutationEnabled"
          />
          <PvPDevCombatantEditor
            v-model="draft.opponent"
            title="Враг"
            :max-hp="props.opponentMaxHp"
            :disabled="!props.mutationEnabled"
          />
          <button
            class="pvp-dev-tools__button pvp-dev-tools__button--wide"
            type="button"
            :disabled="!props.mutationEnabled"
            @click="applyRound"
          >
            Применить параметры
          </button>
        </section>

        <section class="pvp-dev-tools__section">
          <div class="pvp-dev-tools__section-heading"><span>Управление раундом</span></div>
          <div class="pvp-dev-tools__actions">
            <button
              class="pvp-dev-tools__button pvp-dev-tools__button--danger"
              type="button"
              :disabled="!props.mutationEnabled"
              @click="forceRound"
            >
              Завершить раунд
            </button>
            <button
              class="pvp-dev-tools__button pvp-dev-tools__button--accent"
              type="button"
              :disabled="!props.canContinue"
              @click="emit('continueRound')"
            >
              Следующий раунд
            </button>
          </div>
        </section>

        <p
          v-if="props.feedback"
          class="pvp-dev-tools__feedback"
          :class="{ 'pvp-dev-tools__feedback--error': !props.feedback.accepted }"
          role="status"
        >
          {{ props.feedback.message }}
        </p>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.pvp-dev-tools {
  position: absolute;
  z-index: 50;
  inset: 0;
  color: #e9f7ff;
  font-family: inherit;
  pointer-events: none;
}

.pvp-dev-tools__toggle {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  display: grid;
  width: 2.65rem;
  aspect-ratio: 1;
  padding: 0.58rem;
  border: 0.08rem solid rgb(93 210 255 / 72%);
  border-radius: 50%;
  color: #9de8ff;
  background: rgb(4 17 25 / 90%);
  box-shadow: 0 0 1rem rgb(49 191 255 / 35%);
  cursor: pointer;
  place-items: center;
  pointer-events: auto;
}

.pvp-dev-tools__toggle svg {
  width: 100%;
  fill: none;
  stroke: currentColor;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.pvp-dev-tools__panel {
  position: absolute;
  top: 3.55rem;
  right: 0.55rem;
  display: flex;
  width: min(20rem, calc(100% - 1.1rem));
  max-height: calc(100% - 4.1rem);
  overflow: hidden;
  flex-direction: column;
  border: 0.07rem solid rgb(93 210 255 / 52%);
  border-radius: 0.75rem;
  background: rgb(3 12 18 / 95%);
  box-shadow: 0 0.8rem 2rem rgb(0 0 0 / 55%);
  pointer-events: auto;
  backdrop-filter: blur(0.65rem);
}

.pvp-dev-tools__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.55rem 0.65rem;
  border-bottom: 0.06rem solid rgb(124 203 238 / 25%);
  background: rgb(23 57 71 / 58%);
}

.pvp-dev-tools__title,
.pvp-dev-tools__meta {
  display: block;
}

.pvp-dev-tools__title {
  color: #9de8ff;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
}

.pvp-dev-tools__meta {
  margin-top: 0.1rem;
  color: #91a7b3;
  font-size: 0.58rem;
}

.pvp-dev-tools__close,
.pvp-dev-tools__link {
  border: 0;
  color: #a8cedf;
  background: none;
  cursor: pointer;
}

.pvp-dev-tools__close {
  padding: 0 0.2rem;
  font-size: 1.25rem;
  line-height: 1;
}

.pvp-dev-tools__body {
  display: grid;
  min-height: 0;
  gap: 0.65rem;
  padding: 0.65rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.pvp-dev-tools__section {
  display: grid;
  gap: 0.45rem;
}

.pvp-dev-tools__section + .pvp-dev-tools__section {
  padding-top: 0.65rem;
  border-top: 0.06rem solid rgb(124 203 238 / 18%);
}

.pvp-dev-tools__section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: #c7eafa;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pvp-dev-tools__section-heading > :last-child {
  color: #7693a1;
  font-size: 0.54rem;
}

.pvp-dev-tools__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.pvp-dev-tools__actions--four {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.pvp-dev-tools__button {
  min-width: 0;
  padding: 0.4rem 0.52rem;
  border: 0.06rem solid rgb(129 183 207 / 42%);
  border-radius: 0.42rem;
  color: #e9f7ff;
  background: rgb(20 48 61 / 74%);
  cursor: pointer;
  font: inherit;
  font-size: 0.64rem;
  font-weight: 750;
}

.pvp-dev-tools__button--accent {
  border-color: rgb(72 209 255 / 58%);
  color: #b9efff;
  background: rgb(13 82 105 / 70%);
}

.pvp-dev-tools__button--danger {
  border-color: rgb(255 112 99 / 55%);
  color: #ffd0c8;
  background: rgb(102 31 27 / 68%);
}

.pvp-dev-tools__button--wide {
  width: 100%;
}

.pvp-dev-tools__button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.pvp-dev-tools__link {
  padding: 0;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 0.12rem;
  text-transform: none;
}

.pvp-dev-tools__turn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #aebfca;
  font-size: 0.64rem;
}

.pvp-dev-tools__turn-input {
  width: 3.5rem;
  padding: 0.28rem 0.35rem;
  border: 0.06rem solid rgb(137 185 216 / 42%);
  border-radius: 0.35rem;
  color: #fff;
  background: rgb(4 15 22 / 88%);
  font: inherit;
  font-weight: 800;
}

.pvp-dev-tools__feedback {
  margin: 0;
  padding: 0.42rem 0.5rem;
  border-radius: 0.4rem;
  color: #bdf7ce;
  background: rgb(27 91 49 / 45%);
  font-size: 0.62rem;
}

.pvp-dev-tools__feedback--error {
  color: #ffc4bd;
  background: rgb(112 35 31 / 45%);
}

@container game (max-height: 38rem) {
  .pvp-dev-tools__panel {
    top: 3.15rem;
    max-height: calc(100% - 3.7rem);
  }

  .pvp-dev-tools__toggle {
    top: 0.35rem;
    right: 0.35rem;
    width: 2.4rem;
  }
}
</style>
