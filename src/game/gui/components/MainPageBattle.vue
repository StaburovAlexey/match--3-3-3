<script setup lang="ts">
import UiButton from './UiButton.vue'

const isDev = import.meta.env.DEV

const emit = defineEmits<{
  select: [mode: 'classic' | 'pvp']
  devHeroSelect: []
}>()
</script>

<template>
  <section class="main-page-battle" aria-labelledby="main-page-battle-title">
    <p class="main-page-battle__eyebrow">SHADOW RIFT</p>
    <h1 id="main-page-battle-title" class="main-page-battle__title">Выберите бой</h1>
    <p class="main-page-battle__subtitle">Трёхмерное поле уже готово. Выберите режим.</p>

    <div class="main-page-battle__actions">
      <UiButton
        class="ui-button main-page-battle__button main-page-battle__button--pvp"
        type="button"
        @click="emit('select', 'pvp')"
      >
        <span class="main-page-battle__button-title">PvP Battle</span>
        <span class="main-page-battle__button-caption">1v1 · 3 раунда</span>
      </UiButton>

      <UiButton
        class="ui-button main-page-battle__button"
        type="button"
        @click="emit('select', 'classic')"
      >
        <span class="main-page-battle__button-title">Обычная игра</span>
        <span class="main-page-battle__button-caption">Свободное match-3 поле</span>
      </UiButton>

      <UiButton
        v-if="isDev"
        class="ui-button main-page-battle__button main-page-battle__button--dev"
        type="button"
        @click="emit('devHeroSelect')"
      >
        <span class="main-page-battle__button-title">DEV · Выбор героев</span>
        <span class="main-page-battle__button-caption"> Настроить игрока и противника </span>
      </UiButton>

      <a
        v-if="isDev"
        class="main-page-battle__button main-page-battle__button--dev"
        href="?hud-effects-lab"
      >
        <span class="main-page-battle__button-title">DEV · HUD Effects Lab</span>
        <span class="main-page-battle__button-caption"> Тряска, bomb и экранные трещины </span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.main-page-battle {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  align-self: stretch;
  justify-self: stretch;
  text-align: center;
}

.main-page-battle__eyebrow {
  margin: 0 0 0.45rem;
  color: #d9ddff;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.3em;
}

.main-page-battle__title {
  margin: 0;
  color: #fff;
  font-size: clamp(2rem, 9cqw, 4rem);
  line-height: 0.95;
}

.main-page-battle__subtitle {
  margin: 1rem 0 1.5rem;
  color: #e2e5ff;
}

.main-page-battle__actions {
  display: grid;
  gap: 0.75rem;
}

.main-page-battle__button {
  display: grid;
  gap: 0.2rem;
  padding: 1rem;
  border: 0.1rem solid #8bb8ff;
  border-radius: 0.8rem;
  color: #f5f7ff;
  background: rgb(35 45 126 / 82%);
  cursor: pointer;
  text-align: left;
  text-decoration: none;
}

.main-page-battle__button--pvp {
  border-color: #e5b62c;
  background: linear-gradient(100deg, rgb(95 57 15 / 95%), rgb(68 20 88 / 95%));
}

.main-page-battle__button--dev {
  border-color: #4bc6ee;
  color: #e8faff;
  background: rgb(12 62 82 / 88%);
}

.main-page-battle__button:hover {
  filter: brightness(1.18);
}

.main-page-battle__button:focus-visible {
  outline: 2px solid #e5b62c;
  outline-offset: 3px;
}

.main-page-battle__button-title {
  font-size: 1.05rem;
  font-weight: 900;
}

.main-page-battle__button-caption {
  color: rgb(255 255 255 / 72%);
  font-size: 0.76rem;
}
</style>
