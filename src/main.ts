import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { textureLoader } from './game/three/loaders/TextureLoader.ts'
await textureLoader.loadAll({
  ice: '/texture/ice128px.png',
  fire: '/texture/fire128px.png',
  earth: '/texture/earth128px.png',
  dark: '/texture/dark128px.png',
  light: '/texture/light128px.png',
})
createApp(App).mount('#app')
