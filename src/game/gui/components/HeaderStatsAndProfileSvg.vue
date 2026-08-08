<script setup lang="ts">
import { computed } from 'vue'
import { useGoldmanSansReady } from '../composables/useGoldmanSansReady.ts'
import type { MainPageHeaderProfileModel } from './MainPageHeaderTypes.ts'
import { truncateSvgText } from '../utils/truncateSvgText.ts'

const props = defineProps<MainPageHeaderProfileModel>()
const fontRevision = useGoldmanSansReady()
const titleId = 'main-page-header-profile-title'
const numberFormatter = new Intl.NumberFormat('ru-RU')

const formattedRating = computed(() => numberFormatter.format(props.rating))
const experienceValue = computed(() =>
  Math.min(Math.max(props.experience.current, 0), Math.max(props.experience.required, 0)),
)
const experienceProgress = computed(() => {
  if (props.experience.required <= 0) return 0
  return experienceValue.value / props.experience.required
})
const experienceWidth = computed(() => 50 * experienceProgress.value)
const experienceLabel = computed(
  () => `${experienceValue.value}/${Math.max(props.experience.required, 0)}`,
)
const displayName = computed(() => {
  fontRevision.value
  return truncateSvgText(props.playerName, {
    maxWidth: 101,
    fontSize: 8,
    fontWeight: 900,
  })
})
const displayLevel = computed(() => {
  fontRevision.value
  return truncateSvgText(String(props.level), {
    maxWidth: 14,
    fontSize: 8,
    fontWeight: 900,
  })
})
const displayRating = computed(() => {
  fontRevision.value
  return truncateSvgText(formattedRating.value, {
    maxWidth: 80,
    fontSize: 14.5,
    fontWeight: 800,
  })
})
const displayExperience = computed(() => {
  fontRevision.value
  return truncateSvgText(experienceLabel.value, {
    maxWidth: 48,
    fontSize: 4.5,
    fontWeight: 700,
  })
})
</script>

