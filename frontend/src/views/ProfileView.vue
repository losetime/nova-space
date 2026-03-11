<template>
  <div class="profile-view">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
      <div class="bg-grid"></div>
    </div>

    <div class="profile-container">
      <!-- 用户信息区域 - 开放式布局 -->
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
              <div class="level-tag" :class="userLevel">
                <CrownOutlined v-if="userLevel !== 'normal'" />
                <span>{{ levelText }}</span>
              </div>
            </div>
            <p class="user-meta">
              <span class="user-id">@{{ userStore.user?.username }}</span>
              <span class="divider">·</span>
              <span class="user-email">{{ userStore.user?.email }}</span>
            </p>
          </div>
        </div>

        <!-- 统计卡片 - 独立一行 -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon points">
              <StarOutlined />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ pointsStats.currentPoints }}</span>
              <span class="stat-label">积分余额</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon used">
              <ThunderboltOutlined />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ pointsStats.totalConsumed }}</span>
              <span class="stat-label">已使用</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon days">
              <CalendarOutlined />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ pointsStats.checkinDays }}</span>
              <span class="stat-label">签到天数</span>
            </div>
          </div>
          <div class="stat-card action-card" @click="handleCheckin" :class="{ loading: checkinLoading }">
            <div class="stat-icon checkin">
              <LoadingOutlined v-if="checkinLoading" class="spin" />
              <CalendarOutlined v-else />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ checkinLoading ? '签到中' : '签到' }}</span>
              <span class="stat-label">每日签到</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="profile-content">
        <a-tabs v-model:activeKey="activeTab" class="profile-tabs">
          <!-- 积分记录 -->
          <a-tab-pane key="points" tab="积分记录">
            <div class="points-section">
              <a-table
                :columns="pointsColumns"
                :data-source="pointsHistory"
                :loading="pointsLoading"
                :pagination="pointsPagination"
                row-key="id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'action'">
                    <span class="action-tag" :class="record.action">
                      {{ getPointsTypeText(record.action) }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'points'">
                    <span class="points-value" :class="record.points > 0 ? 'positive' : 'negative'">
                      {{ record.points > 0 ? '+' : '' }}{{ record.points }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'createdAt'">
                    <span class="time-text">{{ formatDate(record.createdAt) }}</span>
                  </template>
                </template>
              </a-table>
            </div>
          </a-tab-pane>

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

          <!-- 会员中心 -->
          <a-tab-pane key="vip" tab="会员中心">
            <div class="vip-section">
              <div class="vip-card">
                <div class="vip-header">
                  <div class="vip-badge">
                    <CrownOutlined />
                  </div>
                  <h3>{{ levelText }}</h3>
                  <p class="vip-status" v-if="subscription">
                    有效期至 {{ formatDate(subscription.endDate) }}
                  </p>
                  <p class="vip-status" v-else>
                    开通会员，解锁更多功能
                  </p>
                </div>

                <div class="vip-features">
                  <div class="feature-item" v-for="f in vipFeatures" :key="f">
                    <CheckCircleOutlined class="feature-icon" />
                    <span>{{ f }}</span>
                  </div>
                </div>

                <div class="vip-plans">
                  <div 
                    class="plan-card" 
                    v-for="plan in plans" 
                    :key="plan.key"
                    :class="{ popular: plan.key === 'quarterly' }"
                    @click="handleSubscribe(plan.key)"
                  >
                    <div class="plan-popular-tag" v-if="plan.key === 'quarterly'">推荐</div>
                    <div class="plan-name">{{ plan.name }}</div>
                    <div class="plan-price">
                      <span class="currency">¥</span>
                      <span class="amount">{{ plan.price }}</span>
                    </div>
                    <div class="plan-duration">{{ plan.duration }}</div>
                  </div>
                </div>
              </div>
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

    <!-- 编辑资料弹窗 -->
    <a-modal v-model:open="showEditModal" title="编辑资料" @ok="handleUpdateProfile">
      <a-form layout="vertical">
        <a-form-item label="昵称">
          <a-input v-model:value="editForm.nickname" placeholder="请输入昵称" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  CrownOutlined,
  StarOutlined,
  CalendarOutlined,
  EditOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  SaveOutlined,
  LockOutlined,
  BookOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { pointsApi, subscriptionApi, intelligenceApi, type PointsRecord, type Subscription, type PointsStats, type Intelligence } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('points')

// 积分统计
const pointsStats = ref<PointsStats>({
  currentPoints: 0,
  totalPoints: 0,
  totalEarned: 0,
  totalConsumed: 0,
  checkinDays: 0,
})
const pointsHistory = ref<PointsRecord[]>([])
const pointsLoading = ref(false)
const pointsPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

// 签到
const checkinLoading = ref(false)

// 订阅
const subscription = ref<Subscription | null>(null)

// 编辑资料
const showEditModal = ref(false)
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

// 我的收藏
const collectList = ref<Intelligence[]>([])
const collectLoading = ref(false)

// 计算属性
const userLevel = computed(() => {
  return userStore.user?.level || 'normal'
})

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

// VIP 功能列表
const vipFeatures = ref([
  '全量情报阅读权限',
  '深度解读报告',
  '个性化推送服务',
  '专属客服支持',
  '优先参与线下活动',
])

// 订阅计划
const plans = ref([
  { key: 'monthly', name: '月度会员', price: 29, duration: '30天' },
  { key: 'quarterly', name: '季度会员', price: 79, duration: '90天' },
  { key: 'yearly', name: '年度会员', price: 299, duration: '365天' },
])

// 积分表格列
const pointsColumns = [
  { title: '类型', key: 'action', dataIndex: 'action' },
  { title: '积分', key: 'points', dataIndex: 'points' },
  { title: '余额', dataIndex: 'balance' },
  { title: '描述', dataIndex: 'description' },
  { title: '时间', key: 'createdAt', dataIndex: 'createdAt' },
]

// 获取积分统计
async function fetchPointsStats() {
  try {
    const response = await pointsApi.getStats()
    pointsStats.value = response.data.data
  } catch {
    // 忽略错误
  }
}

// 获取积分记录
async function fetchPointsHistory() {
  pointsLoading.value = true
  try {
    const response = await pointsApi.getHistory({
      page: pointsPagination.current,
      limit: pointsPagination.pageSize,
    })
    const data = response.data.data
    pointsHistory.value = data.records
    pointsPagination.total = data.total
  } catch {
    // 忽略错误
  } finally {
    pointsLoading.value = false
  }
}

// 每日签到
async function handleCheckin() {
  checkinLoading.value = true
  try {
    const response = await pointsApi.dailyCheckin()
    const data = response.data
    message.success(data.message || '签到成功！')
    await fetchPointsStats()
    await fetchPointsHistory()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    message.error(err.response?.data?.message || '签到失败')
  } finally {
    checkinLoading.value = false
  }
}

// 获取订阅信息
async function fetchSubscription() {
  try {
    const response = await subscriptionApi.getCurrent()
    subscription.value = response.data.data
  } catch {
    // 忽略错误
  }
}

// 订阅
async function handleSubscribe(plan: string) {
  try {
    await subscriptionApi.create({ plan })
    message.success('订阅成功！')
    await fetchSubscription()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    message.error(err.response?.data?.message || '订阅失败')
  }
}

// 更新资料
async function handleUpdateProfile() {
  updateLoading.value = true
  try {
    const result = await userStore.updateUser({ nickname: editForm.nickname })
    if (result.success) {
      message.success('更新成功')
      showEditModal.value = false
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

// 格式化日期
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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

// 积分类型文本
function getPointsTypeText(action: string) {
  const texts: Record<string, string> = {
    register: '注册奖励',
    daily_login: '每日签到',
    consume: '消费',
    admin_grant: '管理员发放',
  }
  return texts[action] || action
}

// 获取收藏列表
async function fetchCollects() {
  collectLoading.value = true
  try {
    const response = await intelligenceApi.getUserCollects()
    collectList.value = response.data.data
  } catch {
    // 忽略错误
  } finally {
    collectLoading.value = false
  }
}

// 跳转到情报详情
function goToDetail(id: number) {
  router.push(`/intelligence/${id}`)
}

// 格式化收藏时间
function formatCollectDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// Intelligence 类型扩展
declare module '@/api' {
  interface Intelligence {
    collectedAt?: string
  }
}
onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchUser()
  }
  editForm.nickname = userStore.user?.nickname || ''
  await Promise.all([
    fetchPointsStats(),
    fetchPointsHistory(),
    fetchSubscription(),
    fetchCollects(),
  ])
})
</script>

<style scoped lang="scss">
// Red Noir 设计主题
$red-primary: #ef233c;
$red-light: #ff4d6a;
$red-dark: #c9184a;

// VIP 金色
$gold-primary: #FFD700;
$gold-light: #FFF4CC;
$gold-dark: #DAA520;

// 其他颜色
$yellow-primary: #fbbf24;
$green-primary: #22c55e;
$orange-primary: #f97316;

// 背景色
$bg-dark: #000000;
$bg-base: #09090b;
$bg-card: #18181b;
$bg-elevated: #1f1f23;

// 文字色
$text-primary: #ffffff;
$text-secondary: #f4f4f5;
$text-muted: #a1a1aa;

// 边框色
$border-color: rgba(255, 255, 255, 0.1);

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
    opacity: 0.3;
  }

  .blob-1 {
    width: 600px;
    height: 600px;
    background: linear-gradient(135deg, $red-primary 0%, $red-dark 100%);
    top: -200px;
    right: -200px;
  }

  .blob-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, $red-dark 0%, $red-primary 100%);
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
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 用户英雄区 - 开放式布局
.user-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: $bg-card;
  border: 1px solid $border-color;
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
  background: linear-gradient(135deg, $red-primary 0%, $red-dark 100%);
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
  background: linear-gradient(135deg, $red-primary 0%, $red-dark 100%);
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

