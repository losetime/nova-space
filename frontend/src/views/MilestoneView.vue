<template>
  <div class="milestone-view">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载航天里程碑...</p>
      </div>
    </div>

    <div v-show="!loading" class="milestone-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <RocketOutlined class="title-icon" />
            航天发展里程碑
          </h1>
          <p class="page-subtitle">探索人类航天事业的历史足迹</p>
        </div>

        <!-- 分类筛选 -->
        <div class="category-filter">
          <div
            v-for="cat in categoryOptions"
            :key="cat.value"
            class="category-item"
            :class="{ active: selectedCategory === cat.value }"
            @click="selectedCategory = cat.value"
          >
            <component :is="cat.icon" class="category-icon" :class="cat.value || 'all'" />
            <span>{{ cat.label }}</span>
          </div>
        </div>
      </div>

      <!-- 时间线内容 -->
      <div class="timeline-container">
        <div v-if="filteredTimeline.length === 0" class="empty-state">
          <InboxOutlined class="empty-icon" />
          <p>暂无相关里程碑数据</p>
        </div>

        <div
          v-for="decade in filteredTimeline"
          :key="decade.decade"
          class="timeline-decade"
        >
          <div class="decade-header">
            <h2 class="decade-title">{{ decade.decade }}</h2>
            <div class="decade-line"></div>
          </div>

          <div class="timeline-items">
            <div
              v-for="item in decade.items"
              :key="item.id"
              class="timeline-item"
              :class="{ featured: item.importance >= 4 }"
              @click="showDetail(item)"
            >
              <div class="timeline-marker">
                <div class="marker-dot"></div>
                <div class="marker-line"></div>
              </div>

              <div class="timeline-content">
                <div class="content-card">
                  <div class="card-body">
                    <div class="card-header">
                      <span class="event-date">{{ formatDate(item.eventDate) }}</span>
                      <span class="category-tag" :class="item.category">
                        {{ getCategoryLabel(item.category) }}
                      </span>
                    </div>
                    <h3 class="card-title">{{ item.title }}</h3>
                    <p class="card-description">{{ item.description }}</p>
                    <div class="card-footer">
                      <span class="footer-item">
                        <EnvironmentOutlined />
                        {{ item.location || '未知地点' }}
                      </span>
                      <span class="footer-item">
                        <UserOutlined />
                        {{ item.organizer || '未知机构' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <a-drawer
      v-model:open="detailVisible"
      :width="600"
      :title="selectedMilestone?.title || '里程碑详情'"
      class="milestone-detail-drawer"
      placement="right"
    >
      <div v-if="selectedMilestone" class="detail-content">
        <div class="detail-cover">
          <img
            :src="selectedMilestone.cover || defaultCover"
            :alt="selectedMilestone.title"
            @error="handleImageError"
          />
        </div>

        <div class="detail-meta">
          <div class="meta-item">
            <ClockCircleOutlined class="meta-icon" />
            <span class="meta-label">时间</span>
            <span class="meta-value">{{ formatDate(selectedMilestone.eventDate) }}</span>
          </div>
          <div class="meta-item">
            <TagOutlined class="meta-icon" />
            <span class="meta-label">分类</span>
            <span class="meta-value">{{ getCategoryLabel(selectedMilestone.category) }}</span>
          </div>
          <div class="meta-item">
            <EnvironmentOutlined class="meta-icon" />
            <span class="meta-label">地点</span>
            <span class="meta-value">{{ selectedMilestone.location || '未知地点' }}</span>
          </div>
          <div class="meta-item">
            <UserOutlined class="meta-icon" />
            <span class="meta-label">组织</span>
            <span class="meta-value">{{ selectedMilestone.organizer || '未知机构' }}</span>
          </div>
        </div>

        <div class="detail-description">
          <h4>事件概述</h4>
          <p>{{ selectedMilestone.description }}</p>
        </div>

        <div
          v-if="selectedMilestone.content"
          class="detail-content-markdown"
          v-html="renderMarkdown(selectedMilestone.content)"
        ></div>

        <div class="detail-media">
          <h4>相关媒体</h4>
          <div class="media-grid">
            <template v-if="selectedMilestone.media && selectedMilestone.media.length > 0">
              <div v-for="(media, index) in selectedMilestone.media" :key="index" class="media-item">
                <img v-if="media.type === 'image'" :src="media.url" :alt="media.caption || `媒体${index + 1}`" />
                <video v-else-if="media.type === 'video'" :src="media.url" controls></video>
              </div>
            </template>
            <div v-else class="media-empty">
              <PictureOutlined class="empty-media-icon" />
              <span>暂无媒体资源</span>
            </div>
          </div>
        </div>

        <div class="detail-related">
          <h4>关联卫星</h4>
          <a-button
            type="primary"
            :disabled="!selectedMilestone.relatedSatelliteNoradId"
            @click="viewRelatedSatellite(selectedMilestone.relatedSatelliteNoradId)"
          >
            <RocketOutlined />
            {{ selectedMilestone.relatedSatelliteNoradId ? '查看卫星详情' : '暂无关联卫星' }}
          </a-button>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, shallowRef, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  RocketOutlined,
  GlobalOutlined,
  ApiOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  TagOutlined,
  EnvironmentOutlined,
  UserOutlined,
  InboxOutlined,
  PictureOutlined,
} from '@ant-design/icons-vue'
import { milestoneApi } from '@/api'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// 类型定义
interface MediaItem {
  type: 'image' | 'video'
  url: string
  caption?: string
}

interface Milestone {
  id: number
  title: string
  description: string
  content?: string
  eventDate: string
  category: string
  cover?: string
  media?: MediaItem[]
  relatedSatelliteNoradId?: string
  importance: number
  location?: string
  organizer?: string
  createdAt: string
  updatedAt: string
}

interface TimelineDecade {
  decade: string
  items: Milestone[]
}

// 默认封面图
const defaultCover = `data:image/svg+xml,${encodeURIComponent('<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="50%" y="50%" fill="#666" font-size="16" text-anchor="middle" dy=".3em">暂无封面图片</text></svg>')}`

// 分类选项配置
const categoryOptions = [
  { value: '', label: '全部', icon: markRaw(GlobalOutlined) },
  { value: 'launch', label: '发射任务', icon: markRaw(RocketOutlined) },
  { value: 'recovery', label: '回收任务', icon: markRaw(RocketOutlined) },
  { value: 'orbit', label: '在轨测试', icon: markRaw(ApiOutlined) },
  { value: 'mission', label: '深空探测', icon: markRaw(GlobalOutlined) },
  { value: 'other', label: '其他', icon: markRaw(InfoCircleOutlined) },
]

// 分类标签映射
const categoryLabels: Record<string, string> = {
  launch: '发射任务',
  recovery: '回收任务',
  orbit: '在轨测试',
  mission: '深空探测',
  other: '其他',
}

const router = useRouter()
const loading = ref(true)
const detailVisible = ref(false)
const selectedMilestone = shallowRef<Milestone | null>(null)
const selectedCategory = ref('')
const timelineData = ref<TimelineDecade[]>([])

// 根据 selectedCategory 筛选数据
const filteredTimeline = computed(() => {
  if (!selectedCategory.value) {
    return timelineData.value
  }
  return timelineData.value
    .map((decade) => ({
      decade: decade.decade,
      items: decade.items.filter((item) => item.category === selectedCategory.value),
    }))
    .filter((decade) => decade.items.length > 0)
})

const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || '未知分类'
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 安全渲染 Markdown（防 XSS）
const renderMarkdown = (content: string): string => {
  const rawHtml = marked(content) as string
  return DOMPurify.sanitize(rawHtml)
}

// 图片加载失败处理
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = defaultCover
}

