import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { textureLoader } from './three/TextureLoader.ts'
await textureLoader.loadAll({
  matcap: '/texture/304FB1_69A1EF_5081DF_5C8CE6-256px.png',
  matcap126: '/texture/34AB94_36DFC1_19F9EB_6C6E62-128px.png',
})
createApp(App).mount('#app')
