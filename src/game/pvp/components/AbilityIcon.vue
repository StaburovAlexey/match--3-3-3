<script setup lang="ts">
import type { AbilityState } from '../core/PvPBattleTypes.ts'
import { useHudShake } from '../composables/useHudShake.ts'

const props = withDefaults(
  defineProps<{
    ability: AbilityState
    disabled?: boolean
    selected?: boolean
  }>(),
  { disabled: false, selected: false },
)

const emit = defineEmits<{
  select: [abilityId: string]
}>()

const hudShake = useHudShake()
</script>

<template>
  <button
    :ref="hudShake.setTarget"
    class="ability-icon pvp-hud-shake-target"
    :class="[
      `ability-icon--${props.ability.definition.kind}`,
      { 'ability-icon--selected': props.selected },
      { 'pvp-hud-shake-target--active': hudShake.isShaking.value },
    ]"
    :style="hudShake.style.value"
    type="button"
    :disabled="props.disabled"
    :aria-label="props.ability.definition.name"
    @click="emit('select', props.ability.definition.id)"
  >
    <img class="ability-icon__image" :src="props.ability.definition.iconUrl" alt="" />
    <span v-if="props.ability.definition.activation.type === 'manual'" class="ability-icon__cost">
      {{ props.ability.definition.activation.energyCost }}
    </span>
    <span v-if="props.ability.usedThisRound > 0" class="ability-icon__used">✓</span>
  </button>
</template>

<style scoped>
.ability-icon {
  position: relative;
  display: grid;
  width: 31%;
  aspect-ratio: 1/1;
  flex: 0 0 auto;
  place-items: center;
  gap: 0.16rem;
  border: 0.14rem solid #d7a349;
  border-radius: 0.8rem;
  color: #fff7df;
  background: linear-gradient(145deg, #38215e, #0e071b 70%);
  box-shadow:
    inset 0 0 0.5rem rgb(179 81 255 / 55%),
    0 0 0.45rem rgb(255 190 36 / 35%);
  cursor: pointer;
  transition:
    transform 160ms ease,
    filter 160ms ease;
}

.ability-icon--passive {
  border-color: #96c943;
  background: linear-gradient(145deg, #3e5915, #111908 70%);
}

.ability-icon--ultimate {
  border-color: #f2c742;
  background: linear-gradient(145deg, #5b176a, #17051d 70%);
}

.ability-icon:hover:not(:disabled),
.ability-icon--selected {
  filter: brightness(1.25);
  transform: translateY(-0.15rem);
}

.ability-icon:disabled {
  filter: grayscale(0.85) brightness(0.68);
  cursor: not-allowed;
  opacity: 1;
}

.ability-icon__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ability-icon__name {
  max-width: 100%;
  overflow: hidden;
  font-size: clamp(0.52rem, 1.4cqw, 0.72rem);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.ability-icon__cost {
  position: absolute;
  right: -0.35rem;
  bottom: -0.35rem;
  display: grid;
  width: 1.5rem;
  aspect-ratio: 1/1;
  place-items: center;
  border: 0.12rem solid #ffd400;
  border-radius: 50%;
  color: #fff;
  background: #421071;
  font-size: 0.55rem;
  font-weight: 900;
}

.ability-icon__used {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #caff62;
  background: rgb(5 8 3 / 58%);
  font-size: 2rem;
  text-shadow: 0 0 0.6rem #b9ff31;
}
</style>