// 加载时间线数据
async function loadTimeline() {
  try {
    const res = await milestoneApi.getTimeline()
    if (res.data.code === 0) {
      timelineData.value = res.data.data
    } else {
      message.error(res.data.message || '加载失败')
    }
  } catch (err: any) {
    console.error('加载时间线数据失败:', err)
    message.error(err.response?.data?.message || '加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 显示详情
function showDetail(milestone: Milestone) {
  selectedMilestone.value = milestone
  detailVisible.value = true
}

// 查看关联卫星
function viewRelatedSatellite(noradId?: string) {
  if (!noradId) return
  detailVisible.value = false
  router.push({
    path: '/satellite',
    query: { noradId },
  })
}

onMounted(() => {
  loadTimeline()
})
</script>

<style scoped lang="scss">
.milestone-view {
  height: calc(100vh - 64px);
  background: #0a0a0f;
  overflow-y: auto;
  position: relative;
}

// 加载状态
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.95);
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(168, 85, 247, 0.2);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

// 主容器
.milestone-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

// 页面头部
.page-header {
  margin-bottom: 40px;
  text-align: center;
}

.header-content {
  margin-bottom: 30px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 0 12px;

  .title-icon {
    font-size: 40px;
    color: #a855f7;
  }
}

.page-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

// 分类筛选
.category-filter {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(168, 85, 247, 0.08);
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;

  &:hover {
    background: rgba(168, 85, 247, 0.15);
    border-color: rgba(168, 85, 247, 0.3);
    color: #fff;
  }

  &.active {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.1) 100%);
    border-color: rgba(168, 85, 247, 0.5);
    color: #a855f7;
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
  }

  .category-icon {
    font-size: 16px;

    &.all {
      color: rgba(255, 255, 255, 0.6);
    }
    &.launch {
      color: #00ff88;
    }
    &.recovery {
      color: #00d4ff;
    }
    &.orbit {
      color: #b366e8;
    }
    &.mission {
      color: #ffaa00;
    }
    &.other {
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: rgba(255, 255, 255, 0.4);

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  p {
    font-size: 16px;
    margin: 0;
  }
}

// 时间线容器
.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.timeline-decade {
  position: relative;
}

.decade-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.decade-title {
  font-size: 28px;
  font-weight: 700;
  color: #a855f7;
  margin: 0;
  white-space: nowrap;
}

.decade-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.5) 0%, transparent 100%);
}

