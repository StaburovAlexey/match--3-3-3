<script setup lang="ts">
const isDev = import.meta.env.DEV

const emit = defineEmits<{
  select: [mode: 'classic' | 'pvp']
  devHeroSelect: []
}>()
</script>

<template>
  <main class="game-mode-select">
    <section class="game-mode-select__card">
      <p class="game-mode-select__eyebrow">SHADOW RIFT</p>
      <h1 class="game-mode-select__title">Выберите бой</h1>
      <p class="game-mode-select__subtitle">Трёхмерное поле уже готово. Выберите режим.</p>
      <div class="game-mode-select__actions">
        <button
          class="game-mode-select__button game-mode-select__button--pvp"
          type="button"
          @click="emit('select', 'pvp')"
        >
          <span class="game-mode-select__button-title">PvP Battle</span>
          <span class="game-mode-select__button-caption">1v1 · 3 раунда</span>
        </button>
        <button class="game-mode-select__button" type="button" @click="emit('select', 'classic')">
          <span class="game-mode-select__button-title">Обычная игра</span>
          <span class="game-mode-select__button-caption">Свободное match-3 поле</span>
        </button>
        <button
          v-if="isDev"
          class="game-mode-select__button game-mode-select__button--dev"
          type="button"
          @click="emit('devHeroSelect')"
        >
          <span class="game-mode-select__button-title">DEV · Выбор героев</span>
          <span class="game-mode-select__button-caption">Настроить игрока и противника</span>
        </button>
        <a
          v-if="isDev"
          class="game-mode-select__button game-mode-select__button--dev"
          href="?hud-effects-lab"
        >
          <span class="game-mode-select__button-title">DEV · HUD Effects Lab</span>
          <span class="game-mode-select__button-caption">Тряска, bomb и экранные трещины</span>
        </a>
      </div>
    </section>
  </main>
</template>

<style scoped>
.game-mode-select {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  padding: 1rem;
  background: radial-gradient(circle at 50% 35%, rgb(119 55 158 / 35%), transparent 35%), #0c0710;
}

.game-mode-select__card {
  width: min(100%, 34rem);
  padding: clamp(1.5rem, 5vw, 3rem);
  border: 0.12rem solid #a752d8;
  border-radius: 1.4rem;
  background: rgb(22 11 30 / 92%);
  box-shadow: 0 0 2rem rgb(162 68 227 / 28%);
  text-align: center;
}

.game-mode-select__eyebrow {
  margin: 0 0 0.45rem;
  color: #d995ff;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.3em;
}

.game-mode-select__title {
  margin: 0;
  color: #fff;
  font-size: clamp(2rem, 9vw, 4rem);
  line-height: 0.95;
}

.game-mode-select__subtitle {
  margin: 1rem 0 1.5rem;
  color: #d8cbe1;
}

.game-mode-select__actions {
  display: grid;
  gap: 0.75rem;
}

.game-mode-select__button {
  display: grid;
  gap: 0.2rem;
  padding: 1rem;
  border: 0.1rem solid #6d9b41;
  border-radius: 0.8rem;
  color: #f7ffe8;
  background: rgb(35 62 17 / 85%);
  cursor: pointer;
  text-align: left;
  text-decoration: none;
}

.game-mode-select__button--pvp {
  border-color: #e5b62c;
  background: linear-gradient(100deg, rgb(95 57 15 / 95%), rgb(68 20 88 / 95%));
}

.game-mode-select__button--dev {
  border-color: #4bc6ee;
  color: #e8faff;
  background: rgb(12 62 82 / 88%);
}

.game-mode-select__button:hover {
  filter: brightness(1.18);
}

.game-mode-select__button-title {
  font-size: 1.05rem;
  font-weight: 900;
}

.game-mode-select__button-caption {
  color: rgb(255 255 255 / 72%);
  font-size: 0.76rem;
}
</style>
