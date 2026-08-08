<script setup lang="ts">
import { defineAsyncComponent, reactive, shallowRef } from 'vue'
import type {
  AbilityActivationRequest,
  AbilityTerminalResult,
} from './game/core/ability/AbilityContract.ts'
import type { AbilityEffect } from './game/core/ability/AbilityCommand.ts'
import type { GameRuntimeErrorEvent } from './game/runtime/ThreeGameRuntime.ts'
import ThreeScene from './game/gui/components/ThreeScene.vue'
import MainPage from './game/gui/components/MainPage.vue'
import PvPBattle from './game/pvp/PvPBattle.vue'
import DevHeroSelect from './game/pvp/components/DevHeroSelect.vue'
import {
  defaultOpponentHero,
  defaultPlayerHero,
  getHeroById,
  heroCatalog,
} from './game/pvp/data/HeroCatalog.ts'

const searchParams = new URLSearchParams(window.location.search)
const isLightningLab = searchParams.has('lightning-lab')
const isBombLab = searchParams.has('bomb-lab')
const isClearGlowLab = searchParams.has('clear-glow-lab')
const isHudEffectsLab = searchParams.has('hud-effects-lab')
const isDev = import.meta.env.DEV
const initialMode = searchParams.has('pvp')
  ? 'pvp'
  : searchParams.has('classic')
    ? 'classic'
    : 'select'
type AppMode = 'select' | 'classic' | 'pvp' | 'dev-hero-select'

const mode = shallowRef<AppMode>(initialMode)
const selectedPlayerHero = shallowRef(defaultPlayerHero)
const selectedOpponentHero = shallowRef(defaultOpponentHero)
const playerRating = 1200
const opponentRating = 1250
const LightningLab = defineAsyncComponent(() => import('./game/gui/components/LightningLab.vue'))
const BombExplosionLab = defineAsyncComponent(
  () => import('./game/gui/components/BombExplosionLab.vue'),
)
const CubeClearGlowLab = defineAsyncComponent(
  () => import('./game/gui/components/CubeClearGlowLab.vue'),
)
const HudEffectsLab = defineAsyncComponent(() => import('./game/gui/components/HudEffectsLab.vue'))

interface CharacterAbilityViewModel {
  id: string
  label: string
  charges: number
  effect: AbilityEffect
}

const characterId = 'demo-character'
const abilities = reactive<CharacterAbilityViewModel[]>([
  {
    id: 'convert-light',
    label: 'Свет',
    charges: 3,
    effect: { type: 'convert', elementType: 'light', targetCount: 1 },
  },
  { id: 'free-swap', label: 'Обмен', charges: 3, effect: { type: 'swap' } },
  {
    id: 'rotate-adjacent',
    label: 'Сегменты',
    charges: 3,
    effect: {
      type: 'rotateSegment',
      orientation: 'horizontal',
      pattern: 'adjacent',
      oppositeRotation: false,
    },
  },
])
const abilityRequest = shallowRef<AbilityActivationRequest | null>(null)
const abilityStatus = shallowRef<string | null>(null)
let abilitySequence = 0

function handleModeSelect(nextMode: 'classic' | 'pvp'): void {
  if (nextMode === 'pvp') {
    selectedPlayerHero.value = defaultPlayerHero
    selectedOpponentHero.value = defaultOpponentHero
  }
  mode.value = nextMode
}

function openDevHeroSelect(): void {
  if (isDev) mode.value = 'dev-hero-select'
}

function startDevBattle(playerId: string, opponentId: string): void {
  const player = getHeroById(playerId)
  const opponent = getHeroById(opponentId)
  if (!player || !opponent) return

  selectedPlayerHero.value = player
  selectedOpponentHero.value = opponent
  mode.value = 'pvp'
}

function activateAbility(ability: CharacterAbilityViewModel): void {
  if (abilityRequest.value || ability.charges <= 0) return
  abilitySequence += 1
  abilityStatus.value = null
  abilityRequest.value = {
    activationId: `${characterId}:${ability.id}:${abilitySequence}`,
    characterId,
    abilityId: ability.id,
    effect: ability.effect,
  }
}

function handleAbilityFinished(result: AbilityTerminalResult): void {
  if (result.status === 'applied') {
    const ability = abilities.find(({ id }) => id === result.abilityId)
    if (ability && ability.charges > 0) ability.charges -= 1
    abilityStatus.value = result.rebuilt
      ? 'Способность применена, поле пересобрано.'
      : 'Способность применена.'
  } else if (result.status === 'cancelled') {
    abilityStatus.value = 'Способность отменена.'
  } else {
    abilityStatus.value = result.message
  }
  abilityRequest.value = null
}

function handleRuntimeError(event: GameRuntimeErrorEvent): void {
  console.error(`[${event.context}]`, event.error)
  abilityStatus.value = 'Произошла ошибка. Попробуйте ещё раз.'
}
</script>

<template>
  <HudEffectsLab v-if="isHudEffectsLab" />
  <CubeClearGlowLab v-else-if="isClearGlowLab" />
  <BombExplosionLab v-else-if="isBombLab" />
  <LightningLab v-else-if="isLightningLab" />
  <MainPage
    v-else-if="mode === 'select'"
    @select="handleModeSelect"
    @dev-hero-select="openDevHeroSelect"
  />
  <DevHeroSelect
    v-else-if="isDev && mode === 'dev-hero-select'"
    :heroes="heroCatalog"
    :initial-player-id="selectedPlayerHero.id"
    :initial-opponent-id="selectedOpponentHero.id"
    @start="startDevBattle"
    @back="mode = 'select'"
  />
  <PvPBattle
    v-else-if="mode === 'pvp'"
    :key="`${selectedPlayerHero.id}:${selectedOpponentHero.id}`"
    :player="selectedPlayerHero"
    :player-rating="playerRating"
    :opponent="selectedOpponentHero"
    :opponent-rating="opponentRating"
    @exit="mode = 'select'"
  />
  <main v-else class="app-shell">
    <ThreeScene
      :ability-request="abilityRequest"
      @ability-finished="handleAbilityFinished"
      @runtime-error="handleRuntimeError"
    />
    <aside class="character-abilities" aria-label="Способности персонажа">
      <button
        v-for="ability in abilities"
        :key="ability.id"
        class="character-abilities__button"
        type="button"
        :disabled="abilityRequest !== null || ability.charges <= 0"
        @click="activateAbility(ability)"
      >
        <span>{{ ability.label }}</span>
        <span class="character-abilities__charges">×{{ ability.charges }}</span>
      </button>
      <div v-if="abilityStatus" class="character-abilities__status">
        {{ abilityStatus }}
      </div>
    </aside>
  </main>
</template>

<style scoped>
.character-abilities {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  z-index: 20;
  display: flex;
  width: min(42rem, calc(100% - 2rem));
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.45rem;
  transform: translateX(-50%);
}

.character-abilities__button {
  display: flex;
  gap: 0.45rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgb(56 189 248 / 55%);
  border-radius: 0.5rem;
  color: #f8fafc;
  background: rgb(8 47 73 / 90%);
  cursor: pointer;
}

.character-abilities__button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.character-abilities__charges {
  color: #7dd3fc;
}

.character-abilities__status {
  flex-basis: 100%;
  color: #e0f2fe;
  font-size: 0.78rem;
  text-align: center;
}
</style>
