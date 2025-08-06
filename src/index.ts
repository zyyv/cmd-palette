import type { App } from 'vue'
import CommandPalette from './CommandPalette.vue'

export {  CommandPalette }

export default {
  install: (app: App) => {
    app.component('CommandPalette', CommandPalette)
  },
}