.level-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  color: $text-secondary;
  border: 1px solid $border-color;

  &.professional, &.advanced {
    background: linear-gradient(135deg, $gold-primary 0%, $gold-dark 100%);
    color: #000;
    border: none;
  }
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

// 统计卡片行
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: 16px;
  backdrop-filter: blur(20px);
  transition: all 0.25s ease;

  &:hover {
    background: $bg-elevated;
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  &.action-card {
    cursor: pointer;
    
    &:hover {
      border-color: rgba($red-primary, 0.4);
      background: rgba($red-primary, 0.08);
    }

    &.loading {
      pointer-events: none;
      opacity: 0.7;
    }
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;

  &.points {
    background: rgba($red-primary, 0.15);
    color: $red-primary;
  }

  &.used {
    background: rgba($gold-primary, 0.12);
    color: $gold-primary;
  }

  &.days {
    background: rgba(#22c55e, 0.12);
    color: #22c55e;
  }

  &.checkin {
    background: rgba($red-primary, 0.15);
    color: $red-primary;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: $text-muted;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

// 内容区域
.profile-content {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(20px);
}

// Tabs 样式
.profile-tabs {
  :deep(.ant-tabs) {
    .ant-tabs-nav {
      margin-bottom: 0;
      padding: 0;

      &::before {
        border-bottom: 1px solid $border-color;
      }
    }

    .ant-tabs-tab {
      padding: 12px 20px;
      color: $text-muted;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        color: $text-secondary;
      }

      &.ant-tabs-tab-active {
        .ant-tabs-tab-btn {
          color: $red-primary;
        }
      }
    }

    .ant-tabs-ink-bar {
      background: $red-primary;
      height: 2px;
      border-radius: 1px;
    }

    .ant-tabs-content {
      padding-top: 20px;
    }
  }
}

// 积分记录
.points-section {
  :deep(.ant-table) {
    background: transparent;
    color: $text-primary;

    .ant-table-thead > tr > th {
      background: rgba(255, 255, 255, 0.02);
      color: $text-secondary;
      border-bottom: 1px solid $border-color;
      font-weight: 500;
      padding: 12px;
      font-size: 13px;
    }

    .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding: 12px;
      font-size: 13px;
    }

    .ant-table-tbody > tr:hover > td {
      background: rgba(255, 255, 255, 0.02);
    }
  }
}

.action-tag {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.register {
    background: rgba(#22c55e, 0.15);
    color: #22c55e;
  }

  &.daily_login {
    background: rgba($red-primary, 0.15);
    color: $red-primary;
  }

  &.consume {
    background: rgba(#f97316, 0.15);
    color: #f97316;
  }

  &.admin_grant {
    background: rgba($gold-primary, 0.15);
    color: $gold-primary;
  }
}

.points-value {
  font-weight: 600;
  font-size: 13px;

  &.positive {
    color: #22c55e;
  }

  &.negative {
    color: #ef4444;
  }
}

.time-text {
  color: $text-muted;
  font-size: 12px;
}

// VIP 区域
.vip-section {
  display: flex;
  justify-content: center;
}

.vip-card {
  background: linear-gradient(135deg, rgba($gold-primary, 0.08) 0%, rgba($gold-dark, 0.04) 100%);
  border: 1px solid rgba($gold-primary, 0.25);
  border-radius: 16px;
  padding: 20px;
  max-width: 560px;
  width: 100%;
}

.vip-header {
  text-align: center;
  margin-bottom: 20px;

  .vip-badge {
    width: 44px;
    height: 44px;
    margin: 0 auto 10px;
    background: linear-gradient(135deg, $gold-primary 0%, $gold-dark 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #000;
  }

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: $gold-primary;
    margin: 0 0 4px 0;
  }

  .vip-status {
    color: $text-muted;
    font-size: 12px;
    margin: 0;
  }
}

.vip-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 12px;
  color: $text-secondary;

  .feature-icon {
    color: $gold-primary;
    font-size: 12px;
  }
}

.vip-plans {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.plan-card {
  position: relative;
  padding: 16px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $border-color;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }

  &.popular {
    border-color: $gold-primary;
    background: rgba($gold-primary, 0.05);

    .plan-price .amount {
      color: $gold-primary;
    }
  }

  .plan-popular-tag {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    background: $gold-primary;
    color: #000;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .plan-name {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 6px;
  }

  .plan-price {
    margin-bottom: 4px;

    .currency {
      font-size: 12px;
      color: $text-muted;
    }

    .amount {
      font-size: 24px;
      font-weight: 700;
      color: $text-primary;
    }
  }

  .plan-duration {
    font-size: 10px;
    color: $text-muted;
  }
}

// 设置区域
.settings-section {
  max-width: 560px;

  // 处理浏览器自动填充样式 - 统一背景色
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px $bg-card inset !important;
    -webkit-text-fill-color: $text-primary !important;
    transition: background-color 5000s ease-in-out 0s;
    caret-color: $text-primary !important;
  }
}

.settings-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  &.danger {
    padding-top: 16px;
    border-top: 1px solid $border-color;
  }

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 12px 0;
  }
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 11px;
    font-weight: 500;
    color: $text-secondary;
  }

  input {
    padding: 8px 12px;
    background: $bg-base;
    border: 1px solid $border-color;
    border-radius: 6px;
    color: $text-primary;
    font-size: 13px;
    transition: all 0.2s ease;

    &::placeholder {
      color: $text-muted;
    }

    &:focus {
      outline: none;
      border-color: $red-primary;
      box-shadow: 0 0 0 2px rgba($red-primary, 0.15);
      background: $bg-card;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba($bg-base, 0.5);
    }
  }
}

