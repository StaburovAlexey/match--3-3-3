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
    <rect x="12.5" y="3.5" width="59" height="23" rx="7.5" fill="#003343" />
    <rect x="12.5" y="3.5" width="59" height="23" rx="7.5" stroke="black" />
    <path d="M13 4H63.5C67.6421 4 71 7.35786 71 11.5V12H13V4Z" fill="#D9D9D9" fill-opacity="0.2" />
    <g clip-path="url(#clip0_1_171)">
      <g filter="url(#filter0_d_1_171)">
        <mask
          id="path-3-outside-1_1_171"
          maskUnits="userSpaceOnUse"
          x="-0.64442"
          y="-2.7676"
          width="33.9687"
          height="36.5387"
          fill="black"
        >
          <rect fill="white" x="-0.64442" y="-2.7676" width="33.9687" height="36.5387" />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M13.152 27.7258C18.9507 29.7235 25.3523 25.7523 27.4505 18.856C29.5487 11.9597 26.5488 4.74966 20.7502 2.752C20.7151 2.73991 20.6785 2.72727 20.6405 2.71416C20.3077 2.59933 19.87 2.44826 19.4186 2.30693C19.2647 2.2448 19.1086 2.18644 18.9504 2.13196C13.1518 0.134302 6.75013 4.10546 4.65195 11.0018C2.55378 17.8981 5.55362 25.1081 11.3523 27.1058C11.3704 27.112 11.3885 27.1182 11.4066 27.1243C11.8441 27.2884 12.2946 27.4385 12.682 27.5676C12.8532 27.6246 13.012 27.6776 13.152 27.7258Z"
          />
        </mask>
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M13.152 27.7258C18.9507 29.7235 25.3523 25.7523 27.4505 18.856C29.5487 11.9597 26.5488 4.74966 20.7502 2.752C20.7151 2.73991 20.6785 2.72727 20.6405 2.71416C20.3077 2.59933 19.87 2.44826 19.4186 2.30693C19.2647 2.2448 19.1086 2.18644 18.9504 2.13196C13.1518 0.134302 6.75013 4.10546 4.65195 11.0018C2.55378 17.8981 5.55362 25.1081 11.3523 27.1058C11.3704 27.112 11.3885 27.1182 11.4066 27.1243C11.8441 27.2884 12.2946 27.4385 12.682 27.5676C12.8532 27.6246 13.012 27.6776 13.152 27.7258Z"
          fill="black"
        />
        <path
          d="M27.4505 18.856L28.396 19.1817V19.1817L27.4505 18.856ZM20.7502 2.752L21.0412 1.7953V1.7953L20.7502 2.752ZM20.6405 2.71416L20.9321 1.75764V1.75764L20.6405 2.71416ZM19.4186 2.30693L19.0788 3.24543L19.1161 3.26048L19.1544 3.27247L19.4186 2.30693ZM18.9504 2.13196L19.2415 1.17526V1.17526L18.9504 2.13196ZM11.4066 27.1243L11.7232 26.1768L11.7077 26.171L11.692 26.1657L11.4066 27.1243ZM12.682 27.5676L12.9635 26.6077L12.9635 26.6077L12.682 27.5676ZM26.505 18.5303C24.5218 25.049 18.5821 28.5395 13.4431 26.7691L12.8609 28.6825C19.3192 30.9074 26.1829 26.4556 28.396 19.1817L26.505 18.5303ZM20.4591 3.7087C25.5981 5.47912 28.4883 12.0116 26.505 18.5303L28.396 19.1817C30.609 11.9078 27.4995 4.02021 21.0412 1.7953L20.4591 3.7087ZM20.3489 3.67069C20.3868 3.68378 20.4237 3.6965 20.4591 3.7087L21.0412 1.7953C21.0064 1.78331 20.9701 1.77077 20.9321 1.75764L20.3489 3.67069ZM19.1544 3.27247C19.5901 3.4089 20.015 3.55544 20.3489 3.67069L20.9321 1.75764C20.6005 1.64321 20.1498 1.48762 19.6828 1.34138L19.1544 3.27247ZM18.6594 3.08866C18.8011 3.1375 18.941 3.18979 19.0788 3.24543L19.7584 1.36842C19.5883 1.29981 19.416 1.23539 19.2415 1.17526L18.6594 3.08866ZM5.59742 11.3275C7.58071 4.80878 13.5203 1.31825 18.6594 3.08866L19.2415 1.17526C12.7832 -1.04964 5.91954 3.40213 3.70649 10.6761L5.59742 11.3275ZM11.6434 26.1491C6.50433 24.3787 3.61413 17.8462 5.59742 11.3275L3.70649 10.6761C1.49343 17.95 4.60292 25.8376 11.0612 28.0625L11.6434 26.1491ZM11.692 26.1657C11.6758 26.1602 11.6596 26.1547 11.6434 26.1491L11.0612 28.0625C11.0812 28.0694 11.1012 28.0762 11.1212 28.0829L11.692 26.1657ZM12.9635 26.6077C12.5735 26.4777 12.1404 26.3333 11.7232 26.1768L11.0901 28.0719C11.5477 28.2435 12.0156 28.3993 12.4005 28.5275L12.9635 26.6077ZM13.4431 26.7691C13.2974 26.7189 13.1333 26.6643 12.9635 26.6077L12.4005 28.5275C12.573 28.585 12.7267 28.6363 12.8609 28.6825L13.4431 26.7691Z"
          fill="black"
          mask="url(#path-3-outside-1_1_171)"
        />
      </g>
      <path
        d="M27.4521 18.8522C25.3546 25.7464 18.9609 29.7184 13.1713 27.7239C12.2933 27.4214 10.6723 26.9334 9.9309 26.4105C5.78369 23.4853 3.20926 16.9621 4.98869 11.1135C6.80686 5.13744 12.6351 1.50612 17.7177 1.90424C18.4986 1.9654 19.996 2.49211 20.7671 2.75774C26.5567 4.75227 29.5497 11.958 27.4521 18.8522Z"
        fill="url(#paint0_radial_1_171)"
      />
      <g filter="url(#filter1_d_1_171)">
        <ellipse
          cx="11.1703"
          cy="13.052"
          rx="11.1703"
          ry="13.052"
          transform="matrix(0.945467 0.325717 -0.291071 0.956701 8.45117 -1.48521)"
          fill="url(#paint1_radial_1_171)"
        />
        <ellipse
          cx="11.1703"
          cy="13.052"
          rx="11.1703"
          ry="13.052"
          transform="matrix(0.945467 0.325717 -0.291071 0.956701 8.45117 -1.48521)"
          fill="url(#paint2_linear_1_171)"
          fill-opacity="0.5"
          style="mix-blend-mode: overlay"
        />
        <path
          d="M18.9591 2.32679C24.6731 4.29528 27.6798 11.3923 25.603 18.219C23.5259 25.0459 17.1806 28.922 11.4666 26.9534C5.75274 24.9847 2.74692 17.8873 4.82391 11.0606C6.90099 4.23404 13.2452 0.358601 18.9591 2.32679Z"
          stroke="url(#paint3_radial_1_171)"
          stroke-width="0.3625"
        />
      </g>
      <g filter="url(#filter2_ii_1_171)">
        <ellipse
          cx="8.33342"
          cy="9.6958"
          rx="8.33342"
          ry="9.6958"
          transform="matrix(0.945467 0.325717 -0.291072 0.956701 10.1566 2.64977)"
          fill="#F3AF29"
        />
      </g>
      <g filter="url(#filter3_dd_1_171)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M9.49261 11.5634C9.54565 10.6636 10.2468 9.99053 11.1383 9.98376L18.8584 9.92514C19.6758 9.91894 20.385 10.6089 20.4164 11.441L20.438 12.0109C20.4586 12.5568 20.3449 13.0889 20.1072 13.5592L16.6218 20.4532C16.3875 20.9168 15.9103 21.1921 15.3802 21.1697L13.8774 21.106C13.3133 21.0821 12.79 20.7257 12.5391 20.1946L9.76116 14.3155C9.5102 13.7844 9.39578 13.2062 9.42924 12.6385L9.49261 11.5634ZM12.1456 13.3697C12.0698 12.7366 12.534 12.2111 13.1574 12.2243L16.5862 12.2969C17.0399 12.3065 17.44 12.6615 17.5149 13.121C17.5647 13.4267 17.5224 13.7335 17.3936 14.0005L15.5892 17.7394C15.4337 18.0617 15.0927 18.2402 14.7283 18.1902C14.4064 18.1461 14.1198 17.9304 13.9785 17.6261L12.3275 14.0705C12.2401 13.8822 12.1831 13.6829 12.1589 13.4807L12.1456 13.3697Z"
          fill="url(#paint4_linear_1_171)"
        />
      </g>
      <path
        d="M7.24018 16.7746C7.90986 21.7268 11.3946 24.6201 15.7078 23.7416C20.3677 22.7924 23.1019 17.4411 22.8556 13.844L7.24018 16.7746Z"
        fill="black"
        fill-opacity="0.11"
      />
    </g>
    <path
      d="M26.0586 16.7002C27.3288 16.7002 28.3584 17.7297 28.3584 19V21.6416H31C32.2703 21.6416 33.2998 22.6712 33.2998 23.9414V24.0586C33.2998 25.3288 32.2703 26.3584 31 26.3584H28.3584V29C28.3584 30.2703 27.3288 31.2998 26.0586 31.2998H25.9414C24.6712 31.2998 23.6416 30.2703 23.6416 29V26.3584H21C19.7297 26.3584 18.7002 25.3288 18.7002 24.0586V23.9414C18.7002 22.6712 19.7297 21.6416 21 21.6416H23.6416V19C23.6416 17.7297 24.6712 16.7002 25.9414 16.7002H26.0586Z"
      fill="#B3FD09"
      stroke="black"
      stroke-width="0.6"
    />
    <g filter="url(#filter4_i_1_171)">
      <path
        d="M28.0588 21.9412V19C28.0588 17.8954 27.1634 17 26.0588 17H25.9412C24.8366 17 23.9412 17.8954 23.9412 19V21.9412H21C19.8954 21.9412 19 22.8366 19 23.9412V24.0588C19 25.1634 19.8954 26.0588 21 26.0588H23.9412V29C23.9412 30.1046 24.8366 31 25.9412 31H26.0588C27.1634 31 28.0588 30.1046 28.0588 29V26.0588H31C32.1046 26.0588 33 25.1634 33 24.0588V23.9412C33 22.8366 32.1046 21.9412 31 21.9412H28.0588Z"
        fill="#B3FD09"
      />
    </g>
    <text
      x="50"
      y="15"
      class="header-svg-text header-svg-text--shadow"
      filter="url(#header-svg-text-shadow-coins)"
      fill="white"
      font-size="12"
      font-weight="900"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ displayValue }}
    </text>
    <defs>
      <filter
        id="header-svg-text-shadow-coins"
        x="-20%"
        y="-40%"
        width="140%"
        height="220%"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-color="#000000" flood-opacity="1" result="shadowColor" />
        <feComposite in="shadowColor" in2="SourceAlpha" operator="in" result="shadow" />
        <feOffset in="shadow" dx="2" dy="1.5" result="offsetShadow" />
        <feGaussianBlur in="offsetShadow" stdDeviation="1.2" result="blurShadow" />
        <feMerge>
          <feMergeNode in="blurShadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter
        id="filter0_d_1_171"
        x="2.99756"
        y="0.599945"
        width="26.4699"
        height="29.0204"
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
        <feOffset dx="0.3625" dy="0.3625" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.45 0" />
        <feBlend mode="soft-light" in2="BackgroundImageFix" result="effect1_dropShadow_1_171" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_171" result="shape" />
      </filter>
      <filter
        id="filter1_d_1_171"
        x="3.98657"
        y="1.6305"
        width="22.816"
        height="26.3816"
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
        <feOffset dx="0.3625" dy="0.3625" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.45 0" />
        <feBlend mode="soft-light" in2="BackgroundImageFix" result="effect1_dropShadow_1_171" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_171" result="shape" />
      </filter>
      <filter
        id="filter2_ii_1_171"
        x="6.84192"
        y="4.9726"
        width="16.7429"
        height="19.335"
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
        <feOffset dx="0.3625" dy="0.3625" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        <feBlend mode="soft-light" in2="shape" result="effect1_innerShadow_1_171" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="-0.3625" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.984342 0 0 0 0 0.77635 0 0 0 0 0.584357 0 0 0 0.4 0"
        />
        <feBlend
          mode="plus-lighter"
          in2="effect1_innerShadow_1_171"
          result="effect2_innerShadow_1_171"
        />
      </filter>
      <filter
        id="filter3_dd_1_171"
        x="8.94666"
        y="8.44789"
        width="12.4095"
        height="14.2869"
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
        <feOffset dx="0.435" dy="0.3625" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        <feBlend mode="soft-light" in2="BackgroundImageFix" result="effect1_dropShadow_1_171" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="0.435" dy="0.3625" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.627295 0 0 0 0 0.371202 0 0 0 0 0.0705707 0 0 0 0.4 0"
        />
        <feBlend mode="multiply" in2="effect1_dropShadow_1_171" result="effect2_dropShadow_1_171" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_1_171" result="shape" />
      </filter>
      <filter
        id="filter4_i_1_171"
        x="19"
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
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1_171" />
      </filter>
      <radialGradient
        id="paint0_radial_1_171"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="matrix(2.9816 -25.5706 21.1663 1.74194 14.7926 29.4645)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.356962" stop-color="#99541B" />
        <stop offset="0.788512" stop-color="#EA7E26" />
        <stop offset="1" stop-color="#EFBB57" />
      </radialGradient>
      <radialGradient
        id="paint1_radial_1_171"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="matrix(-4.6277 -25.1718 20.9256 -5.25238 13.8831 27.2228)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.788512" stop-color="#FFB800" />
        <stop offset="1" stop-color="#F9DE68" />
      </radialGradient>
      <linearGradient
        id="paint2_linear_1_171"
        x1="5.13788"
        y1="4.02752"
        x2="19.9032"
        y2="20.9406"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="white" />
        <stop offset="0.555853" stop-color="white" stop-opacity="0" />
      </linearGradient>
      <radialGradient
        id="paint3_radial_1_171"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="matrix(-3.23333 -22.7929 19.9068 -5.16402 17.1767 25.1705)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.0939274" stop-color="#824A0F" stop-opacity="0.45" />
        <stop offset="0.584638" stop-color="#E1A568" />
        <stop offset="0.8" stop-color="#FFD9B1" stop-opacity="0.43" />
        <stop offset="0.965" stop-color="#FFE0C1" />
      </radialGradient>
      <linearGradient
        id="paint4_linear_1_171"
        x1="15.114"
        y1="9.39626"
        x2="13.5132"
        y2="21.0624"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#FFD80E" />
        <stop offset="1" stop-color="#FFDD2B" />
      </linearGradient>
      <clipPath id="clip0_1_171">
        <rect width="30" height="30" fill="white" transform="translate(2)" />
      </clipPath>
    </defs>
  </svg>
</template>
