import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { textureLoader } from './game/presentation/three/loaders/TextureLoader.ts'
await textureLoader.loadAll({
  ice: `${import.meta.env.BASE_URL}texture/ice128px.png`,
  fire: `${import.meta.env.BASE_URL}texture/fire128px.png`,
  earth: `${import.meta.env.BASE_URL}texture/earth128px.png`,
  dark: `${import.meta.env.BASE_URL}texture/dark128px.png`,
  light: `${import.meta.env.BASE_URL}texture/light128px.png`,
  'special-lightning': `${import.meta.env.BASE_URL}texture/lightning.png`,
  'special-bomb': `${import.meta.env.BASE_URL}texture/bomb.png`,
})

createApp(App).mount('#app')