.save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 16px;
  background: linear-gradient(135deg, $red-primary 0%, $red-dark 100%);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($red-primary, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background: rgba(#ef4444, 0.1);
  border: 1px solid rgba(#ef4444, 0.2);
  border-radius: 6px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(#ef4444, 0.15);
    border-color: rgba(#ef4444, 0.3);
  }
}

// 收藏列表
.collects-section {
  min-height: 200px;
}

.empty-collects {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: $text-muted;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin-bottom: 16px;
  }
}

.collect-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collect-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba($red-primary, 0.2);
    transform: translateX(4px);
  }

  .collect-tag {
    flex-shrink: 0;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;

    &.launch {
      background: rgba($red-primary, 0.15);
      color: $red-primary;
    }

    &.satellite {
      background: rgba($red-light, 0.15);
      color: $red-light;
    }

    &.industry {
      background: rgba($yellow-primary, 0.15);
      color: $yellow-primary;
    }

    &.research {
      background: rgba($green-primary, 0.15);
      color: $green-primary;
    }

    &.environment {
      background: rgba($orange-primary, 0.15);
      color: $orange-primary;
    }
  }

  .collect-content {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
      margin: 0 0 6px 0;
      line-height: 1.4;
    }

    p {
      font-size: 13px;
      color: $text-muted;
      margin: 0;
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  .collect-meta {
    flex-shrink: 0;
    font-size: 12px;
    color: $text-muted;
  }
}

// 响应式
@media (max-width: 900px) {
  .user-hero {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .user-name-row {
    justify-content: center;
    flex-wrap: wrap;
  }

  .user-meta {
    justify-content: center;
    flex-wrap: wrap;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 14px 16px;
  }

  .vip-features {
    grid-template-columns: 1fr;
  }

  .vip-plans {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 16px 18px;
  }
}
</style>