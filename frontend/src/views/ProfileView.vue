<template>
  <div class="profile-view">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
      <div class="bg-grid"></div>
    </div>

    <div class="profile-container">
      <!-- 用户信息区域 -->
      <div class="profile-header">
        <!-- 头像和基本信息 -->
        <div class="user-hero">
          <div class="avatar-wrapper">
            <div class="avatar-ring">
              <div class="avatar">
                <UserOutlined />
              </div>
              <div class="avatar-glow"></div>
            </div>
          </div>
          <div class="user-basic">
            <div class="user-name-row">
              <h1 class="username">{{ userStore.user?.nickname || userStore.user?.username || '用户' }}</h1>
            </div>
            <p class="user-meta">
              <span class="user-id">@{{ userStore.user?.username }}</span>
              <span class="divider">·</span>
              <span class="user-email">{{ userStore.user?.email }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="profile-content">
        <a-tabs v-model:activeKey="activeTab" class="profile-tabs">
          <!-- 我的收藏 -->
          <a-tab-pane key="collects" tab="我的收藏">
            <div class="collects-section">
              <a-spin :spinning="collectLoading">
                <div v-if="collectList.length === 0 && !collectLoading" class="empty-collects">
                  <BookOutlined class="empty-icon" />
                  <p>暂无收藏内容</p>
                  <a-button type="primary" @click="router.push('/intelligence')">
                    去收藏情报
                  </a-button>
                </div>
                <div v-else class="collect-list">
                  <div
                    v-for="item in collectList"
                    :key="item.id"
                    class="collect-item"
                    @click="goToDetail(item.id)"
                  >
                    <div class="collect-tag" :class="item.category">
                      {{ getCategoryLabel(item.category) }}
                    </div>
                    <div class="collect-content">
                      <h4>{{ item.title }}</h4>
                      <p>{{ item.summary }}</p>
                    </div>
                    <div class="collect-meta">
                      <span>{{ formatCollectDate(item.collectedAt) }}</span>
                    </div>
                  </div>
                </div>
              </a-spin>
            </div>
          </a-tab-pane>

          <!-- 设置 -->
          <a-tab-pane key="settings" tab="设置">
            <div class="settings-section">
              <div class="settings-group">
                <h3>账号信息</h3>
                <div class="settings-form">
                  <div class="form-row">
                    <div class="form-item">
                      <label>用户名</label>
                      <input type="text" :value="userStore.user?.username" disabled />
                    </div>
                    <div class="form-item">
                      <label>邮箱</label>
                      <input type="email" :value="userStore.user?.email" disabled />
                    </div>
                  </div>
                  <div class="form-item">
                    <label>昵称</label>
                    <input type="text" v-model="editForm.nickname" placeholder="设置一个昵称" />
                  </div>
                  <button class="save-btn" :disabled="updateLoading" @click="handleUpdateProfile">
                    <template v-if="updateLoading">
                      <LoadingOutlined class="spin" />
                      <span>保存中...</span>
                    </template>
                    <template v-else>
                      <SaveOutlined />
                      <span>保存修改</span>
                    </template>
                  </button>
                </div>
              </div>

              <div class="settings-group">
                <h3>修改密码</h3>
                <div class="settings-form">
                  <div class="form-item">
                    <label>当前密码</label>
                    <input type="password" v-model="passwordForm.oldPassword" placeholder="请输入当前密码" />
                  </div>
                  <div class="form-row">
                    <div class="form-item">
                      <label>新密码</label>
                      <input type="password" v-model="passwordForm.newPassword" placeholder="请输入新密码" />
                    </div>
                    <div class="form-item">
                      <label>确认密码</label>
                      <input type="password" v-model="passwordForm.confirmPassword" placeholder="再次输入新密码" />
                    </div>
                  </div>
                  <button class="save-btn" :disabled="passwordLoading" @click="handleChangePassword">
                    <template v-if="passwordLoading">
                      <LoadingOutlined class="spin" />
                      <span>修改中...</span>
                    </template>
                    <template v-else>
                      <LockOutlined />
                      <span>修改密码</span>
                    </template>
                  </button>
                </div>
              </div>

              <div class="settings-group danger">
                <h3>账号操作</h3>
                <button class="logout-btn" @click="handleLogout">
                  <LogoutOutlined />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  BookOutlined,
  LoadingOutlined,
  SaveOutlined,
  LockOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { intelligenceApi, type Intelligence } from '@/api'

// Intelligence 类型扩展
declare module '@/api' {
  interface Intelligence {
    collectedAt?: string
  }
}

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('collects')

// 我的收藏
const collectList = ref<Intelligence[]>([])
const collectLoading = ref(false)

// 编辑资料
const editForm = reactive({
  nickname: '',
})
const updateLoading = ref(false)

// 修改密码
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordLoading = ref(false)

// 获取收藏列表
async function fetchCollects() {
  collectLoading.value = true
  try {
    const response = await intelligenceApi.getUserCollects()
    collectList.value = response.data.data || []
  } catch {
    // 忽略错误
  } finally {
    collectLoading.value = false
  }
}

// 分类标签
function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    launch: '发射任务',
    satellite: '卫星运行',
    industry: '行业动态',
    research: '科研成果',
    environment: '空间环境',
  }
  return labels[category] || category
}

