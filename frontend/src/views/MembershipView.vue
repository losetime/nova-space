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
            {{ benefit.name }}: {{ benefit.displayText || benefit.value }} {{ benefit.unit || '' }}
          </span>
        </div>
      </section>

      <section class="levels-section">
        <h2 class="section-title">会员版本</h2>
        <div class="levels-grid">
          <div
            v-for="level in memberLevels.filter(l => l.level !== 'basic')"
            :key="level.level"
            class="level-card"
            :class="{ current: status?.level === level.level, recommended: level.level === 'professional' }"
          >
            <div v-if="level.level === 'professional'" class="recommend-tag">推荐</div>

            <div class="level-header">
              <h3 class="level-name">{{ level.levelName }}</h3>
            </div>

            <ul class="level-benefits">
              <li v-for="benefit in level.benefits" :key="benefit.id">
                {{ benefit.name }}: {{ benefit.displayText || benefit.value }} {{ benefit.unit || '' }}
              </li>
            </ul>

            <div class="plans-list">
              <div
                v-for="plan in level.plans"
                :key="plan.id"
                class="plan-item"
                :class="{ recommended: plan.planCode === 'yearly' && level.level === 'professional' }"
              >
                <div class="plan-info">
                  <span class="plan-name">{{ plan.name }}</span>
                  <span class="plan-duration">({{ plan.durationMonths === 1200 ? '永久' : `${plan.durationMonths}个月` }})</span>
                </div>
                <div class="plan-right">
                  <span class="plan-price">¥{{ plan.price }}</span>
                  <button class="btn-buy" @click="handleBuy(level, plan)">购买</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="earn-section">
        <h2 class="section-title">获取积分</h2>
        <div class="earn-grid">
          <div class="earn-item">
            <span class="earn-name">每日签到</span>
            <span class="earn-points">+2</span>
          </div>
          <div class="earn-item">
            <span class="earn-name">答题挑战</span>
            <span class="earn-points">+2</span>
          </div>
          <div class="earn-item">
            <span class="earn-name">分享内容</span>
            <span class="earn-points">+5</span>
          </div>
          <div class="earn-item">
            <span class="earn-name">邀请好友</span>
            <span class="earn-points">+10</span>
          </div>
        </div>
      </section>
    </div>

    <a-modal v-model:open="showBuyDialog" :closable="false" :footer="null" :width="380" centered>
      <div class="modal-box">
        <h3 class="modal-title">选择套餐</h3>
        <p class="modal-subtitle">{{ selectedLevel?.levelName }}</p>

        <div class="plans-select">
          <div
            v-for="plan in selectedLevel?.plans"
            :key="plan.id"
            class="plan-option"
            :class="{ selected: selectedPlan?.id === plan.id, recommended: plan.planCode === 'yearly' }"
            @click="selectedPlan = plan"
          >
            <div class="option-left">
              <span class="option-name">{{ plan.name }}</span>
              <span class="option-duration">({{ plan.durationMonths === 1200 ? '永久' : `${plan.durationMonths}个月` }})</span>
            </div>
            <div class="option-right">
              <span class="option-price">¥{{ plan.price }}</span>
              <span v-if="plan.planCode === 'yearly'" class="option-tag">推荐</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showBuyDialog = false">取消</button>
          <button class="btn-confirm" @click="confirmBuy">确认购买</button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { subscriptionApi, type MemberLevelData, type MembershipPlan, type MembershipStatus, type Benefit } from '@/api'

const loading = ref(true)
const showBuyDialog = ref(false)
const selectedLevel = ref<MemberLevelData | null>(null)
const selectedPlan = ref<MembershipPlan | null>(null)

const status = ref<MembershipStatus | null>(null)
const memberLevels = ref<MemberLevelData[]>([])

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

function getLevelText(level?: string) {
  return levelMap[level as keyof typeof levelMap] || '普通会员'
}

function getPlanText(plan?: string) {
  return planMap[plan as keyof typeof planMap] || '未知'
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
    memberLevels.value = plansRes.data.data
  } catch {
    message.error('获取会员信息失败')
  } finally {
    loading.value = false
  }
}

function handleBuy(level: MemberLevelData, plan: MembershipPlan) {
  selectedLevel.value = level
  selectedPlan.value = plan
  showBuyDialog.value = true
}

function confirmBuy() {
  if (!selectedPlan.value) return
  showBuyDialog.value = false
  message.success(`已选择 ${selectedLevel.value?.levelName} ${selectedPlan.value.name}，支付功能即将上线`)
  selectedPlan.value = null
  selectedLevel.value = null
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

.levels-section {
  margin-bottom: 48px;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
}

.level-card {
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

.level-header {
  margin-bottom: 16px;
}

.level-name {
  font-size: 18px;
  font-weight: 500;
  color: $text-dark;
  margin: 0;
}

.level-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;

  li {
    font-size: 13px;
    color: $text-gray;
    padding: 4px 0;
  }
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid $border;
}

.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }

  &.recommended {
    border-color: rgba(255, 215, 0, 0.2);
  }

  .plan-info {
    display: flex;
    gap: 6px;
  }

  .plan-name {
    font-size: 14px;
    font-weight: 500;
    color: $text-dark;
  }

  .plan-duration {
    font-size: 13px;
    color: $text-light;
  }

  .plan-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .plan-price {
    font-size: 16px;
    font-weight: 600;
    color: $text-dark;
  }
}

.btn-buy {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: rgba(0, 212, 255, 0.15);
  color: $color-advanced;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
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
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
  color: $text-dark;
  margin: 0 0 8px;
  text-align: center;
}

.modal-subtitle {
  font-size: 14px;
  color: $text-gray;
  margin: 0 0 20px;
  text-align: center;
}

.plans-select {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.plan-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid $border;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }

  &.selected {
    border-color: $color-advanced;
    background: rgba(0, 212, 255, 0.08);
  }

  &.recommended {
    .option-tag {
      display: block;
    }
  }

  .option-left {
    display: flex;
    gap: 6px;
  }

  .option-name {
    font-size: 14px;
    font-weight: 500;
    color: $text-dark;
  }

  .option-duration {
    font-size: 13px;
    color: $text-light;
  }

  .option-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .option-price {
    font-size: 16px;
    font-weight: 600;
    color: $text-dark;
  }

  .option-tag {
    display: none;
    padding: 2px 8px;
    background: $color-professional;
    color: #fff;
    font-size: 11px;
    border-radius: 3px;
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
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
}

@media (max-width: 900px) {
  .page-container {
    padding: 40px 24px;
  }

  .levels-grid {
    grid-template-columns: 1fr;
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

  .level-card {
    padding: 20px;
  }

  .plans-list {
    gap: 10px;
  }

  .plan-item {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>