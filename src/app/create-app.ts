import '@/styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import router from '@/router'

export function mountApp() {
  window.addEventListener('contextmenu', (event) => {
    event.preventDefault()
  })

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  app.mount('#app')
}
