<script setup lang="ts">
import { computed } from 'vue'
import HeaderCoinCounterButton from './HeaderCoinCounterButton.vue'
import HeaderGemCounterButton from './HeaderGemCounterButton.vue'
import MainPageHeaderProfile from './MainPageHeaderProfile.vue'
import type { MainPageCurrencyId, MainPageHeaderModel } from './MainPageHeaderTypes.ts'

const props = defineProps<{
  model: MainPageHeaderModel
}>()

const emit = defineEmits<{
  currencyAdd: [currency: MainPageCurrencyId]
}>()

const numberFormatter = new Intl.NumberFormat('ru-RU')
const formattedGems = computed(() => numberFormatter.format(props.model.currencies.gems))
const formattedCoins = computed(() => numberFormatter.format(props.model.currencies.coins))
</script>

<template>
  <header class="main-page-header" aria-label="Профиль игрока">
    <!-- <div class="main-page-header__shine" aria-hidden="true" /> -->

    <MainPageHeaderProfile
      :player-name="props.model.playerName"
      :portrait-url="props.model.portraitUrl"
      :rating="props.model.rating"
      :level="props.model.level"
      :experience="props.model.experience"
    />

    <section class="main-page-header__currencies" aria-label="Валюты">
      <HeaderGemCounterButton :value="formattedGems" @add="emit('currencyAdd', 'gems')" />

      <HeaderCoinCounterButton :value="formattedCoins" @add="emit('currencyAdd', 'coins')" />
    </section>
  </header>
</template>

<style scoped>
.main-page-header {
  position: absolute;
  z-index: 25;
  top: 0;
  left: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  width: 100%;
  height: var(--main-page-header-height, 8.4rem);
  align-items: start;
  gap: clamp(0.25rem, 1.7cqw, 0.8rem);
  padding: max(0.9rem, env(safe-area-inset-top)) clamp(0.7rem, 2.4cqw, 1.25rem) 0.9rem;
  background: linear-gradient(
    180deg,
    rgb(5 8 22 / 72%) 0%,
    rgb(8 11 28 / 38%) 48%,
    rgb(8 11 28 / 0%) 100%
  );
  /* overflow: hidden;
  border-bottom: 1px solid rgb(224 126 255 / 42%);
  background:
    radial-gradient(circle at 14% 65%, rgb(154 69 255 / 34%), transparent 30%),
    linear-gradient(180deg, #14061f 0%, #281044 56%, #451567 100%);
  box-shadow:
    0 0.55rem 1.2rem rgb(10 2 18 / 55%),
    inset 0 -0.15rem 0.5rem rgb(224 91 255 / 17%); */
}

.main-page-header__shine {
  position: absolute;
  inset: 0 0 auto;
  height: 42%;
  pointer-events: none;
  background: linear-gradient(180deg, rgb(255 255 255 / 9%), transparent);
}

.main-page-header__currencies {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding-top: 0.17rem;
  gap: clamp(0.2rem, 1cqw, 0.45rem);
}

@container game (max-height: 660px) {
  .main-page-header {
    padding-top: max(0.55rem, env(safe-area-inset-top));
    padding-bottom: 0.6rem;
  }
}
</style>
