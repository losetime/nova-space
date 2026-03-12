<template>
  <div class="main-layout">
    <!-- 顶部导航 -->
    <header class="navbar">
      <div class="nav-container">
        <!-- Logo -->
        <div class="logo" @click="router.push('/')">
          <div class="logo-icon">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- 外圈轨道 -->
              <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.4"/>
              <!-- 中圈轨道 -->
              <circle cx="16" cy="16" r="9" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
              <!-- 内核 -->
              <circle cx="16" cy="16" r="4" fill="currentColor" opacity="0.9"/>
              <!-- 卫星点 -->
              <circle cx="16" cy="2" r="2" fill="#00ff88"/>
              <circle cx="25" cy="22" r="1.5" fill="#00d4ff"/>
            </svg>
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
            <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
          </a>
        </nav>

        <!-- 右侧操作区 -->
        <div class="nav-actions">
          <!-- 通知图标 -->
          <NotificationIcon v-if="userStore.isLoggedIn" />
          
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
                  <a-menu-item key="feedback">
                    <CommentOutlined />
                    意见反馈
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
        <p>© 2026 Nova Space. All rights reserved.</p>
        <div class="footer-links">
          <a href="#">关于我们</a>
          <a href="#">隐私政策</a>
          <a href="#">联系方式</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import NotificationIcon from '@/components/NotificationIcon.vue'
import {
  UserOutlined,
  GlobalOutlined,
  BookOutlined,
  FileTextOutlined,
  HomeOutlined,
  DownOutlined,
  CrownOutlined,
  LogoutOutlined,
  CommentOutlined,
  ThunderboltOutlined
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
  { name: '空间天气', path: '/space-weather', icon: ThunderboltOutlined },
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
    case 'feedback':
      router.push('/feedback')
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

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  flex-direction: column;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 70px;
  background: rgba(10, 10, 15, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.15);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5),
              0 0 100px rgba(0, 212, 255, 0.05);
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 32px;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  padding: 8px 12px;
  border-radius: 12px;
  justify-self: start;

  &:hover {
    background: rgba(0, 212, 255, 0.08);
  }

  .logo-icon {
    width: 38px;
    height: 38px;
    color: #00d4ff;

    svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.5));
    }
  }

  .logo-text {
    font-size: 20px;
    font-weight: 800;
    background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 50%, #00d4ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 2px;
    background-size: 200% auto;
    animation: shine 4s linear infinite;

    @keyframes shine {
      to { background-position: 200% center; }
    }
  }
}

.main-nav {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  font-size: 14px;

  .nav-icon {
    font-size: 16px;
    transition: all 0.3s;
  }

  &:hover {
    color: #ffffff;
    background: rgba(0, 212, 255, 0.08);

    .nav-icon {
      transform: translateY(-2px);
    }
  }

  &.active {
    color: #00d4ff;
    background: rgba(0, 212, 255, 0.12);
    box-shadow: 0 0 25px rgba(0, 212, 255, 0.2),
                inset 0 0 10px rgba(0, 212, 255, 0.05);

    .nav-icon {
      filter: drop-shadow(0 0 5px rgba(0, 212, 255, 0.5));
    }
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  justify-self: end;
  flex-shrink: 0;
  gap: 12px;

  .login-btn {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;

    &:hover {
      color: #00d4ff;
    }
  }

  .register-btn {
    background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 100%);
    border: none;
    font-size: 14px;

    &:hover {
      opacity: 0.9;
    }
  }

  .user-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px 8px 8px;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid transparent;

    &:hover {
      background: rgba(0, 212, 255, 0.08);
      border-color: rgba(0, 212, 255, 0.2);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: #fff;
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .user-name {
        font-size: 13px;
        font-weight: 600;
        color: #fff;
      }

      .user-level {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
      }
    }

    .user-arrow {
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      transition: transform 0.3s;
    }

    &:hover .user-arrow {
      transform: rotate(180deg);
    }
  }
}

.user-menu {
  background: rgba(20, 20, 35, 0.98) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.15) !important;
  border-radius: 12px !important;
  min-width: 180px !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5),
              0 0 60px rgba(0, 212, 255, 0.1) !important;

  :deep(.ant-menu-item) {
    color: rgba(255, 255, 255, 0.7) !important;
    font-size: 13px !important;
    display: flex;
    align-items: center;
    gap: 10px !important;

    &:hover {
      background: rgba(0, 212, 255, 0.1) !important;
      color: #00d4ff !important;
    }

    .anticon {
      font-size: 14px;
    }
  }

  .vip-item {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 170, 0, 0.1) 100%) !important;
    color: #ffd700 !important;
  }
}

.main-content {
  flex: 1;
  margin-top: 70px;
  min-height: calc(100vh - 70px - 60px);
}

.footer {
  height: 60px;
  background: rgba(10, 10, 15, 0.95);
  border-top: 1px solid rgba(0, 212, 255, 0.1);
}

.footer-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 32px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;

  p {
    margin: 0;
  }
}

.footer-links {
  display: flex;
  gap: 24px;

  a {
    color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    transition: all 0.3s;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 1px;
      background: linear-gradient(90deg, #00d4ff, #7b2cbf);
      transition: width 0.3s;
    }

    &:hover {
      color: #00d4ff;

      &::after {
        width: 100%;
      }
    }
  }
}
</style>