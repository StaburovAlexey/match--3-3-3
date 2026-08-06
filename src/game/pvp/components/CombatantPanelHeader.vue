<script setup lang="ts">
import { useHudShake } from '../composables/useHudShake.ts'

const props = defineProps<{
  name: string
  rating: number
}>()

const hudShake = useHudShake()
</script>

<template>
  <header
    :ref="hudShake.setTarget"
    class="combatant-panel__header pvp-hud-shake-target"
    :class="{ 'pvp-hud-shake-target--active': hudShake.isShaking.value }"
    :style="hudShake.style.value"
  >
    <h2 class="combatant-panel__name" :title="props.name">{{ props.name }}</h2>
    <div class="combatant-panel__wins" :aria-label="`Рейтинг: ${props.rating}`">
      <span aria-hidden="true">♦</span>{{ props.rating }}
    </div>
  </header>
</template>

<style scoped>
.combatant-panel__header {
  display: grid;
  width: 100%;
  min-height: 1rem;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  align-items: center;
  gap: 0.7rem;
}

.combatant-panel__name {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: clamp(1rem, 2.5vw, 2rem);
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.combatant-panel__wins {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-self: end;
  gap: 0.25rem;
  color: #ffd21f;
  font-size: clamp(1rem, 3vw, 1.35rem);
  font-weight: 900;
}

.combatant-panel__wins span {
  font-size: 0.85em;
}
</style>