// 时间线项目
.timeline-items {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-left: 30px;
}

.timeline-item {
  display: flex;
  gap: 20px;
  cursor: pointer;

  &.featured .timeline-marker .marker-dot {
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
  }
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: rgba(168, 85, 247, 0.5);
  border-radius: 50%;
  transition: all 0.3s;
}

.marker-line {
  flex: 1;
  width: 2px;
  background: linear-gradient(180deg, rgba(168, 85, 247, 0.3) 0%, transparent 100%);
  margin-top: 10px;
}

.timeline-item:last-child .marker-line {
  display: none;
}

.timeline-item:hover .marker-dot {
  transform: scale(1.3);
  background: #a855f7;
}

// 内容卡片
.timeline-content {
  flex: 1;
  min-width: 0;
}

.content-card {
  background: rgba(20, 20, 30, 0.8);
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(168, 85, 247, 0.4);
    box-shadow: 0 8px 32px rgba(168, 85, 247, 0.15);
    transform: translateY(-2px);
  }
}

.card-body {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.event-date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.category-tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;

  &.launch {
    background: rgba(0, 255, 136, 0.15);
    color: #00ff88;
  }
  &.recovery {
    background: rgba(0, 212, 255, 0.15);
    color: #00d4ff;
  }
  &.orbit {
    background: rgba(179, 102, 232, 0.15);
    color: #b366e8;
  }
  &.mission {
    background: rgba(255, 170, 0, 0.15);
    color: #ffaa00;
  }
  &.other {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
  }
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 10px;
}

.card-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

// 详情弹窗
.milestone-detail-drawer {
  :deep(.ant-drawer-content) {
    background: rgba(15, 15, 25, 0.98);
    border: 1px solid rgba(168, 85, 247, 0.2);
  }

  :deep(.ant-drawer-title) {
    color: #fff;
    font-size: 18px;
    font-weight: 600;
  }

  :deep(.ant-drawer-close) {
    color: rgba(255, 255, 255, 0.5);
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-cover {
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a2e;

  img {
    width: 100%;
    height: auto;
    max-height: 300px;
    object-fit: cover;
  }
}

.detail-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: rgba(168, 85, 247, 0.08);
  border-radius: 10px;
  border: 1px solid rgba(168, 85, 247, 0.1);
}

.meta-icon {
  font-size: 18px;
  color: #a855f7;
}

.meta-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
}

.meta-value {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.detail-description,
.detail-content-markdown,
.detail-media,
.detail-related {
  h4 {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 12px;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.8;
    margin: 0;
  }
}

.detail-content-markdown {
  :deep(p) {
    margin-bottom: 12px;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    color: #fff;
    margin-top: 20px;
    margin-bottom: 12px;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
    color: rgba(255, 255, 255, 0.7);
  }
}

.detail-media {
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .media-item {
    border-radius: 8px;
    overflow: hidden;

    img,
    video {
      width: 100%;
      height: 100px;
      object-fit: cover;
    }
  }

  .media-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 30px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.3);

    .empty-media-icon {
      font-size: 32px;
    }

    span {
      font-size: 13px;
    }
  }
}

.detail-related {
  .ant-btn {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>