<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import MainPageHeader from './MainPageHeader.vue'
import type { MainPageCurrencyId } from './MainPageHeaderTypes.ts'
import { mockMainPageAccount } from './MainPageAccountMock.ts'
import { mainPageTabs } from './MainPageTabs.ts'
import type { MainPageTabId } from './MainPageTabs.ts'
import UiTabBarTabSet from './UiTabBarTabSet.vue'

const isDev = import.meta.env.DEV
const activeTab = shallowRef<MainPageTabId>('battle')

const emit = defineEmits<{
  select: [mode: 'classic' | 'pvp']
  devHeroSelect: []
  currencyAdd: [currency: MainPageCurrencyId]
}>()

const activeTabDefinition = computed(
  () => mainPageTabs.find((tab) => tab.id === activeTab.value) ?? mainPageTabs[2],
)
</script>

<template>
  <main class="main-page">
    <MainPageHeader :model="mockMainPageAccount" @currency-add="emit('currencyAdd', $event)" />

    <section v-if="activeTab === 'battle'" class="main-page__card">
      <p class="main-page__eyebrow">SHADOW RIFT</p>
      <h1 class="main-page__title">Выберите бой</h1>
      <p class="main-page__subtitle">Трёхмерное поле уже готово. Выберите режим.</p>
      <div class="main-page__actions">
        <button
          class="main-page__button main-page__button--pvp"
          type="button"
          @click="emit('select', 'pvp')"
        >
          <span class="main-page__button-title">PvP Battle</span>
          <span class="main-page__button-caption">1v1 · 3 раунда</span>
        </button>
        <button class="main-page__button" type="button" @click="emit('select', 'classic')">
          <span class="main-page__button-title">Обычная игра</span>
          <span class="main-page__button-caption">Свободное match-3 поле</span>
        </button>
        <button
          v-if="isDev"
          class="main-page__button main-page__button--dev"
          type="button"
          @click="emit('devHeroSelect')"
        >
          <span class="main-page__button-title">DEV · Выбор героев</span>
          <span class="main-page__button-caption">Настроить игрока и противника</span>
        </button>
        <a v-if="isDev" class="main-page__button main-page__button--dev" href="?hud-effects-lab">
          <span class="main-page__button-title">DEV · HUD Effects Lab</span>
          <span class="main-page__button-caption">Тряска, bomb и экранные трещины</span>
        </a>
      </div>
    </section>

    <section v-else class="main-page__card main-page__card--placeholder" aria-live="polite">
      <p class="main-page__eyebrow">SHADOW RIFT</p>
      <h1 class="main-page__title">{{ activeTabDefinition.label }}</h1>
      <p class="main-page__soon">Скоро</p>
      <p class="main-page__subtitle">{{ activeTabDefinition.placeholder }}</p>
    </section>

    <UiTabBarTabSet :active-tab="activeTab" @select="activeTab = $event" />
  </main>
</template>

<style scoped>
.main-page {
  --main-page-header-height: clamp(7rem, 15cqh, 8.4rem);

  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
  padding: calc(var(--main-page-header-height) + 0.8rem) 1rem
    calc(7.5rem + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #581982 0%, #8c2ca9 37%, #8c2ca9 64%, #581982 100%);
  /* background: radial-gradient(circle at 50% 35%, rgb(119 55 158 / 35%), transparent 35%), #0c0710; */
}

.main-page__card {
  width: min(100%, 34rem);
  max-height: calc(100cqh - var(--main-page-header-height) - 9.3rem - env(safe-area-inset-bottom));
  padding: clamp(1.5rem, 5cqw, 3rem);
  overflow: auto;
  border: 0.12rem solid #a752d8;
  border-radius: 1.4rem;
  background: rgb(22 11 30 / 92%);
  box-shadow: 0 0 2rem rgb(162 68 227 / 28%);
  text-align: center;
}

.main-page__card--placeholder {
  display: grid;
  min-height: min(24rem, 55cqh);
  align-content: center;
}

.main-page__eyebrow {
  margin: 0 0 0.45rem;
  color: #d995ff;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.3em;
}

.main-page__title {
  margin: 0;
  color: #fff;
  font-size: clamp(2rem, 9cqw, 4rem);
  line-height: 0.95;
}

.main-page__soon {
  margin: 1.4rem 0 0;
  color: #f1cb63;
  font-size: clamp(1.2rem, 5cqw, 1.8rem);
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.main-page__subtitle {
  margin: 1rem 0 1.5rem;
  color: #d8cbe1;
}

.main-page__card--placeholder .main-page__subtitle {
  margin-bottom: 0;
}

.main-page__actions {
  display: grid;
  gap: 0.75rem;
}

.main-page__button {
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

.main-page__button--pvp {
  border-color: #e5b62c;
  background: linear-gradient(100deg, rgb(95 57 15 / 95%), rgb(68 20 88 / 95%));
}

.main-page__button--dev {
  border-color: #4bc6ee;
  color: #e8faff;
  background: rgb(12 62 82 / 88%);
}

.main-page__button:hover {
  filter: brightness(1.18);
}

.main-page__button:focus-visible {
  outline: 2px solid #e5b62c;
  outline-offset: 3px;
}

.main-page__button-title {
  font-size: 1.05rem;
  font-weight: 900;
}

.main-page__button-caption {
  color: rgb(255 255 255 / 72%);
  font-size: 0.76rem;
}

.main-page > :deep(.ui-tab-bar) {
  position: absolute;
  z-index: 30;
  /* bottom: max(0.75rem, env(safe-area-inset-bottom)); */
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

@container game (max-height: 660px) {
  .main-page {
    --main-page-header-height: 6.4rem;

    align-items: start;
    padding-top: calc(var(--main-page-header-height) + 0.55rem);
  }

  .main-page__card {
    max-height: calc(
      100cqh - var(--main-page-header-height) - 7.9rem - env(safe-area-inset-bottom)
    );
    padding-block: 1rem;
  }
}
</style>
