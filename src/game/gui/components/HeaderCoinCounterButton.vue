<script setup lang="ts">
import HeaderCoinCounterSvg from './HeaderCoinCounterSvg.vue'

defineProps<{
  value: string
}>()

const emit = defineEmits<{
  add: []
}>()
</script>

<template>
  <button
    class="header-currency-counter-button"
    type="button"
    aria-label="Пополнить монеты"
    @click="emit('add')"
  >
    <HeaderCoinCounterSvg :value="value" />
  </button>
</template>

<style scoped>
.header-currency-counter-button {
  display: block;
  flex: none;
  width: max(55px, 17.1875cqw);
  height: max(34px, 10.625cqw);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.header-currency-counter-button :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.header-currency-counter-button:hover {
  filter: brightness(1.15);
}

.header-currency-counter-button:active {
  transform: translateY(1px);
}

.header-currency-counter-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
