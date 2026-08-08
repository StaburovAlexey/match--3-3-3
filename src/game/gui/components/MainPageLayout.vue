<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import type { CSSProperties } from 'vue'

defineSlots<{
  header(): unknown
  default(): unknown
  footer(): unknown
}>()

const headerRef = useTemplateRef<HTMLElement>('header')
const footerRef = useTemplateRef<HTMLElement>('footer')
const headerHeight = shallowRef<number | null>(null)
const footerHeight = shallowRef<number | null>(null)

let resizeObserver: ResizeObserver | undefined

const layoutStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {}

  if (headerHeight.value !== null) {
    style['--main-page-layout-header-height'] = `${headerHeight.value}px`
  }

  if (footerHeight.value !== null) {
    style['--main-page-layout-footer-height'] = `${footerHeight.value}px`
  }

  return style
})

function measureChrome(): void {
  const nextHeaderHeight = headerRef.value
    ? Math.ceil(headerRef.value.getBoundingClientRect().height)
    : null
  const nextFooterHeight = footerRef.value
    ? Math.ceil(footerRef.value.getBoundingClientRect().height)
    : null

  if (headerHeight.value !== nextHeaderHeight) {
    headerHeight.value = nextHeaderHeight
  }

  if (footerHeight.value !== nextFooterHeight) {
    footerHeight.value = nextFooterHeight
  }
}

onMounted(() => {
  measureChrome()

  if (typeof ResizeObserver === 'undefined') {
    return
  }

  resizeObserver = new ResizeObserver(measureChrome)

  if (headerRef.value) {
    resizeObserver.observe(headerRef.value)
  }

  if (footerRef.value) {
    resizeObserver.observe(footerRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <main class="main-page-layout" :style="layoutStyle">
    <div class="main-page-layout__viewport">
      <div class="main-page-layout__content">
        <slot />
      </div>
    </div>

    <div ref="header" class="main-page-layout__header">
      <slot name="header" />
    </div>

    <div ref="footer" class="main-page-layout__footer">
      <slot name="footer" />
    </div>
  </main>
</template>

<style scoped>
.main-page-layout {
  --main-page-layout-header-height: calc(
    max(0.9rem, env(safe-area-inset-top)) + max(60px, 18.75cqw) + 0.9rem
  );
  --main-page-layout-footer-height: calc(
    var(--main-page-tab-bar-height, clamp(4rem, 17.68cqw, 4.75rem)) +
      var(--main-page-tab-bar-overhang, clamp(1rem, 4.65cqw, 1.25rem)) + env(safe-area-inset-bottom)
  );

  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.main-page-layout__viewport {
  position: absolute;
  z-index: 1;
  inset: 0;
  min-width: 0;
  min-height: 0;
  padding: calc(var(--main-page-layout-header-height) + var(--main-page-content-gap, 0.75rem))
    var(--main-page-inline-padding, 1rem)
    calc(var(--main-page-layout-footer-height) + var(--main-page-content-gap, 0.75rem));
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scroll-padding-top: calc(
    var(--main-page-layout-header-height) + var(--main-page-content-gap, 0.75rem)
  );
  scroll-padding-bottom: calc(
    var(--main-page-layout-footer-height) + var(--main-page-content-gap, 0.75rem)
  );
  -webkit-overflow-scrolling: touch;
}

.main-page-layout__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  min-height: 100%;
  align-items: center;
}

.main-page-layout__header,
.main-page-layout__footer {
  position: absolute;
  z-index: 2;
  right: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.main-page-layout__header {
  top: 0;
}

.main-page-layout__footer {
  bottom: 0;
  padding-top: var(--main-page-tab-bar-overhang, clamp(1rem, 4.65cqw, 1.25rem));
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
