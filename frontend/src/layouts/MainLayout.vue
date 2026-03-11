<template>
  <div class="main-layout">
    <!-- 顶部导航 -->
    <header class="navbar">
      <div class="nav-container">
        <!-- Logo -->
        <div class="logo" @click="router.push('/')">
          <div class="logo-icon">
            <span>N</span>
          </div>
          <span class="logo-text">NOVA SPACE</span>
        </div>

        <!-- 主导航 -->
        <nav class="main-nav">
          <a
            v-for="item in navItems"
            :key="item.path"
            :class="['nav-item', { active: route.path === item.path }]"
            @click="router.push(item.path)"
          >
            <component :is="item.icon" class="nav-icon" />
            <span>{{ item.name }}</span>
          </a>
        </nav>

        <!-- 右侧操作区 -->
        <div class="nav-actions">
          <!-- 未登录状态 -->
          <template v-if="!userStore.isLoggedIn">
            <a-button type="link" class="login-btn" @click="router.push('/login')">
              登录
            </a-button>
            <a-button type="primary" class="register-btn" @click="router.push('/login')">
              注册
            </a-button>
          </template>

          <!-- 已登录状态 -->
          <template v-else>
            <a-dropdown :trigger="['click']">
              <div class="user-wrapper">
                <div class="user-avatar">
                  <span>{{ userStore.user?.username?.charAt(0).toUpperCase() || 'U' }}</span>
                </div>
                <div class="user-info">
                  <span class="user-name">{{ userStore.user?.nickname || userStore.user?.username }}</span>
                  <span class="user-level">{{ levelText }}</span>
                </div>
                <DownOutlined class="user-arrow" />
              </div>
              <template #overlay>
                <a-menu class="user-menu" @click="handleMenuClick">
                  <a-menu-item key="profile">
                    <UserOutlined />
                    个人中心
                  </a-menu-item>
                  <a-menu-item key="vip" class="vip-item">
                    <CrownOutlined />
                    升级会员
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout">
                    <LogoutOutlined />
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 底部 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="footer-logo"><span>N</span></div>
          <span>Nova Space</span>
        </div>
        <p>© 2026 Nova Space. 探索宇宙，从这里开始。</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import {
  UserOutlined,
  GlobalOutlined,
  BookOutlined,
  FileTextOutlined,
  HomeOutlined,
  DownOutlined,
  CrownOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 页面加载时获取用户信息
onMounted(() => {
  console.log('MainLayout mounted:', { token: userStore.token, user: userStore.user, isLoggedIn: userStore.isLoggedIn })
  if (userStore.token && !userStore.user) {
    userStore.fetchUser()
  }
})

const navItems = [
  { name: '首页', path: '/', icon: HomeOutlined },
  { name: '卫星数据', path: '/satellite', icon: GlobalOutlined },
  { name: '航天科普', path: '/education', icon: BookOutlined },
  { name: '航天情报', path: '/intelligence', icon: FileTextOutlined },
]

const levelText = computed(() => {
  const level = userStore.user?.level
  switch (level) {
    case 'professional':
      return '专业会员'
    case 'advanced':
      return '进阶会员'
    default:
      return '普通用户'
  }
})

const handleMenuClick = ({ key }: { key: string }) => {
  switch (key) {
    case 'profile':
      router.push('/profile')
      break
    case 'vip':
      router.push('/profile')
      break
    case 'logout':
      userStore.logout()
      message.success('已退出登录')
      router.push('/')
      break
  }
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
}

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 72px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 150ms ease;
  padding: 8px 12px;
  border-radius: 8px;
}

.logo:hover {
  background: rgba(255, 255, 255, 0.05);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  box-shadow: 0 0 20px rgba(239, 35, 60, 0.4);
}

.logo-icon span {
  transform: rotate(-45deg);
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 18px;
  color: white;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: 1px;
}

/* Main Nav */
.main-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: 8px;
  transition: all 150ms ease;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  position: relative;
}

.nav-item .nav-icon {
  font-size: 16px;
}

.nav-item:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: var(--color-text-primary);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 2px;
  background: var(--color-primary);
  border-radius: 1px;
}

/* Nav Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login-btn {
  color: var(--color-text-muted) !important;
  font-size: 14px !important;
}

.login-btn:hover {
  color: var(--color-text-primary) !important;
}

.register-btn {
  background: var(--color-primary) !important;
  border: none !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}

.register-btn:hover {
  background: #d90429 !important;
  box-shadow: 0 0 20px rgba(239, 35, 60, 0.4) !important;
}

/* User Wrapper */
.user-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px 6px 6px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 150ms ease;
  border: 1px solid transparent;
}

.user-wrapper:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.user-level {
  font-size: 11px;
  color: var(--color-text-subtle);
}

.user-arrow {
  color: var(--color-text-subtle);
  font-size: 12px;
  transition: transform 150ms ease;
}

.user-wrapper:hover .user-arrow {
  transform: rotate(180deg);
}

/* User Menu */
.user-menu {
  background: var(--color-bg-tertiary) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  min-width: 180px !important;
  padding: 8px !important;
}

.user-menu :deep(.ant-menu-item) {
  color: var(--color-text-muted) !important;
  font-size: 13px !important;
  display: flex;
  align-items: center;
  gap: 10px !important;
  border-radius: 8px !important;
  margin: 4px 0 !important;
}

.user-menu :deep(.ant-menu-item:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: var(--color-text-primary) !important;
}

.user-menu :deep(.ant-menu-item .anticon) {
  font-size: 14px;
}

.user-menu .vip-item {
  background: rgba(255, 215, 0, 0.1) !important;
  color: #ffd700 !important;
}

.user-menu :deep(.ant-menu-item-divider) {
  background: rgba(255, 255, 255, 0.1) !important;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-top: 72px;
  min-height: calc(100vh - 72px - 80px);
}

/* Footer */
.footer {
  height: 80px;
  background: var(--color-bg-secondary);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-logo {
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.footer-logo span {
  transform: rotate(-45deg);
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 12px;
  color: white;
}

.footer-brand span {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-primary);
}

.footer-content p {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-subtle);
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .main-nav {
    display: none;
  }

  .logo-text {
    display: none;
  }

  .user-info {
    display: none;
  }
}
</style>