<script setup lang="ts">
import type { PvPDevCombatantValues } from '../../core/PvPBattleDevTypes.ts'

const props = defineProps<{
  title: string
  maxHp: number
  disabled: boolean
}>()

const model = defineModel<PvPDevCombatantValues>({ required: true })

interface FieldDefinition {
  key: keyof PvPDevCombatantValues
  label: string
  max: number
}

const statValueMax = 9999
const fields: readonly FieldDefinition[] = [
  { key: 'hp', label: 'HP', max: props.maxHp },
  { key: 'energy', label: 'Энергия', max: statValueMax },
  { key: 'fireDamage', label: 'Огонь', max: statValueMax },
  { key: 'iceDamage', label: 'Лёд', max: statValueMax },
  { key: 'earthDefense', label: 'Земля', max: statValueMax },
  { key: 'lightDefense', label: 'Свет', max: statValueMax },
]

function updateValue(key: keyof PvPDevCombatantValues, event: Event): void {
  const input = event.currentTarget as HTMLInputElement
  model.value = { ...model.value, [key]: input.valueAsNumber }
}
</script>

<template>
  <fieldset class="pvp-dev-combatant" :disabled="props.disabled">
    <legend class="pvp-dev-combatant__title">{{ props.title }}</legend>
    <label v-for="field in fields" :key="field.key" class="pvp-dev-combatant__field">
      <span class="pvp-dev-combatant__label">{{ field.label }}</span>
      <input
        class="pvp-dev-combatant__input"
        type="number"
        inputmode="numeric"
        min="0"
        :max="field.max"
        step="1"
        :value="model[field.key]"
        @input="updateValue(field.key, $event)"
      />
    </label>
  </fieldset>
</template>

<style scoped>
.pvp-dev-combatant {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
  margin: 0;
  padding: 0.5rem;
  border: 0.06rem solid rgb(133 168 193 / 35%);
  border-radius: 0.55rem;
}

.pvp-dev-combatant__title {
  padding-inline: 0.3rem;
  color: #bfe7ff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pvp-dev-combatant__field {
  display: grid;
  min-width: 0;
  gap: 0.18rem;
}

.pvp-dev-combatant__label {
  overflow: hidden;
  color: #aebfca;
  font-size: 0.6rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pvp-dev-combatant__input {
  width: 100%;
  min-width: 0;
  padding: 0.3rem 0.38rem;
  border: 0.06rem solid rgb(137 185 216 / 42%);
  border-radius: 0.35rem;
  color: #f1f9ff;
  background: rgb(4 15 22 / 88%);
  font: inherit;
  font-size: 0.68rem;
  font-weight: 700;
}

.pvp-dev-combatant__input:focus-visible {
  border-color: #7ad3ff;
  outline: 0.08rem solid rgb(59 190 255 / 36%);
}
</style>
