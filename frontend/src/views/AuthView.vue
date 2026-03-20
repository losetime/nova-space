<template>
  <div class="auth-view">
    <div class="auth-container">
      <div class="auth-header">
        <div class="logo">
          <RocketOutlined />
        </div>
        <h1>Nova Space</h1>
        <p>探索宇宙，从这里开始</p>
      </div>

      <div class="auth-card">
        <a-tabs v-model:activeKey="activeTab" centered>
          <!-- 登录 -->
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
                <a-button
                  type="primary"
                  html-type="submit"
                  size="large"
                  block
                  :loading="loading"
                >
                  登录
                </a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>

          <!-- 注册 -->
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
                <a-button
                  type="primary"
                  html-type="submit"
                  size="large"
                  block
                  :loading="loading"
                >
                  注册
                </a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </div>

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
  RocketOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loading = ref(false)

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
})

// 注册表单
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// 登录校验规则
const loginRules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
}

// 注册校验规则
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

// 登录
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

// 注册
async function handleRegister() {
  loading.value = true
  try {
    const result = await userStore.register(
      registerForm.username,
      registerForm.email,
      registerForm.password
    )
    if (result.success) {
      message.success('注册成功！')
      router.push('/')
    } else {
      message.error(result.message || '注册失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.auth-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
  padding: 24px;
}

.auth-container {
  width: 100%;
  max-width: 420px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;

  .logo {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    font-size: 40px;
    color: #fff;
    box-shadow: 0 10px 40px rgba(0, 212, 255, 0.3);
  }

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.auth-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 16px;
  padding: 32px;
  backdrop-filter: blur(10px);

  :deep(.ant-tabs) {
    .ant-tabs-nav {
      margin-bottom: 24px;

      &::before {
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }
    }

    .ant-tabs-tab {
      color: rgba(255, 255, 255, 0.6);
      font-size: 16px;

      &:hover {
        color: #00d4ff;
      }

      &.ant-tabs-tab-active {
        .ant-tabs-tab-btn {
          color: #00d4ff;
        }
      }
    }

    .ant-tabs-ink-bar {
      background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 100%);
    }
  }

  :deep(.ant-form) {
    .ant-form-item-label > label {
      color: rgba(255, 255, 255, 0.8);
    }

    .ant-input,
    .ant-input-password {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      color: #fff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }

      &:hover,
      &:focus {
        border-color: #00d4ff;
        box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.1);
      }
    }

    .ant-input-affix-wrapper {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);

      &:hover,
      &:focus,
      &.ant-input-affix-wrapper-focused {
        border-color: #00d4ff;
        box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.1);
      }

      .ant-input {
        background: transparent;
      }
    }

    .ant-input-prefix {
      color: rgba(255, 255, 255, 0.4);
    }

    .ant-btn-primary {
      background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 100%);
      border: none;
      height: 48px;
      font-size: 16px;
      font-weight: 500;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}

.auth-footer {
  text-align: center;
  margin-top: 24px;

  p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);

    a {
      color: #00d4ff;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>