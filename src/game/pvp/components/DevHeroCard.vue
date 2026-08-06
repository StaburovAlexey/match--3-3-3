<script setup lang="ts">
import { computed } from 'vue'
import { biomePalettes } from '../../presentation/three/biome/BiomePalette.ts'
import type { CombatantDefinition } from '../core/PvPBattleTypes.ts'

const props = withDefaults(
  defineProps<{
    hero: CombatantDefinition
    selected?: boolean
  }>(),
  { selected: false },
)

const emit = defineEmits<{
  select: [heroId: string]
}>()

const elementLabels = {
  ice: 'Лёд',
  fire: 'Огонь',
  earth: 'Земля',
  dark: 'Тьма',
  light: 'Свет',
} as const

const accentColor = computed(() => biomePalettes[props.hero.elementType].particle)
</script>

<template>
  <button
    class="dev-hero-card"
    :class="{ 'dev-hero-card--selected': props.selected }"
    :style="{ '--dev-hero-accent': accentColor }"
    type="button"
    :aria-pressed="props.selected"
    @click="emit('select', props.hero.id)"
  >
    <img class="dev-hero-card__portrait" :src="props.hero.portraitUrl" :alt="props.hero.name" />
    <span class="dev-hero-card__name">{{ props.hero.name }}</span>
    <span class="dev-hero-card__element">{{ elementLabels[props.hero.elementType] }}</span>
    <span class="dev-hero-card__abilities" aria-label="Способности">
      <img
        v-for="ability in props.hero.abilities"
        :key="ability.id"
        class="dev-hero-card__ability"
        :src="ability.iconUrl"
        :title="`${ability.name}: ${ability.description}`"
        :alt="ability.name"
      />
    </span>
  </button>
</template>

<style scoped>
.dev-hero-card {
  --dev-hero-accent: #fff;

  display: grid;
  min-width: 0;
  grid-template-columns: 1fr auto;
  gap: 0.2rem 0.35rem;
  padding: 0.45rem;
  border: 0.1rem solid rgb(255 255 255 / 18%);
  border-radius: 0.9rem;
  color: #f9f6ff;
  background: rgb(12 8 18 / 88%);
  box-shadow: inset 0 0 1rem rgb(0 0 0 / 45%);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 150ms ease,
    filter 150ms ease,
    transform 150ms ease;
}

.dev-hero-card:hover,
.dev-hero-card--selected {
  border-color: var(--dev-hero-accent);
  filter: brightness(1.15);
}

.dev-hero-card--selected {
  box-shadow:
    0 0 1rem color-mix(in srgb, var(--dev-hero-accent) 42%, transparent),
    inset 0 0 1rem rgb(0 0 0 / 45%);
  transform: translateY(-0.12rem);
}

.dev-hero-card__portrait {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  grid-column: 1 / -1;
  object-fit: contain;
}

.dev-hero-card__name {
  overflow: hidden;
  font-size: clamp(0.72rem, 2vw, 0.92rem);
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dev-hero-card__element {
  align-self: center;
  color: var(--dev-hero-accent);
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
}

.dev-hero-card__abilities {
  display: flex;
  grid-column: 1 / -1;
  justify-content: center;
  gap: 0.3rem;
}

.dev-hero-card__ability {
  width: 1.45rem;
  aspect-ratio: 1;
  border-radius: 0.3rem;
  object-fit: contain;
}
</style>
