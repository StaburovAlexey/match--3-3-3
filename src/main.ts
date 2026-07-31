import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { textureLoader } from './game/three/loaders/TextureLoader.ts'
await textureLoader.loadAll({
  ice: `${import.meta.env.BASE_URL}texture/ice128px.png`,
  fire: `${import.meta.env.BASE_URL}texture/fire128px.png`,
  earth: `${import.meta.env.BASE_URL}texture/earth128px.png`,
  dark: `${import.meta.env.BASE_URL}texture/dark128px.png`,
  light: `${import.meta.env.BASE_URL}texture/light128px.png`,
})



createApp(App).mount('#app')
