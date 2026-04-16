<template>
  <div class="membership-page">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
    </div>

    <div v-else class="page-container">
      <header class="page-header">
        <h1 class="title">会员中心</h1>
        <p class="subtitle">解锁专属权益，探索更多航天奥秘</p>
      </header>

      <section v-if="status" class="status-card">
        <h2 class="status-title">当前权益</h2>
        <div class="status-header">
          <div class="status-left">
            <span class="level-tag" :class="status.level">{{ getLevelText(status.level) }}</span>
            <span v-if="status.subscription" class="sub-info">
              {{ getPlanText(status.subscription.plan) }} · {{ formatDate(status.subscription.endDate) }}
            </span>
          </div>
          <div class="status-right">
            <span class="points-num">{{ status.points ?? 0 }}</span>
            <span class="points-label">积分</span>
          </div>
        </div>
        <div v-if="status.benefits?.length" class="benefits-list">
          <span v-for="benefit in status.benefits" :key="benefit.id" class="benefit-tag">
            {{ benefit.name }}: {{ benefit.value }} {{ benefit.unit || '' }}
          </span>
        </div>
      </section>

      <section class="plans-section">
        <h2 class="section-title">会员套餐</h2>
        <div class="plans-grid">
          <div
            v-for="plan in plans"
            :key="plan.id"
            class="plan-card"
            :class="{ current: status?.level === plan.level, recommended: plan.planCode === 'yearly' }"
          >
            <div v-if="plan.planCode === 'yearly'" class="recommend-tag">推荐</div>
            
            <div class="plan-header">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <span class="plan-level" :class="plan.level">{{ plan.levelInfo?.name || getLevelText(plan.level) }}</span>
            </div>

            <div class="plan-price">
              <span class="price-num">¥{{ plan.price }}</span>
              <span class="price-period">
                {{ plan.durationMonths === 1200 ? '永久' : `${plan.durationMonths}个月` }}
              </span>
            </div>

            <div v-if="plan.pointsPrice" class="points-exchange">
              <span class="points-text">或 {{ plan.pointsPrice }} 积分兑换</span>
            </div>

            <ul class="plan-benefits">
              <li v-for="benefit in plan.benefits" :key="benefit.id">
                {{ benefit.name }}: {{ benefit.value }} {{ benefit.unit || '' }}
              </li>
            </ul>

            <div class="plan-actions">
              <button
                v-if="plan.pointsPrice && (status?.points ?? 0) >= plan.pointsPrice"
                class="btn-exchange"
                :disabled="exchangeLoading === plan.planCode"
                @click="handleExchange(plan)"
              >
                {{ exchangeLoading === plan.planCode ? '兑换中...' : '积分兑换' }}
              </button>
              <span v-else-if="plan.pointsPrice" class="points-tip">
                需要 {{ plan.pointsPrice }} 积分
              </span>
              <button class="btn-buy" @click="handleBuy(plan)">购买</button>
            </div>
          </div>
        </div>
      </section>

      <section class="earn-section">
        <h2 class="section-title">获取积分</h2>
        <div class="earn-grid">
          <div class="earn-item">
            <span class="earn-name">每日签到</span>
            <span class="earn-points">+10</span>
          </div>
          <div class="earn-item">
            <span class="earn-name">答题挑战</span>
            <span class="earn-points">+20</span>
          </div>
          <div class="earn-item">
            <span class="earn-name">分享内容</span>
            <span class="earn-points">+5</span>
          </div>
          <div class="earn-item">
            <span class="earn-name">邀请好友</span>
            <span class="earn-points">+50</span>
          </div>
        </div>
      </section>
    </div>

    <a-modal v-model:open="showExchangeDialog" :closable="false" :footer="null" :width="360" centered>
      <div class="modal-box">
        <h3 class="modal-title">确认兑换</h3>
        <div class="modal-info">
          <div class="info-row">
            <span class="info-label">套餐</span>
            <span class="info-value">{{ selectedPlan?.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">积分</span>
            <span class="info-value points">{{ selectedPlan?.pointsPrice }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">等级</span>
            <span class="info-value" :class="selectedPlan?.level">{{ selectedPlan?.levelInfo?.name || getLevelText(selectedPlan?.level) }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showExchangeDialog = false">取消</button>
          <button class="btn-confirm" @click="confirmExchange">确认兑换</button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="showBuyDialog" :closable="false" :footer="null" :width="360" centered>
      <div class="modal-box">
        <h3 class="modal-title">支付功能即将上线</h3>
        <p class="modal-desc">支持微信、支付宝等支付方式</p>
        <p class="modal-tip">您可先使用积分兑换会员</p>
        <button class="btn-confirm full" @click="showBuyDialog = false">我知道了</button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { subscriptionApi, pointsApi, type MembershipPlan, type MembershipStatus } from '@/api'

const loading = ref(true)
const exchangeLoading = ref<string | null>(null)
const showExchangeDialog = ref(false)
const showBuyDialog = ref(false)
const selectedPlan = ref<MembershipPlan | null>(null)

const status = ref<MembershipStatus | null>(null)
const plans = ref<MembershipPlan[]>([])

const levelMap = {
  basic: '普通会员',
  advanced: '高级会员',
  professional: '专业会员',
}

const planMap = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
  lifetime: '永久卡',
  custom: '自定义',
}

const benefitTextMap = {
  content_access: '内容访问权限',
  push_quota: '推送通知额度',
  points_multiplier: '积分获取倍数',
  exclusive_features: '专属功能特权',
}

function getLevelText(level?: string) {
  return levelMap[level as keyof typeof levelMap] || '普通会员'
}

function getPlanText(plan?: string) {
  return planMap[plan as keyof typeof planMap] || '未知'
}

function getBenefitText(type: string) {
  return benefitTextMap[type as keyof typeof benefitTextMap] || type
}

function formatDate(date?: string) {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function fetchData() {
  loading.value = true
  try {
    const [statusRes, plansRes] = await Promise.all([
      subscriptionApi.getStatus(),
      subscriptionApi.getPlans(),
    ])
    status.value = statusRes.data.data
    plans.value = plansRes.data.data.plans
  } catch {
    message.error('获取会员信息失败')
  } finally {
    loading.value = false
  }
}

function handleExchange(plan: MembershipPlan) {
  selectedPlan.value = plan
  showExchangeDialog.value = true
}

async function confirmExchange() {
  if (!selectedPlan.value) return
  showExchangeDialog.value = false
  exchangeLoading.value = selectedPlan.value.planCode

  try {
    const res = await pointsApi.exchangeMembership(selectedPlan.value.planCode)
    if (res.data.code === 0) {
      message.success(`兑换成功！已升级为${getLevelText(res.data.data.newLevel)}`)
      await fetchData()
    } else {
      message.error(res.data.message || '兑换失败')
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || '兑换失败')
  } finally {
    exchangeLoading.value = null
    selectedPlan.value = null
  }
}

function handleBuy(plan: MembershipPlan) {
  selectedPlan.value = plan
  showBuyDialog.value = true
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
$text-dark: rgba(255, 255, 255, 0.95);
$text-gray: rgba(255, 255, 255, 0.7);
$text-light: rgba(255, 255, 255, 0.45);
$bg-page: #0a0a0f;
$bg-card: rgba(255, 255, 255, 0.05);
$bg-elevated: rgba(255, 255, 255, 0.08);
$border: rgba(255, 255, 255, 0.1);

$color-basic: rgba(255, 255, 255, 0.5);
$color-advanced: #00d4ff;
$color-professional: #ffd700;
$color-points: #ffd700;

.membership-page {
  min-height: calc(100vh - 70px);
  background: $bg-page;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: $color-advanced;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 64px 48px;
}

.page-header {
  margin-bottom: 32px;

  .title {
    font-size: 28px;
    font-weight: 600;
    color: $text-dark;
    margin: 0 0 8px;
  }

  .subtitle {
    font-size: 14px;
    color: $text-gray;
    margin: 0;
  }
}

.status-card {
  background: $bg-card;
  border: 1px solid $border;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 40px;
}

.status-title {
  font-size: 16px;
  font-weight: 500;
  color: $text-dark;
  margin: 0 0 16px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid $border;
  margin-bottom: 16px;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;

  &.basic {
    background: rgba(255, 255, 255, 0.1);
    color: $color-basic;
  }

  &.advanced {
    background: rgba(0, 212, 255, 0.15);
    color: $color-advanced;
  }

  &.professional {
    background: rgba(255, 215, 0, 0.15);
    color: $color-professional;
  }
}

.sub-info {
  font-size: 13px;
  color: $text-gray;
}

.status-right {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.points-num {
  font-size: 18px;
  font-weight: 600;
  color: $color-points;
}

.points-label {
  font-size: 12px;
  color: $text-light;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: $text-dark;
  margin: 0 0 20px;
}

.plans-section {
  margin-bottom: 48px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.plan-card {
  position: relative;
  background: $bg-card;
  border: 1px solid $border;
  border-radius: 12px;
  padding: 24px;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }

  &.current {
    border-color: rgba(0, 212, 255, 0.3);
  }

  &.recommended {
    border-color: rgba(255, 215, 0, 0.3);
  }
}

.recommend-tag {
  position: absolute;
  top: -1px;
  right: 20px;
  padding: 4px 12px;
  background: $color-professional;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  border-radius: 0 0 4px 4px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.plan-name {
  font-size: 16px;
  font-weight: 500;
  color: $text-dark;
  margin: 0;
}

.plan-level {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;

  &.basic {
    background: rgba(255, 255, 255, 0.1);
    color: $color-basic;
  }

  &.advanced {
    background: rgba(0, 212, 255, 0.15);
    color: $color-advanced;
  }

  &.professional {
    background: rgba(255, 215, 0, 0.15);
    color: $color-professional;
  }
}

.plan-price {
  margin-bottom: 8px;

  .price-num {
    font-size: 24px;
    font-weight: 600;
    color: $text-dark;
  }

  .price-period {
    font-size: 13px;
    color: $text-light;
    margin-left: 4px;
  }
}

.points-exchange {
  margin-bottom: 16px;

  .points-text {
    font-size: 13px;
    color: $text-gray;
  }
}

.plan-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  min-height: 60px;

  li {
    font-size: 13px;
    color: $text-gray;
    padding: 4px 0;
  }
}

.plan-actions {
  display: flex;
  gap: 10px;
}

.btn-exchange,
.btn-buy {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-exchange {
  background: rgba(255, 215, 0, 0.15);
  color: $color-professional;
}

.btn-buy {
  background: rgba(0, 212, 255, 0.15);
  color: $color-advanced;
}

.points-tip {
  font-size: 12px;
  color: $text-light;
}

.earn-section {
  margin-bottom: 48px;
}

.earn-grid {
  display: flex;
  gap: 16px;
}

.earn-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: $bg-card;
  border-radius: 6px;
  border: 1px solid $border;

  .earn-name {
    font-size: 14px;
    color: $text-gray;
  }

  .earn-points {
    font-size: 14px;
    font-weight: 500;
    color: $color-points;
  }
}

.benefits-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.benefit-tag {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 1px solid $border;
  font-size: 13px;
  color: $text-gray;
}

.modal-box {
  padding: 24px;
  text-align: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
  color: $text-dark;
  margin: 0 0 20px;
}

.modal-desc {
  font-size: 14px;
  color: $text-gray;
  margin: 0 0 8px;
}

.modal-tip {
  font-size: 13px;
  color: $text-light;
  margin: 0 0 20px;
}

.modal-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;

  .info-label {
    color: $text-light;
  }

  .info-value {
    color: $text-dark;

    &.points {
      color: $color-points;
    }

    &.advanced {
      color: $color-advanced;
    }

    &.professional {
      color: $color-professional;
    }
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: $text-gray;
}

.btn-confirm {
  background: $color-advanced;
  color: #fff;

  &.full {
    width: 100%;
  }
}

@media (max-width: 900px) {
  .page-container {
    padding: 40px 24px;
  }

  .plans-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .earn-grid {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .page-container {
    padding: 24px 16px;
  }

  .page-header .title {
    font-size: 24px;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .status-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .earn-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .benefits-list {
    flex-wrap: wrap;
  }
}
</style>