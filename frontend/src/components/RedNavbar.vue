<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  transparent?: boolean
}>()

const router = useRouter()
const isMenuOpen = ref(false)

const navLinks = [
  { label: '首页', path: '/' },
  { label: '卫星数据', path: '/satellite' },
  { label: '航天科普', path: '/education' },
  { label: '航天情报', path: '/intelligence' },
]

const navigateTo = (path: string) => {
  router.push(path)
  isMenuOpen.value = false
}
</script>

<template>
  <nav class="navbar" :class="{ 'navbar--transparent': transparent }">
    <div class="navbar__container">
      <!-- Logo -->
      <div class="navbar__logo" @click="navigateTo('/')">
        <div class="navbar__logo-icon">
          <span class="navbar__logo-text">N</span>
        </div>
        <span class="navbar__brand">Nova Space</span>
      </div>

      <!-- Desktop Navigation -->
      <div class="navbar__links">
        <a
          v-for="link in navLinks"
          :key="link.path"
          class="navbar__link"
          :class="{ 'navbar__link--active': $route.path === link.path }"
          @click="navigateTo(link.path)"
        >
          {{ link.label }}
        </a>
      </div>

      <!-- Actions -->
      <div class="navbar__actions">
        <button class="navbar__btn navbar__btn--ghost" @click="navigateTo('/auth')">
          登录
        </button>
        <button class="navbar__btn navbar__btn--primary" @click="navigateTo('/auth?mode=register')">
          免费注册
        </button>
      </div>

      <!-- Mobile Menu Toggle -->
      <button class="navbar__menu-toggle" @click="isMenuOpen = !isMenuOpen">
        <span class="navbar__menu-icon" :class="{ 'navbar__menu-icon--open': isMenuOpen }"></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div class="navbar__mobile-menu" :class="{ 'navbar__mobile-menu--open': isMenuOpen }">
      <a
        v-for="link in navLinks"
        :key="link.path"
        class="navbar__mobile-link"
        @click="navigateTo(link.path)"
      >
        {{ link.label }}
      </a>
      <div class="navbar__mobile-actions">
        <button class="navbar__btn navbar__btn--ghost" @click="navigateTo('/auth')">登录</button>
        <button class="navbar__btn navbar__btn--primary" @click="navigateTo('/auth?mode=register')">
          免费注册
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 72px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar--transparent {
  background: transparent;
  border-bottom: none;
}

.navbar__container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.navbar__logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.navbar__logo-text {
  transform: rotate(-45deg);
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 16px;
  color: white;
}

.navbar__brand {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 20px;
  color: var(--color-text-primary);
}

.navbar__links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.navbar__link {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 150ms ease;
  padding: 8px 0;
  position: relative;
}

.navbar__link:hover {
  color: var(--color-text-primary);
}

.navbar__link--active {
  color: var(--color-text-primary);
}

.navbar__link--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: 1px;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar__btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  border: none;
}

.navbar__btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.navbar__btn--ghost:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.navbar__btn--primary {
  background: var(--color-primary);
  color: white;
}

.navbar__btn--primary:hover {
  background: #d90429;
  box-shadow: 0 0 20px rgba(239, 35, 60, 0.4);
}

.navbar__menu-toggle {
  display: none;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
}

.navbar__menu-icon,
.navbar__menu-icon::before,
.navbar__menu-icon::after {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--color-text-primary);
  border-radius: 1px;
  transition: all 300ms ease;
}

.navbar__menu-icon::before,
.navbar__menu-icon::after {
  content: '';
  position: absolute;
  left: 8px;
}

.navbar__menu-icon::before {
  top: 12px;
}

.navbar__menu-icon::after {
  bottom: 12px;
}

.navbar__menu-icon--open {
  background: transparent;
}

.navbar__menu-icon--open::before {
  transform: rotate(45deg);
  top: 19px;
}

.navbar__menu-icon--open::after {
  transform: rotate(-45deg);
  bottom: 19px;
}

.navbar__mobile-menu {
  display: none;
  position: absolute;
  top: 72px;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.98);
  backdrop-filter: blur(12px);
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar__mobile-menu--open {
  display: block;
}

.navbar__mobile-link {
  display: block;
  padding: 16px 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.navbar__mobile-link:hover {
  color: var(--color-text-primary);
}

.navbar__mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.navbar__mobile-actions .navbar__btn {
  width: 100%;
  text-align: center;
}

@media (max-width: 768px) {
  .navbar__links,
  .navbar__actions {
    display: none;
  }

  .navbar__menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>