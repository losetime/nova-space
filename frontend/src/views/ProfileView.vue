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
        <div class="section-header">
          <h2>我的收藏</h2>
        </div>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  UserOutlined,
  BookOutlined,
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

// 我的收藏
const collectList = ref<Intelligence[]>([])
const collectLoading = ref(false)

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

onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchUser()
  }
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

.section-header {
  margin-bottom: 20px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
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
}
</style>