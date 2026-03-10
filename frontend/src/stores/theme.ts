import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'dark',
    sidebarCollapsed: false
  }),
  getters: {
    isDark: (state) => state.theme === 'dark'
  },
  actions: {
    initTheme() {
      document.documentElement.setAttribute('data-theme', this.theme)
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      this.initTheme()
    }
  }
})
