<script setup lang="ts">
import HeaderStatsAndProfileSvg from './HeaderStatsAndProfileSvg.vue'
import type { MainPageHeaderProfileModel } from './MainPageHeaderTypes.ts'

const props = defineProps<MainPageHeaderProfileModel>()
</script>

<template>
  <HeaderStatsAndProfileSvg v-bind="props" />
</template>
