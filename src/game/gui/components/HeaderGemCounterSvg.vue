<script setup lang="ts">
import { computed } from 'vue'
import { useGoldmanSansReady } from '../composables/useGoldmanSansReady.ts'
import { truncateSvgText } from '../utils/truncateSvgText.ts'

const props = defineProps<{
  value: string
}>()
const fontRevision = useGoldmanSansReady()

const displayValue = computed(() => {
  fontRevision.value
  return truncateSvgText(props.value, {
    maxWidth: 36,
    fontSize: 12,
    fontWeight: 900,
  })
})
</script>

<template>
  <svg
    width="55"
    viewBox="0 0 72 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g clip-path="url(#clip0_1_176)">
      <rect x="12.5" y="3.5" width="59" height="23" rx="7.5" fill="#003343" />
      <rect x="12.5" y="3.5" width="59" height="23" rx="7.5" stroke="black" />
      <path
        d="M13 4H63.5C67.6421 4 71 7.35786 71 11.5V12H13V4Z"
        fill="#D9D9D9"
        fill-opacity="0.2"
      />
      <path
        d="M14.2461 1.06543L25.4961 7.44043L25.7744 7.59766L25.748 7.91602L24.5654 22.166L24.5449 22.4229L24.3232 22.5547L14.2559 28.5547L14 28.707L13.7441 28.5547L3.67676 22.5547L3.45508 22.4229L3.43457 22.166L2.25195 7.91602L2.22559 7.59766L2.50391 7.44043L13.7539 1.06543L14 0.925781L14.2461 1.06543Z"
        fill="black"
        stroke="black"
      />
      <path d="M14 1.5L2.75 7.875L7.30921 10.125L14 6.375V1.5Z" fill="#FAD9F8" />
      <path d="M2.75 7.875L3.875 22.125L8 19.5L7.30921 10.125L2.75 7.875Z" fill="#F49DF4" />
      <path d="M25.25 7.875L14 1.5V6.375L20.6908 10.125L25.25 7.875Z" fill="#F49DF4" />
      <path d="M24.125 22.125L25.25 7.875L20.6908 10.125L20 19.5L24.125 22.125Z" fill="#D35BFA" />
      <path d="M14 28.125L24.125 22.125L20 19.5L14 22.875V28.125Z" fill="#A02CDD" />
      <path d="M3.875 22.125L14 28.125V22.875L8 19.5L3.875 22.125Z" fill="#BB55F1" />
      <path
        d="M14 6.375L7.30921 10.125L8 19.5L14 22.875L20 19.5L20.6908 10.125L14 6.375Z"
        fill="#E79CF7"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M25.2494 7.88306L24.125 22.1249L14.0001 28.1249L7.50049 24.2734C11.4802 17.0732 17.7137 11.2926 25.2494 7.88306Z"
        fill="black"
        opacity="0.1"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M6.875 10.125L2.75 7.875L7.0625 9.75L13.8125 6L14 1.5L14.1875 6L20.9375 9.75L25.25 7.875L21.3125 10.125L20.7496 19.5325L24.125 22.125L20.347 20.1653L14.375 23.4375L14 28.125L13.625 23.4375L7.65299 20.1653L3.875 22.125L7.4375 19.5L6.875 10.125ZM8 19.5L14 22.875L20 19.5L20.5625 10.125L14 6.375L7.4375 10.125L8 19.5Z"
        fill="white"
      />
      <path
        d="M23.0586 16.7002C24.3288 16.7002 25.3584 17.7297 25.3584 19V21.6416H28C29.2703 21.6416 30.2998 22.6712 30.2998 23.9414V24.0586C30.2998 25.3288 29.2703 26.3584 28 26.3584H25.3584V29C25.3584 30.2703 24.3288 31.2998 23.0586 31.2998H22.9414C21.6712 31.2998 20.6416 30.2703 20.6416 29V26.3584H18C16.7297 26.3584 15.7002 25.3288 15.7002 24.0586V23.9414C15.7002 22.6712 16.7297 21.6416 18 21.6416H20.6416V19C20.6416 17.7297 21.6712 16.7002 22.9414 16.7002H23.0586Z"
        fill="#B3FD09"
        stroke="black"
        stroke-width="0.6"
      />
      <g filter="url(#filter0_i_1_176)">
        <path
          d="M25.0588 21.9412V19C25.0588 17.8954 24.1634 17 23.0588 17H22.9412C21.8366 17 20.9412 17.8954 20.9412 19V21.9412H18C16.8954 21.9412 16 22.8366 16 23.9412V24.0588C16 25.1634 16.8954 26.0588 18 26.0588H20.9412V29C20.9412 30.1046 21.8366 31 22.9412 31H23.0588C24.1634 31 25.0588 30.1046 25.0588 29V26.0588H28C29.1046 26.0588 30 25.1634 30 24.0588V23.9412C30 22.8366 29.1046 21.9412 28 21.9412H25.0588Z"
          fill="#B3FD09"
        />
      </g>
    </g>
    <text
      x="48"
      y="15"
      fill="white"
      font-family="Goldman Sans, sans-serif"
      font-size="12"
      font-weight="900"
      text-anchor="middle"
      dominant-baseline="middle"
      style="text-shadow: 2px 1.5px 2px rgba(0, 0, 0, 1)"
    >
      {{ displayValue }}
    </text>
    <defs>
      <filter
        id="filter0_i_1_176"
        x="16"
        y="17"
        width="14"
        height="14"
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
        <feOffset dy="1" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1_176" />
      </filter>
      <clipPath id="clip0_1_176">
        <rect width="72" height="34" fill="white" />
      </clipPath>
    </defs>
  </svg>
</template>