<template>
  <svg
    width="220"
    height="60"
    viewBox="0 0 179 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :aria-labelledby="titleId"
    class="main-page-header-profile__svg"
  >
    <title :id="titleId">Профиль игрока: {{ props.playerName }}</title>

    <defs>
      <clipPath id="profile-portrait-clip">
        <rect x="5" y="5" width="30" height="30" rx="4" />
      </clipPath>
    </defs>

    <mask id="path-1-inside-1_1_9753" fill="white">
      <path d="M28 24H133V32C133 33.6569 131.657 35 130 35H28V24Z" />
    </mask>
    <path d="M28 24H133V32C133 33.6569 131.657 35 130 35H28V24Z" fill="#003343" />
    <path
      d="M28 24H133H28ZM134 32C134 34.2091 132.209 36 130 36H27L29 34H130C131.105 34 132 33.1046 132 32H134ZM27 36V24H29V34L27 36ZM134 24V32C134 34.2091 132.209 36 130 36V34C131.105 34 132 33.1046 132 32V24H134Z"
      fill="black"
      mask="url(#path-1-inside-1_1_9753)"
    />
    <mask id="path-3-inside-2_1_9753" fill="white">
      <path d="M28 35H100V40C100 41.6569 98.6569 43 97 43H28V35Z" />
    </mask>
    <path d="M28 35H100V40C100 41.6569 98.6569 43 97 43H28V35Z" fill="#003343" />
    <path
      d="M28 35H100H28ZM101 40C101 42.2091 99.2091 44 97 44H27L29 42H97C98.1046 42 99 41.1046 99 40H101ZM27 44V35H29V42L27 44ZM101 35V40C101 42.2091 99.2091 44 97 44V42C98.1046 42 99 41.1046 99 40V35H101Z"
      fill="black"
      mask="url(#path-3-inside-2_1_9753)"
    />
    <path
      d="M141 4.5C145.142 4.5 148.5 7.85786 148.5 12V16C148.5 20.1421 145.142 23.5 141 23.5H28.5V4.5H141Z"
      fill="#003343"
    />
    <path
      d="M141 4.5C145.142 4.5 148.5 7.85786 148.5 12V16C148.5 20.1421 145.142 23.5 141 23.5H28.5V4.5H141Z"
      stroke="black"
    />
    <defs>
      <clipPath id="profile-header-clip">
        <path
          d="M141 4.5
           C145.142 4.5 148.5 7.85786 148.5 12
           V16
           C148.5 20.1421 145.142 23.5 141 23.5
           H28.5V4.5H141Z"
        />
      </clipPath>
    </defs>
    <rect
      x="28"
      y="5"
      width="121"
      height="8"
      fill="#D9D9D9"
      fill-opacity="0.2"
      clip-path="url(#profile-header-clip)"
    />

    <g filter="url(#filter0_i_1_9753)">
      <rect x="1" y="1" width="38" height="38" rx="8" fill="#00EEFF" />
    </g>
    <rect x="0.5" y="0.5" width="39" height="39" rx="8.5" stroke="black" />
    <rect x="4.5" y="4.5" width="31" height="31" rx="4.5" fill="#B541FF" stroke="black" />
    <image
      x="3.5"
      y="3.5"
      width="33"
      height="33"
      :href="props.portraitUrl"
      preserveAspectRatio="xMidYMid slice"
      clip-path="url(#profile-portrait-clip)"
    />
    <path
      d="M30.3301 31.5L30.46 31.8027L33.5391 38.9873L33.4678 39.1758L30.4678 47.1758L30.3467 47.5H9.65332L9.53223 47.1758L6.53223 39.1758L6.46094 38.9873L9.54004 31.8027L9.66992 31.5H30.3301Z"
      fill="#003343"
      stroke="black"
    />
    <g filter="url(#filter1_di_1_9753)">
      <path
        d="M29.6699 32.5L32.4609 39.0127L29.6533 46.5H10.3467L7.53809 39.0127L10.3301 32.5H29.6699Z"
        stroke="url(#paint0_linear_1_9753)"
      />
    </g>
    <text
      x="20"
      y="40"
      text-anchor="middle"
      fill="white"
      font-family="Goldman Sans, sans-serif"
      font-size="8"
      font-weight="900"
      dominant-baseline="middle"
      style="text-shadow: 2px 1.5px 2px rgba(0, 0, 0, 1)"
    >
      {{ displayLevel }}
    </text>

    <text
      x="65"
      y="14.5"
      fill="white"
      font-family="Goldman Sans, sans-serif"
      font-size="14.5"
      font-weight="800"
      dominant-baseline="middle"
      style="text-shadow: 2px 1.5px 2px rgba(0, 0, 0, 1)"
    >
      {{ displayRating }}
    </text>

    <text
      x="45"
      y="29"
      fill="white"
      font-family="Goldman Sans, sans-serif"
      font-size="8"
      font-weight="900"
      dominant-baseline="middle"
      style="text-shadow: 2px 1.5px 2px rgba(0, 0, 0, 1)"
    >
      {{ displayName }}
    </text>

    <rect x="48" y="36" width="50" height="5" rx="1" fill="#00141B" />
    <rect x="48" y="36" :width="experienceWidth" height="5" rx="1" fill="#4FEA4F" />
    <text
      x="65"
      y="39"
      fill="white"
      font-family="Goldman Sans, sans-serif"
      font-size="4.5"
      font-weight="700"
      dominant-baseline="middle"
    >
      {{ displayExperience }}
    </text>
    <defs>
      <filter
        id="filter0_i_1_9753"
        x="0"
        y="0"
        width="40"
        height="40"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="-1" dy="-1" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend mode="hard-light" in2="shape" result="effect1_innerShadow_1_9753" />
      </filter>
      <filter
        id="filter1_di_1_9753"
        x="7"
        y="32"
        width="26.5"
        height="15.8"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="0.5" dy="0.8" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        <feBlend mode="soft-light" in2="BackgroundImageFix" result="effect1_dropShadow_1_9753" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_9753" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.45 0"
          result="hardAlpha"
        />
        <feOffset dx="0.3" dy="0.3" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.45 0" />
        <feBlend mode="hard-light" in2="shape" result="effect2_innerShadow_1_9753" />
      </filter>
      <linearGradient
        id="paint0_linear_1_9753"
        x1="10"
        y1="32.5"
        x2="24.5"
        y2="46.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#E6DEB9" />
        <stop offset="1" stop-color="#EBAE5B" />
      </linearGradient>
    </defs>
  </svg>
</template>

<style scoped>
.main-page-header-profile__svg {
  display: block;
  width: max(220px, 68.75cqw);
  height: max(60px, 18.75cqw);
}
</style>
