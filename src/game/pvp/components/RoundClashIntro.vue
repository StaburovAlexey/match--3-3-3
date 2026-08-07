<template>
  <div class="round-clash-intro" data-round-clash-intro aria-hidden="true">Раунд завершён</div>
</template>

<style scoped>
.round-clash-intro {
  position: absolute;
  z-index: 7;
  top: 50%;
  left: 50%;
  margin: 0;
  color: #fff4c2;
  font-size: clamp(1.35rem, 6vw, 2.5rem);
  font-weight: 950;
  letter-spacing: 0.08em;
  text-align: center;
  text-shadow:
    0 0 0.45rem rgb(255 194 61 / 82%),
    0 0 1.2rem rgb(255 112 32 / 48%);
  opacity: 0;
  white-space: nowrap;
  pointer-events: none;
  will-change: transform, opacity;
}
</style>
