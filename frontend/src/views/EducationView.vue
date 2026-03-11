<template>
  <div class="education-view">
    <!-- Hero Banner -->
    <div class="edu-hero">
      <div class="hero-content">
        <h1>航天知识科普中心</h1>
        <p>从入门到进阶，探索宇宙的奥秘</p>
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="category-nav">
      <a-tabs v-model:activeKey="activeCategory" centered size="large" @change="handleCategoryChange">
        <a-tab-pane key="all" tab="全部">
          <template #icon><AppstoreOutlined /></template>
        </a-tab-pane>
        <a-tab-pane key="basic" tab="基础入门">
          <template #icon><RocketOutlined /></template>
        </a-tab-pane>
        <a-tab-pane key="advanced" tab="专业进阶">
          <template #icon><ExperimentOutlined /></template>
        </a-tab-pane>
        <a-tab-pane key="mission" tab="经典任务">
          <template #icon><SendOutlined /></template>
        </a-tab-pane>
        <a-tab-pane key="people" tab="人物/机构">
          <template #icon><TeamOutlined /></template>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" />
        <p>加载中...</p>
      </div>

      <!-- 文章列表 -->
      <div v-else class="content-grid">
        <div
          v-for="item in articles"
          :key="item.id"
          class="content-card"
          @click="openArticle(item)"
        >
          <div class="card-cover">
            <img :src="item.cover" :alt="item.title" @error="handleImageError" />
            <div class="card-type">{{ item.type === 'video' ? '视频' : '图文' }}</div>
          </div>
          <div class="card-body">
            <h3>{{ item.title }}</h3>
            <p>{{ item.summary }}</p>
            <div class="card-meta">
              <span><EyeOutlined /> {{ formatViews(item.views) }}</span>
              <span><ClockCircleOutlined /> {{ item.duration }} 分钟</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && articles.length === 0" class="empty-state">
        <p>暂无内容</p>
      </div>

      <!-- 每日问答 -->
      <div class="daily-quiz">
        <div class="quiz-header">
          <h2><FireOutlined /> 每日问答</h2>
          <span v-if="quizStats">连续答对 {{ quizStats.streak }} 天</span>
        </div>

        <!-- 未登录提示 -->
        <div v-if="!isLoggedIn" class="quiz-login-prompt">
          <p>登录后参与每日问答，赢取积分奖励</p>
          <a-button type="primary" @click="$router.push('/login')">立即登录</a-button>
        </div>

        <!-- 加载中 -->
        <div v-else-if="quizLoading" class="quiz-loading">
          <a-spin />
        </div>

        <!-- 已答完今日题目 -->
        <div v-else-if="!currentQuiz" class="quiz-done">
          <CheckCircleOutlined class="done-icon" />
          <p>今日问答已完成</p>
          <p class="done-sub">明天再来挑战吧！</p>
        </div>

        <!-- 答题卡片 -->
        <div v-else class="quiz-card">
          <div class="quiz-question">
            <span class="question-label">问题：</span>
            <p>{{ currentQuiz.question }}</p>
          </div>
          <div class="quiz-options">
            <a-button
              v-for="(option, index) in currentQuiz.options"
              :key="index"
              block
              class="quiz-option"
              :class="{
                'selected': selectedOption === index,
                'correct': showResult && index === currentQuiz.correctIndex,
                'wrong': showResult && selectedOption === index && !quizResult?.isCorrect
              }"
              :disabled="showResult"
              @click="selectOption(index)"
            >
              {{ ['A', 'B', 'C', 'D'][index] }}. {{ option }}
            </a-button>
          </div>

          <!-- 答案解析 -->
          <div v-if="showResult && quizResult" class="quiz-result">
            <div class="result-header" :class="quizResult.isCorrect ? 'success' : 'error'">
              <CheckCircleOutlined v-if="quizResult.isCorrect" />
              <CloseCircleOutlined v-else />
              <span>{{ quizResult.isCorrect ? '回答正确！' : '回答错误' }}</span>
              <span v-if="quizResult.pointsEarned > 0" class="points">+{{ quizResult.pointsEarned }} 积分</span>
            </div>
            <p class="explanation">{{ quizResult.explanation }}</p>
          </div>

          <a-button
            v-if="!showResult"
            type="primary"
            block
            size="large"
            class="submit-btn"
            :disabled="selectedOption === null"
            :loading="submitting"
            @click="submitAnswer"
          >
            提交答案
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  RocketOutlined,
  ExperimentOutlined,
  SendOutlined,
  TeamOutlined,
  FireOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { educationApi, type Article, type Quiz, type QuizResult, type QuizStats } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

