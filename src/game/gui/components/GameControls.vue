<script setup lang="ts">
import type { AbilityInteractionState } from '../../core/ability/AbilityContract.ts'

const props = defineProps<{
  state: AbilityInteractionState
}>()

const emit = defineEmits<{
  rebuild: []
  cancelAbility: []
  confirmAbility: []
}>()
</script>

<template>
  <div class="game-controls">
    <button
      v-if="props.state.phase === 'idle'"
      class="game-controls__rebuild"
      type="button"
      @click="emit('rebuild')"
    >
      Пересобрать поле
    </button>

    <template v-else>
      <div class="game-controls__hint">
        {{
          props.state.request?.effect.type === 'rotateSegment'
            ? 'Выберите сегмент. Повторный клик меняет угол.'
            : 'Выберите кубы на поле.'
        }}
      </div>

      <button
        class="game-controls__confirm"
        type="button"
        :disabled="
          props.state.phase === 'executing' ||
          props.state.previewBusy ||
          !props.state.canConfirm
        "
        @click="emit('confirmAbility')"
      >
        {{ props.state.phase === 'executing' ? 'Выполняется…' : 'Применить' }}
      </button>
      <button
        class="game-controls__cancel"
        type="button"
        :disabled="props.state.phase === 'executing'"
        @click="emit('cancelAbility')"
      >
        Отмена
      </button>
    </template>

    <div v-if="props.state.error" class="game-controls__error">
      {{ props.state.error }}
    </div>
  </div>
</template>

<style scoped>
.game-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  display: flex;
  width: min(13rem, calc(100% - 2rem));
  flex-direction: column;
  gap: 0.4rem;
}

.game-controls__rebuild,
.game-controls__confirm,
.game-controls__cancel {
  padding: 0.6rem 0.9rem;
  border: 1px solid rgb(148 163 184 / 45%);
  border-radius: 0.5rem;
  color: #f8fafc;
  background: rgb(15 23 42 / 85%);
  cursor: pointer;
}

.game-controls__confirm {
  border-color: rgb(56 189 248 / 55%);
  background: rgb(8 47 73 / 90%);
}

.game-controls__cancel {
  background: rgb(51 65 85 / 90%);
}

.game-controls__hint,
.game-controls__error {
  padding: 0.5rem 0.7rem;
  font-size: 0.82rem;
  text-align: center;
}

.game-controls__hint {
  color: #e0f2fe;
  background: rgb(15 23 42 / 90%);
}

.game-controls__error {
  color: #fecaca;
  background: rgb(127 29 29 / 90%);
}

.game-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
