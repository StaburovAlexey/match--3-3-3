<script setup lang="ts">
const props = defineProps<{
  round: number
  maxRounds: number
  turn: number
  maxTurns: number
}>()
</script>

<template>
  <section class="round-progress" aria-label="Прогресс раунда">
    <div class="round-progress__title">ROUND {{ props.round }} / {{ props.maxRounds }}</div>
    <div class="round-progress__turns">
      <span
        v-for="turn in props.maxTurns"
        :key="turn"
        class="round-progress__turn"
        :class="{
          'round-progress__turn--active': turn === props.turn + 1,
          'round-progress__turn--done': turn <= props.turn,
        }"
      >
        {{ turn }}
      </span>
    </div>
  </section>
</template>

<style scoped>
.round-progress {
  display: grid;
  justify-items: center;
  gap: 0.45rem;
  color: #fff;
  text-align: center;
  text-shadow: 0 0 0.7rem rgb(255 190 37 / 55%);
}

.round-progress__title {
  font-size: clamp(0.9rem, 3vw, 1.55rem);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.round-progress__turns {
  display: flex;
  justify-content: center;
  gap: clamp(0.2rem, 1.4vw, 0.65rem);
}

.round-progress__turn {
  display: grid;
  width: clamp(1.8rem, 7vw, 3.1rem);
  aspect-ratio: 1;
  place-items: center;
  border: 0.1rem solid #8f730f;
  border-radius: 50%;
  color: #d3c7a1;
  background: rgb(20 15 9 / 72%);
  font-size: clamp(0.78rem, 2.5vw, 1.2rem);
}

.round-progress__turn--done {
  color: #fff;
  background: rgb(102 67 10 / 75%);
}

.round-progress__turn--active {
  border-color: #fff3a0;
  color: #fff;
  background: #8b5710;
  box-shadow: 0 0 1.1rem #ffba25;
  transform: scale(1.1);
}
</style>
