<template>
  <div class="auth-view">
    <!-- Background Effects -->
    <div class="auth-bg">
      <div class="glow-orb glow-orb-1"></div>
      <div class="glow-orb glow-orb-2"></div>
    </div>

    <div class="auth-container">
      <!-- Header -->
      <div class="auth-header">
        <div class="logo">
          <span>N</span>
        </div>
        <h1>Nova Space</h1>
        <p>探索宇宙，从这里开始</p>
      </div>

      <!-- Auth Card -->
      <div class="auth-card">
        <a-tabs v-model:activeKey="activeTab" centered>
          <!-- Login Tab -->
          <a-tab-pane key="login" tab="登录">
            <a-form
              :model="loginForm"
              :rules="loginRules"
              layout="vertical"
              @finish="handleLogin"
            >
              <a-form-item name="username" label="用户名">
                <a-input
                  v-model:value="loginForm.username"
                  placeholder="请输入用户名"
                  size="large"
                >
                  <template #prefix>
                    <UserOutlined />
                  </template>
                </a-input>
              </a-form-item>

              <a-form-item name="password" label="密码">
                <a-input-password
                  v-model:value="loginForm.password"
                  placeholder="请输入密码"
                  size="large"
                >
                  <template #prefix>
                    <LockOutlined />
                  </template>
                </a-input-password>
              </a-form-item>

              <a-form-item>
                <RedButton variant="primary" size="lg" :loading="loading" style="width: 100%">
                  登录
                </RedButton>
              </a-form-item>
            </a-form>
          </a-tab-pane>

          <!-- Register Tab -->
          <a-tab-pane key="register" tab="注册">
            <a-form
              :model="registerForm"
              :rules="registerRules"
              layout="vertical"
              @finish="handleRegister"
            >
              <a-form-item name="username" label="用户名">
                <a-input
                  v-model:value="registerForm.username"
                  placeholder="请输入用户名"
                  size="large"
                >
                  <template #prefix>
                    <UserOutlined />
                  </template>
                </a-input>
              </a-form-item>

              <a-form-item name="email" label="邮箱">
                <a-input
                  v-model:value="registerForm.email"
                  placeholder="请输入邮箱"
                  size="large"
                >
                  <template #prefix>
                    <MailOutlined />
                  </template>
                </a-input>
              </a-form-item>

              <a-form-item name="password" label="密码">
                <a-input-password
                  v-model:value="registerForm.password"
                  placeholder="请输入密码（至少6位）"
                  size="large"
                >
                  <template #prefix>
                    <LockOutlined />
                  </template>
                </a-input-password>
              </a-form-item>

              <a-form-item name="confirmPassword" label="确认密码">
                <a-input-password
                  v-model:value="registerForm.confirmPassword"
                  placeholder="请再次输入密码"
                  size="large"
                >
                  <template #prefix>
                    <LockOutlined />
                  </template>
                </a-input-password>
              </a-form-item>

              <a-form-item>
                <RedButton variant="shiny" size="lg" :loading="loading" style="width: 100%">
                  注册
                </RedButton>
              </a-form-item>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- Footer -->
      <div class="auth-footer">
        <p>注册即表示同意 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import RedButton from '@/components/RedButton.vue'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loading = ref(false)

// Login form
const loginForm = reactive({
  username: '',
  password: '',
})

// Register form
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// Login validation rules
const loginRules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
}

// Register validation rules
const registerRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符' },
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '请输入有效的邮箱地址' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6个字符' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
    {
      validator: (_rule: unknown, value: string) => {
        if (value !== registerForm.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
    },
  ],
}

// Handle login
async function handleLogin() {
  loading.value = true
  try {
    const result = await userStore.login(loginForm.username, loginForm.password)
    if (result.success) {
      message.success('登录成功')
      router.push('/')
    } else {
      message.error(result.message || '登录失败')
    }
  } finally {
    loading.value = false
  }
}

// Handle register
async function handleRegister() {
  loading.value = true
  try {
    const result = await userStore.register(
      registerForm.username,
      registerForm.email,
      registerForm.password
    )
    if (result.success) {
      message.success('注册成功，已获得100积分奖励！')
      router.push('/')
    } else {
      message.error(result.message || '注册失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* Background Effects */
.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

.glow-orb-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  background: var(--color-primary);
  opacity: 0.1;
}

.glow-orb-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
  background: var(--color-primary);
  opacity: 0.08;
}

/* Container */
.auth-container {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

/* Header */
.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-header .logo {
  width: 72px;
  height: 72px;
  background: var(--color-primary);
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  border-radius: 12px;
  box-shadow: 0 0 40px rgba(239, 35, 60, 0.4);
}

.auth-header .logo span {
  transform: rotate(-45deg);
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 32px;
  color: white;
}

.auth-header h1 {
  font-family: var(--font-heading);
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.auth-header p {
  font-size: 14px;
  color: var(--color-text-muted);
}

/* Auth Card */
.auth-card {
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  backdrop-filter: blur(12px);
}

/* Ant Design Tabs Override */
.auth-card :deep(.ant-tabs) {
  .ant-tabs-nav {
    margin-bottom: 24px;
  }

  .ant-tabs-nav::before {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .ant-tabs-tab {
    color: var(--color-text-muted);
    font-size: 16px;
    font-weight: 500;
  }

  .ant-tabs-tab:hover {
    color: var(--color-text-secondary);
  }

  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: var(--color-primary);
  }

  .ant-tabs-ink-bar {
    background: var(--color-primary);
  }
}

/* Ant Design Form Override */
.auth-card :deep(.ant-form) {
  .ant-form-item-label > label {
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .ant-input,
  .ant-input-password {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
  }

  .ant-input::placeholder,
  .ant-input-password input::placeholder {
    color: var(--color-text-subtle);
  }

  .ant-input:hover,
  .ant-input:focus,
  .ant-input-affix-wrapper:hover,
  .ant-input-affix-wrapper-focused {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(239, 35, 60, 0.1);
  }

  .ant-input-affix-wrapper {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .ant-input-prefix {
    color: var(--color-text-subtle);
  }

  .ant-form-item-explain-error {
    color: var(--color-primary);
  }
}

/* Footer */
.auth-footer {
  text-align: center;
  margin-top: 24px;
}

.auth-footer p {
  font-size: 12px;
  color: var(--color-text-subtle);
}

.auth-footer a {
  color: var(--color-primary);
  transition: color 150ms ease;
}

.auth-footer a:hover {
  color: var(--color-text-primary);
  text-decoration: underline;
}
</style>