<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import MainPageBattle from './MainPageBattle.vue'
import MainPageHeader from './MainPageHeader.vue'
import type { MainPageCurrencyId } from './MainPageHeaderTypes.ts'
import MainPageLayout from './MainPageLayout.vue'
import { mockMainPageAccount } from './MainPageAccountMock.ts'
import { mainPageTabs } from './MainPageTabs.ts'
import type { MainPageTabId } from './MainPageTabs.ts'
import UiTabBarTabSet from './UiTabBarTabSet.vue'

const activeTab = shallowRef<MainPageTabId>('battle')

const emit = defineEmits<{
  select: [mode: 'classic' | 'pvp']
  devHeroSelect: []
  currencyAdd: [currency: MainPageCurrencyId]
}>()

const activeTabDefinition = computed(
  () => mainPageTabs.find((tab) => tab.id === activeTab.value) ?? mainPageTabs[2],
)

const mainPageClasses = computed(() => ({
  'main-page--battle': activeTab.value === 'battle',
  'main-page--collection': activeTab.value === 'collection',
}))
</script>

<template>
  <MainPageLayout class="main-page" :class="mainPageClasses">
    <template #header>
      <MainPageHeader :model="mockMainPageAccount" @currency-add="emit('currencyAdd', $event)" />
    </template>

    <MainPageBattle
      v-if="activeTab === 'battle'"
      @select="emit('select', $event)"
      @dev-hero-select="emit('devHeroSelect')"
    />

    <section v-else class="main-page__card main-page__card--placeholder" aria-live="polite">
      <p class="main-page__eyebrow">SHADOW RIFT</p>
      <h1 class="main-page__title">{{ activeTabDefinition.label }}</h1>
      <p class="main-page__soon">Скоро</p>
      <p class="main-page__subtitle">{{ activeTabDefinition.placeholder }}</p>
    </section>

    <template #footer>
      <UiTabBarTabSet :active-tab="activeTab" @select="activeTab = $event" />
    </template>
  </MainPageLayout>
</template>

<style scoped>
.main-page {
  --main-page-tab-bar-height: clamp(4rem, 16.5cqw, 4.5rem);
  --main-page-tab-bar-overhang: clamp(0.9375rem, 4.1cqw, 1.125rem);
  --main-page-content-gap: clamp(0.5rem, 2cqw, 0.75rem);
  --main-page-inline-padding: clamp(0.75rem, 3.125cqw, 1rem);

  background: linear-gradient(180deg, #581982 0%, #8c2ca9 37%, #8c2ca9 64%, #581982 100%);
  /* background: radial-gradient(circle at 50% 35%, rgb(119 55 158 / 35%), transparent 35%), #0c0710; */
}

.main-page::before,
.main-page::after {
  position: absolute;
  z-index: 0;
  inset: 0;
  content: '';
  opacity: 0;
  pointer-events: none;
  transition: opacity 500ms ease-in-out;
}

.main-page::before {
  background: linear-gradient(180deg, #352a91 0%, #434caf 33%, #4751bc 63%, #352a91 90%);
}

.main-page::after {
  background: linear-gradient(180deg, #192632 0%, #243746 42%, #2d4558 68%, #192632 100%);
}

.main-page--battle::before {
  opacity: 1;
}

.main-page--collection::after {
  opacity: 1;
}

.main-page__card {
  width: min(100%, 34rem);
  min-height: 0;
  padding: clamp(1.5rem, 5cqw, 3rem);
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

@container game (max-height: 660px) {
  .main-page {
    --main-page-content-gap: 0.45rem;
  }

  .main-page__card {
    padding-block: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .main-page::before,
  .main-page::after {
    transition: none;
  }
}
</style>
