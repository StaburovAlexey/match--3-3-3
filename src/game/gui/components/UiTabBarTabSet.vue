<script setup lang="ts">
import battleActiveIcon from '../assets/tab-bar/battle-active.png'
import battleInactiveIcon from '../assets/tab-bar/battle-inactive.png'
import collectionActiveIcon from '../assets/tab-bar/collection-active.png'
import collectionInactiveIcon from '../assets/tab-bar/collection-inactive.png'
import lockedActiveIcon from '../assets/tab-bar/locked-active.png'
import lockedInactiveIcon from '../assets/tab-bar/locked-inactive.png'
import shopActiveIcon from '../assets/tab-bar/shop-active.png'
import shopInactiveIcon from '../assets/tab-bar/shop-inactive.png'
import upgradeActiveIcon from '../assets/tab-bar/upgrade-active.png'
import upgradeInactiveIcon from '../assets/tab-bar/upgrade-inactive.png'
import { mainPageTabs } from './MainPageTabs.ts'
import type { MainPageTabId } from './MainPageTabs.ts'

interface TabIconSet {
  readonly active: string
  readonly inactive: string
}

const props = defineProps<{
  activeTab: MainPageTabId
}>()

const emit = defineEmits<{
  select: [tab: MainPageTabId]
}>()

const tabIcons: Readonly<Record<MainPageTabId, TabIconSet>> = {
  shop: { active: shopActiveIcon, inactive: shopInactiveIcon },
  collection: { active: collectionActiveIcon, inactive: collectionInactiveIcon },
  battle: { active: battleActiveIcon, inactive: battleInactiveIcon },
  locked: { active: lockedActiveIcon, inactive: lockedInactiveIcon },
  upgrade: { active: upgradeActiveIcon, inactive: upgradeInactiveIcon },
}
</script>

<template>
  <nav class="ui-tab-bar" aria-label="Разделы игры">
    <button
      v-for="tab in mainPageTabs"
      :key="tab.id"
      class="ui-tab-bar__tab"
      :class="{ 'ui-tab-bar__tab--active': props.activeTab === tab.id }"
      type="button"
      :aria-current="props.activeTab === tab.id ? 'page' : undefined"
      :aria-label="tab.label"
      @click="emit('select', tab.id)"
    >
      <img
        class="ui-tab-bar__icon"
        :src="tabIcons[tab.id][props.activeTab === tab.id ? 'active' : 'inactive']"
        alt=""
        aria-hidden="true"
      />
      <span class="ui-tab-bar__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.ui-tab-bar {
  border-radius: 8px;
  display: flex;
  width: 100%;
  height: clamp(64px, 17.68cqw, 76px);
  gap: 3px;
  filter: drop-shadow(0 12px 18px rgb(0 0 0 / 48%));
  background: #222835;
  -webkit-box-shadow: 0px 0px 32px 15px rgba(0, 0, 0, 0.66);
  box-shadow: 0px 0px 32px 15px rgba(0, 0, 0, 0.66);
}

.ui-tab-bar__tab {
  position: relative;
  display: block;
  min-width: 0;
  height: 100%;
  flex: 1;
  padding: 0;
  overflow: visible;
  border: 0;
  color: #fff;
  background: #374056;
  /* background: transparent; */
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    flex-basis 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 160ms ease,
    transform 160ms ease;
}
.ui-tab-bar__tab:first-child {
  border-top-left-radius: 8px;
}
.ui-tab-bar__tab:last-child {
  border-top-right-radius: 8px;
}
.ui-tab-bar__tab--active {
  z-index: 1;
  flex-basis: 114px;
  background: linear-gradient(180deg, #303342 0%, #374056 24.5%, #454b5e 49%, #374056 100%);
}

.ui-tab-bar__tab:hover {
  filter: brightness(1.12);
}

.ui-tab-bar__tab:active {
  transform: translateY(1px);
  filter: brightness(0.94);
}

.ui-tab-bar__tab:focus-visible {
  z-index: 3;
  box-shadow:
    inset 0 0 0 2px #9c6bff,
    0 0 0 2px rgb(12 7 16 / 90%);
}

.ui-tab-bar__icon {
  position: absolute;
  top: 5px;
  left: 50%;
  display: block;
  width: 60px;
  height: 60px;
  max-width: 92%;
  transform: translateX(-50%);
  object-fit: contain;
  pointer-events: none;
  transition:
    width 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
    height 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
    top 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.ui-tab-bar__tab--active .ui-tab-bar__label {
  opacity: 1;
  transform: translateY(0);
}

.ui-tab-bar__tab--active .ui-tab-bar__icon {
  top: -20px;
  width: 72px;
  height: 72px;
}

.ui-tab-bar__label {
  position: absolute;
  right: 7px;
  bottom: 10px;
  left: 7px;
  overflow: hidden;
  font-family: 'Goldman Sans', Inter, system-ui, sans-serif;
  font-size: 16px;
  font-weight: 900;
  line-height: 19px;
  letter-spacing: -0.16px;
  text-align: center;
  text-overflow: ellipsis;
  text-shadow:
    0 1px 0 #000,
    0 0.5px 2.54px rgb(0 0 0 / 80%);
  white-space: nowrap;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 160ms ease 90ms,
    transform 220ms ease 60ms;
}

@container game (max-width: 359px) {
  .ui-tab-bar {
    width: calc(100% - 8px);
    gap: 2px;
  }

  .ui-tab-bar__label {
    right: 3px;
    left: 3px;
    font-size: 13px;
    letter-spacing: -0.13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-tab-bar__tab,
  .ui-tab-bar__icon,
  .ui-tab-bar__label {
    transition: none;
  }
}
</style>