// 格式化日期
function formatCollectDate(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 跳转详情
function goToDetail(id: number) {
  router.push(`/intelligence/${id}`)
}

// 更新资料
async function handleUpdateProfile() {
  updateLoading.value = true
  try {
    const result = await userStore.updateUser({ nickname: editForm.nickname })
    if (result.success) {
      message.success('更新成功')
    } else {
      message.error(result.message || '更新失败')
    }
  } finally {
    updateLoading.value = false
  }
}

// 修改密码
async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    message.error('密码至少6个字符')
    return
  }

  passwordLoading.value = true
  try {
    const result = await userStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    if (result.success) {
      message.success('密码修改成功，请重新登录')
      handleLogout()
    } else {
      message.error(result.message || '修改密码失败')
    }
  } finally {
    passwordLoading.value = false
  }
}

// 退出登录
function handleLogout() {
  userStore.logout()
  message.success('已退出登录')
  router.push('/login')
}

onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchUser()
  }
  editForm.nickname = userStore.user?.nickname || ''
  await fetchCollects()
})
</script>

<style scoped lang="scss">
// 主题色
$primary: #00d4ff;
$primary-light: #7dd3fc;
$accent: #a855f7;

// 背景色
$bg-dark: #0a0a0f;
$bg-card: rgba(255, 255, 255, 0.03);
$bg-elevated: rgba(255, 255, 255, 0.06);

// 文字色
$text-primary: rgba(255, 255, 255, 0.95);
$text-secondary: rgba(255, 255, 255, 0.6);
$text-muted: rgba(255, 255, 255, 0.4);

.profile-view {
  min-height: calc(100vh - 64px);
  background: $bg-dark;
  position: relative;
  overflow: hidden;
}

// 背景装饰
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  .bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.4;
  }

  .blob-1 {
    width: 600px;
    height: 600px;
    background: linear-gradient(135deg, $primary 0%, $accent 100%);
    top: -200px;
    right: -200px;
  }

  .blob-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, $accent 0%, $primary 100%);
    bottom: -100px;
    left: -100px;
  }

  .bg-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 60px 60px;
  }
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  position: relative;
  z-index: 1;
}

// 用户卡片
.profile-header {
  margin-bottom: 24px;
}

// 用户英雄区
.user-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  backdrop-filter: blur(20px);
}

.avatar-wrapper {
  flex-shrink: 0;
}

.avatar-ring {
  position: relative;
  width: 72px;
  height: 72px;
}

.avatar {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, $primary 0%, $accent 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  position: relative;
  z-index: 1;
}

.avatar-glow {
  position: absolute;
  inset: -6px;
  background: linear-gradient(135deg, $primary 0%, $accent 100%);
  border-radius: 50%;
  opacity: 0.3;
  filter: blur(16px);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.05); }
}

.user-basic {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.username {
  font-size: 22px;
  font-weight: 700;
  color: $text-primary;
  margin: 0;
  letter-spacing: -0.02em;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $text-muted;
  font-size: 13px;
  margin: 0;

  .divider {
    opacity: 0.4;
  }
}

// 内容区域
.profile-content {
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(20px);
}

.profile-tabs {
  :deep(.ant-tabs-nav) {
    margin-bottom: 24px;

    .ant-tabs-tab {
      color: $text-secondary;

      &.ant-tabs-tab-active .ant-tabs-tab-btn {
        color: $primary;
      }
    }

    .ant-tabs-ink-bar {
      background: $primary;
    }
  }
}

// 收藏列表
.collects-section {
  min-height: 200px;
}

.empty-collects {
  text-align: center;
  padding: 60px 20px;

  .empty-icon {
    font-size: 48px;
    color: $text-muted;
    margin-bottom: 16px;
  }

  p {
    color: $text-secondary;
    margin-bottom: 20px;
  }
}

.collect-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collect-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(0, 212, 255, 0.2);
  }
}

.collect-tag {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;

  &.launch {
    background: rgba(0, 212, 255, 0.15);
    color: #00d4ff;
  }

  &.satellite {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
  }

  &.industry {
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
  }

  &.research {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  &.environment {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
}

.collect-content {
  flex: 1;
  min-width: 0;

  h4 {
    font-size: 15px;
    font-weight: 500;
    color: $text-primary;
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p {
    font-size: 13px;
    color: $text-muted;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.collect-meta {
  flex-shrink: 0;
  font-size: 12px;
  color: $text-muted;
}

// 设置区域
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-group {
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 20px;
  }

  &.danger {
    border-color: rgba(239, 68, 68, 0.2);
  }
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 13px;
    color: $text-secondary;
  }

  input {
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: $text-primary;
    font-size: 14px;
    transition: all 0.3s;

    &:focus {
      outline: none;
      border-color: $primary;
      background: rgba(255, 255, 255, 0.06);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &::placeholder {
      color: $text-muted;
    }
  }
}

.save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, $primary 0%, $accent 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-start;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }
}

// 响应式
@media (max-width: 768px) {
  .user-hero {
    flex-direction: column;
    text-align: center;
  }

  .user-meta {
    justify-content: center;
    flex-wrap: wrap;
  }

  .collect-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .collect-meta {
    align-self: flex-end;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>