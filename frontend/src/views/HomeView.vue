<template>
  <div class="home-view">
    <!-- Navigation -->
    <RedNavbar :transparent="isScrolledTop" />

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg">
        <div class="stars stars-layer-1"></div>
        <div class="stars stars-layer-2"></div>
        <div class="stars stars-layer-3"></div>
        <div class="glow-orb"></div>
      </div>
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="text-gradient">探索宇宙</span>
          <br />
          <span class="subtitle">从这里开始</span>
        </h1>
        <p class="hero-desc">
          诺维空间探索平台 —— 集卫星数据态势展示、航天知识科普、航天情报分级服务于一体的综合航天信息平台
        </p>
        <div class="hero-actions">
          <RedButton variant="shiny" size="lg" @click="$router.push('/satellite')">
            开始探索
            <RightOutlined />
          </RedButton>
          <RedButton variant="secondary" size="lg" @click="$router.push('/education')">
            了解更多
          </RedButton>
        </div>
      </div>
      <div class="scroll-indicator">
        <div class="mouse"></div>
        <span>向下滚动</span>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="section-container">
        <h2 class="section-title">
          <span class="text-gradient">三大核心服务</span>
        </h2>
        <div class="features-grid">
          <RedCard
            v-for="(feature, index) in features"
            :key="index"
            :title="feature.title"
            :description="feature.desc"
            hoverable
            class="feature-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
            @click="$router.push(feature.path)"
          >
            <template #icon>
              <component :is="feature.icon" />
            </template>
          </RedCard>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="section-container">
        <div class="stats-grid">
          <div v-for="(stat, index) in stats" :key="index" class="stat-item">
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Intelligence -->
    <section class="intelligence-preview">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">
            <span class="text-gradient">最新情报</span>
          </h2>
          <RedButton variant="ghost" @click="$router.push('/intelligence')">
            查看全部
            <RightOutlined />
          </RedButton>
        </div>
        <div class="intelligence-list">
          <div
            v-for="(item, index) in latestIntelligence"
            :key="index"
            class="intelligence-card"
          >
            <div class="card-tag" :class="item.type">{{ item.tag }}</div>
            <h4>{{ item.title }}</h4>
            <p>{{ item.summary }}</p>
            <div class="card-meta">
              <span>{{ item.date }}</span>
              <span class="source">{{ item.source }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  RightOutlined,
  GlobalOutlined,
  BookOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'
import RedNavbar from '@/components/RedNavbar.vue'
import RedButton from '@/components/RedButton.vue'
import RedCard from '@/components/RedCard.vue'

const isScrolledTop = ref(true)

const handleScroll = () => {
  isScrolledTop.value = window.scrollY < 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const features = [
  {
    icon: GlobalOutlined,
    title: '卫星数据中心',
    desc: '实时追踪全球在轨卫星，提供轨道预测、关联分析等专业功能',
    path: '/satellite'
  },
  {
    icon: BookOutlined,
    title: '航天科普中心',
    desc: '体系化航天知识库，从入门到进阶，让每个人都能读懂航天',
    path: '/education'
  },
  {
    icon: FileTextOutlined,
    title: '航天情报中心',
    desc: '精选航天领域最新动态，深度解读行业发展趋势',
    path: '/intelligence'
  }
]

const stats = [
  { number: '8,000+', label: '在轨卫星' },
  { number: '100+', label: '国家/地区' },
  { number: '50,000+', label: '知识条目' },
  { number: '10,000+', label: '活跃用户' }
]

const latestIntelligence = [
  {
    type: 'launch',
    tag: '发射任务',
    title: 'SpaceX星舰第五次试飞即将进行',
    summary: '预计本周进行关键测试，将尝试新的回收方案...',
    date: '2026-03-04',
    source: 'SpaceX官方'
  },
  {
    type: 'satellite',
    tag: '卫星动态',
    title: '中国空间站完成新一轮科学实验',
    summary: '本次实验涉及微重力环境下的材料科学研究...',
    date: '2026-03-03',
    source: '中国航天'
  },
  {
    type: 'industry',
    tag: '行业动态',
    title: '全球商业航天市场规模突破5000亿美元',
    summary: '报告显示卫星互联网和太空旅游成为主要增长点...',
    date: '2026-03-02',
    source: '航天产业报告'
  }
]
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 100vh;
  min-height: 700px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* Stars - Multiple layers with drift effect */
.hero-bg .stars {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
}

/* Layer 1: Large bright stars - slow drift */
.stars-layer-1 {
  background-image:
    radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 80px 70px, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(2px 2px at 140px 120px, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(2px 2px at 50px 180px, rgba(255, 255, 255, 0.75), transparent),
    radial-gradient(2px 2px at 180px 40px, rgba(255, 255, 255, 0.7), transparent);
  background-size: 250px 250px;
  animation: twinkle 4s ease-in-out infinite, drift-slow 60s linear infinite;
}

/* Layer 2: Medium stars - medium drift */
.stars-layer-2 {
  background-image:
    radial-gradient(1.5px 1.5px at 40px 50px, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 100px 130px, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 170px 80px, rgba(255, 255, 255, 0.65), transparent),
    radial-gradient(1.5px 1.5px at 60px 200px, rgba(255, 255, 255, 0.55), transparent),
    radial-gradient(1.5px 1.5px at 220px 160px, rgba(255, 255, 255, 0.5), transparent);
  background-size: 300px 300px;
  animation: twinkle 5s ease-in-out infinite 1s, drift-medium 45s linear infinite;
}

/* Layer 3: Small dim stars - fast drift */
.stars-layer-3 {
  background-image:
    radial-gradient(1px 1px at 30px 80px, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 90px 20px, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1px 1px at 150px 100px, rgba(255, 255, 255, 0.45), transparent),
    radial-gradient(1px 1px at 70px 150px, rgba(255, 255, 255, 0.35), transparent),
    radial-gradient(1px 1px at 200px 60px, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 120px 190px, rgba(255, 255, 255, 0.4), transparent);
  background-size: 220px 220px;
  animation: twinkle 6s ease-in-out infinite 2s, drift-fast 30s linear infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes drift-slow {
  0% { background-position: 0 0; }
  100% { background-position: -250px 150px; }
}

@keyframes drift-medium {
  0% { background-position: 0 0; }
  100% { background-position: -300px 180px; }
}

@keyframes drift-fast {
  0% { background-position: 0 0; }
  100% { background-position: -220px 132px; }
}

.hero-bg .glow-orb {
  position: absolute;
  width: 500px;
  height: 500px;
  right: -150px;
  top: 50%;
  transform: translateY(-50%);
  background: radial-gradient(circle at 30% 30%, var(--color-primary) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0.15;
  filter: blur(80px);
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
  padding: 0 24px;
}

.hero-title {
  font-family: var(--font-heading);
  font-size: 72px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
}

.hero-title .text-gradient {
  background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-title .subtitle {
  color: var(--color-text-secondary);
}

.hero-desc {
  font-size: 18px;
  color: var(--color-text-muted);
  line-height: 1.8;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
}

.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-text-subtle);
  font-size: 12px;
}

.scroll-indicator .mouse {
  width: 24px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  position: relative;
}

.scroll-indicator .mouse::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 2px;
  animation: scroll 2s ease-in-out infinite;
}

@keyframes scroll {
  0%, 100% { opacity: 1; top: 8px; }
  50% { opacity: 0.3; top: 20px; }
}

/* Section Common */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 42px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 60px;
}

.text-gradient {
  background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Features Section */
.features-section {
  padding: 120px 0;
  background: var(--color-bg-secondary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.feature-card {
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.feature-card :deep(.red-card__icon) {
  font-size: 28px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stats Section */
.stats-section {
  padding: 80px 0;
  background: var(--color-bg-primary);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-family: var(--font-heading);
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  color: var(--color-text-muted);
}

/* Intelligence Preview */
.intelligence-preview {
  padding: 120px 0;
  background: var(--color-bg-secondary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.section-header .section-title {
  margin-bottom: 0;
  text-align: left;
}

.intelligence-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.intelligence-card {
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  transition: all 300ms ease;
}

.intelligence-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.card-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 16px;
}

.card-tag.launch {
  background: rgba(239, 35, 60, 0.15);
  color: var(--color-primary);
}

.card-tag.satellite {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.card-tag.industry {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.intelligence-card h4 {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.intelligence-card p {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 16px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-subtle);
}

.card-meta .source {
  color: var(--color-primary);
}

/* Responsive */
@media (max-width: 1024px) {
  .features-grid,
  .intelligence-list {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 48px;
  }

  .features-grid,
  .intelligence-list,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .section-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .section-header .section-title {
    text-align: center;
  }
}
</style>