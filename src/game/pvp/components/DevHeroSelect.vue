<script setup lang="ts">
import { shallowRef } from 'vue'
import type { CombatantDefinition } from '../core/PvPBattleTypes.ts'
import DevHeroCard from './DevHeroCard.vue'

const props = defineProps<{
  heroes: readonly CombatantDefinition[]
  initialPlayerId: string
  initialOpponentId: string
}>()

const emit = defineEmits<{
  start: [playerId: string, opponentId: string]
  back: []
}>()

const playerId = shallowRef(props.initialPlayerId)
const opponentId = shallowRef(props.initialOpponentId)
</script>

<template>
  <main class="dev-hero-select">
    <section class="dev-hero-select__panel">
      <header class="dev-hero-select__header">
        <div>
          <p class="dev-hero-select__eyebrow">DEV MODE</p>
          <h1 class="dev-hero-select__title">Выбор героев</h1>
        </div>
        <button class="dev-hero-select__back" type="button" @click="emit('back')">Назад</button>
      </header>

      <section class="dev-hero-select__side" aria-labelledby="dev-player-title">
        <h2 id="dev-player-title" class="dev-hero-select__side-title">Игрок</h2>
        <div class="dev-hero-select__grid">
          <DevHeroCard
            v-for="hero in props.heroes"
            :key="`player:${hero.id}`"
            :hero="hero"
            :selected="hero.id === playerId"
            @select="playerId = $event"
          />
        </div>
      </section>

      <section class="dev-hero-select__side" aria-labelledby="dev-opponent-title">
        <h2 id="dev-opponent-title" class="dev-hero-select__side-title">Противник</h2>
        <div class="dev-hero-select__grid">
          <DevHeroCard
            v-for="hero in props.heroes"
            :key="`opponent:${hero.id}`"
            :hero="hero"
            :selected="hero.id === opponentId"
            @select="opponentId = $event"
          />
        </div>
      </section>

      <button
        class="dev-hero-select__start"
        type="button"
        @click="emit('start', playerId, opponentId)"
      >
        Начать PvP
      </button>
    </section>
  </main>
</template>

<style scoped>
.dev-hero-select {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: clamp(0.65rem, 2cqw, 1.2rem);
  background:
    radial-gradient(circle at 15% 20%, rgb(73 31 119 / 38%), transparent 32%),
    radial-gradient(circle at 85% 80%, rgb(24 92 126 / 32%), transparent 34%), #08050d;
}

.dev-hero-select__panel {
  display: grid;
  width: min(100%, 72rem);
  min-height: 100%;
  align-content: center;
  gap: clamp(0.8rem, 2cqh, 1.4rem);
  margin: 0 auto;
}

.dev-hero-select__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.dev-hero-select__eyebrow {
  margin: 0 0 0.2rem;
  color: #f4bf47;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.25em;
}

.dev-hero-select__title,
.dev-hero-select__side-title {
  margin: 0;
  color: #fff;
}

.dev-hero-select__title {
  font-size: clamp(1.6rem, 5cqw, 3rem);
}

.dev-hero-select__side {
  display: grid;
  gap: 0.45rem;
}

.dev-hero-select__side-title {
  font-size: clamp(0.85rem, 2.3cqw, 1.1rem);
}

.dev-hero-select__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(6.5rem, 11.5rem));
  justify-content: space-between;
  gap: clamp(0.35rem, 1.2cqw, 0.7rem);
}

.dev-hero-select__back,
.dev-hero-select__start {
  border: 0.1rem solid rgb(255 255 255 / 40%);
  border-radius: 999px;
  color: #fff;
  background: rgb(31 19 43 / 92%);
  cursor: pointer;
  font-weight: 900;
}

.dev-hero-select__back {
  padding: 0.5rem 0.85rem;
}

.dev-hero-select__start {
  justify-self: center;
  padding: 0.7rem 1.6rem;
  border-color: #f1c348;
  background: linear-gradient(100deg, #71430d, #4a185e);
  font-size: 0.9rem;
}

.dev-hero-select__back:hover,
.dev-hero-select__start:hover {
  filter: brightness(1.2);
}

@container game (max-width: 48rem) {
  .dev-hero-select__grid {
    grid-template-columns: repeat(5, minmax(6.2rem, 9rem));
    justify-content: start;
    overflow-x: auto;
    padding: 0.15rem 0.15rem 0.45rem;
    scroll-snap-type: x proximity;
  }

  .dev-hero-select__grid :deep(.dev-hero-card) {
    scroll-snap-align: start;
  }
}
</style>