const activeCategory = ref('all')
const loading = ref(false)
const articles = ref<Article[]>([])

const quizLoading = ref(false)
const currentQuiz = ref<Quiz | null>(null)
const selectedOption = ref<number | null>(null)
const showResult = ref(false)
const submitting = ref(false)
const quizResult = ref<QuizResult | null>(null)
const quizStats = ref<QuizStats | null>(null)

// 加载文章列表
const loadArticles = async () => {
  loading.value = true
  try {
    const category = activeCategory.value === 'all' ? undefined : activeCategory.value
    const res = await educationApi.getArticles({ category, limit: 20 })
    // 后端返回格式: { code, data: Article[], timestamp }
    articles.value = res.data.data || []
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载每日问答
const loadDailyQuiz = async () => {
  if (!isLoggedIn.value) return

  quizLoading.value = true
  try {
    const [quizRes, statsRes] = await Promise.all([
      educationApi.getDailyQuiz(),
      educationApi.getQuizStats(),
    ])
    currentQuiz.value = quizRes.data.data
    quizStats.value = statsRes.data.data
  } catch (error) {
    console.error('加载问答失败:', error)
  } finally {
    quizLoading.value = false
  }
}

// 切换分类
const handleCategoryChange = () => {
  loadArticles()
}

// 选择答案
const selectOption = (index: number) => {
  if (!showResult.value) {
    selectedOption.value = index
  }
}

// 提交答案
const submitAnswer = async () => {
  if (selectedOption.value === null || !currentQuiz.value) return

  submitting.value = true
  try {
    const res = await educationApi.submitAnswer({
      quizId: currentQuiz.value.id,
      selectedIndex: selectedOption.value,
    })
    quizResult.value = res.data.data
    showResult.value = true

    // 更新积分
    if (quizResult.value.pointsEarned > 0) {
      userStore.fetchUser()
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 格式化浏览量
const formatViews = (views: number) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + 'w'
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'k'
  }
  return views.toString()
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'https://via.placeholder.com/400x225/18181b/ef233c?text=航天科普'
}

// 打开文章详情
const openArticle = (article: Article) => {
  window.location.href = `/education/${article.id}`
}

onMounted(() => {
  loadArticles()
  loadDailyQuiz()
})
</script>

<style scoped lang="scss">
// Red Noir 设计主题变量
$primary-red: #ef233c;
$primary-red-dark: #d90429;
$primary-red-light: #ff4d6d;
$bg-black: #000000;
$bg-dark: #09090b;
$bg-card: #18181b;
$text-white: #ffffff;
$text-light: #f4f4f5;
$text-muted: #a1a1aa;
$border-subtle: rgba(255, 255, 255, 0.1);
$border-hover: rgba(255, 255, 255, 0.2);

.education-view {
  min-height: calc(100vh - 64px);
  background: $bg-black;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.edu-hero {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-black;
  position: relative;
  overflow: hidden;

  // 红色发光效果
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 300px;
    background: radial-gradient(ellipse, rgba($primary-red, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-content {
    text-align: center;
    position: relative;
    z-index: 1;

    h1 {
      font-size: 48px;
      font-weight: 700;
      font-family: 'Manrope', 'Inter', sans-serif;
      background: linear-gradient(135deg, $primary-red 0%, $primary-red-light 50%, $primary-red-dark 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 16px;
      text-shadow: 0 0 60px rgba($primary-red, 0.5);
      filter: drop-shadow(0 0 30px rgba($primary-red, 0.3));
    }

    p {
      font-size: 18px;
      color: $text-muted;
    }
  }
}

.category-nav {
  padding: 24px 0;
  background: $bg-dark;
  border-bottom: 1px solid $border-subtle;

  :deep(.ant-tabs) {
    .ant-tabs-nav {
      margin: 0;
      background: transparent;

      &::before {
        border-bottom: none;
      }
    }

    .ant-tabs-tab {
      color: $text-muted;
      font-size: 16px;
      padding: 12px 24px;
      transition: all 0.3s ease;

      &:hover {
        color: $text-light;
      }

      &.ant-tabs-tab-active {
        color: $primary-red;

        .ant-tabs-tab-btn {
          color: $primary-red;
        }
      }

      .anticon {
        margin-right: 8px;
      }
    }

    .ant-tabs-ink-bar {
      background: $primary-red;
      height: 3px;
      border-radius: 2px;
    }
  }
}

.content-area {
  padding: 40px 24px;
  max-width: 1440px;
  margin: 0 auto;
  background: $bg-black;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: $text-muted;

  p {
    margin-top: 16px;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 60px;
}

.content-card {
  background: $bg-card;
  border: 1px solid $border-subtle;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-8px);
    border-color: $border-hover;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba($primary-red, 0.1);

    .card-body h3 {
      color: $primary-red-light;
    }
  }

  .card-cover {
    position: relative;
    height: 200px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .card-type {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.8);
      color: $primary-red;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid rgba($primary-red, 0.3);
    }
  }

  &:hover .card-cover img {
    transform: scale(1.05);
  }

  .card-body {
    padding: 20px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $text-white;
      margin-bottom: 12px;
      transition: color 0.3s ease;
      font-family: 'Manrope', 'Inter', sans-serif;
    }

    p {
      font-size: 14px;
      color: $text-muted;
      line-height: 1.6;
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: rgba($text-muted, 0.7);

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: $text-muted;
}

.daily-quiz {
  max-width: 600px;
  margin: 0 auto;
  background: $bg-card;
  border: 1px solid $border-subtle;
  border-radius: 16px;
  padding: 32px;

  .quiz-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      font-size: 24px;
      font-weight: 600;
      color: $text-white;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Manrope', 'Inter', sans-serif;

      .anticon {
        color: $primary-red;
      }
    }

    span {
      font-size: 14px;
      color: $text-muted;
    }
  }

  .quiz-login-prompt {
    text-align: center;
    padding: 40px 0;

    p {
      color: $text-muted;
      margin-bottom: 16px;
    }

    .ant-btn-primary {
      background: $primary-red;
      border-color: $primary-red;

      &:hover {
        background: $primary-red-light;
        border-color: $primary-red-light;
      }
    }
  }

  .quiz-loading {
    display: flex;
    justify-content: center;
    padding: 40px 0;
  }

  .quiz-done {
    text-align: center;
    padding: 40px 0;

    .done-icon {
      font-size: 48px;
      color: #22c55e;
      margin-bottom: 16px;
    }

    p {
      color: $text-light;
      margin: 0;

      &.done-sub {
        color: $text-muted;
        font-size: 14px;
        margin-top: 8px;
      }
    }
  }

  .quiz-card {
    .quiz-question {
      margin-bottom: 24px;

      .question-label {
        color: $primary-red;
        font-weight: 600;
        margin-right: 8px;
      }

      p {
        display: inline;
        font-size: 18px;
        color: $text-white;
      }
    }

    .quiz-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;

      .quiz-option {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid $border-subtle;
        color: $text-light;
        height: 48px;
        font-size: 15px;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          border-color: rgba($primary-red, 0.5);
          background: rgba($primary-red, 0.1);
          color: $text-white;
        }

        &.selected {
          border-color: $primary-red;
          background: rgba($primary-red, 0.15);
          color: $text-white;
        }

        &.correct {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        &.wrong {
          border-color: $primary-red;
          background: rgba($primary-red, 0.15);
          color: $primary-red;
        }
      }
    }

    .quiz-result {
      margin-bottom: 24px;
      padding: 16px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid $border-subtle;

      .result-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;

        &.success {
          color: #22c55e;
        }

        &.error {
          color: $primary-red;
        }

        .points {
          margin-left: auto;
          color: #f59e0b;
        }
      }

      .explanation {
        color: $text-muted;
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
      }
    }

    .submit-btn {
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      background: $primary-red;
      border: none;
      box-shadow: 0 4px 15px rgba($primary-red, 0.3);
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        background: $primary-red-light;
        box-shadow: 0 6px 20px rgba($primary-red, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        box-shadow: none;
      }
    }
  }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .edu-hero {
    height: 240px;

    .hero-content h1 {
      font-size: 32px;
    }
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .quiz-options {
    grid-template-columns: 1fr !important;
  }
}
</style>