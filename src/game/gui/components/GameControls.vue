<script setup lang="ts">
const emit = defineEmits<{
  rebuild: []
}>()
</script>

<template>
  <div class="game-controls">
    <button class="game-controls__rebuild" type="button" @click="emit('rebuild')">
      Пересобрать поле
    </button>
  </div>
</template>

<style scoped>
.game-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 20;
}

.game-controls__rebuild {
  padding: 0.6rem 0.9rem;
  border: 1px solid rgb(148 163 184 / 45%);
  border-radius: 0.5rem;
  color: #f8fafc;
  background: rgb(15 23 42 / 85%);
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease;
}

.game-controls__rebuild:hover {
  border-color: rgb(226 232 240 / 70%);
  background: rgb(30 41 59 / 95%);
}

.game-controls__rebuild:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}
</style>
