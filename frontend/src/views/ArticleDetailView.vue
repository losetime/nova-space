<template>
  <div class="article-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p>加载中...</p>
    </div>

    <!-- 文章内容 -->
    <article v-else-if="article" class="article-content">
      <!-- 返回按钮 -->
      <div class="back-nav">
        <a-button type="text" @click="goBack">
          <template #icon><LeftOutlined /></template>
          返回科普中心
        </a-button>
      </div>

      <!-- 文章头部 -->
      <header class="article-header">
        <div class="article-meta">
          <a-tag :color="categoryColor">{{ categoryLabel }}</a-tag>
          <span class="read-time">
            <ClockCircleOutlined />
            {{ article.duration || 5 }} 分钟阅读
          </span>
          <span class="views">
            <EyeOutlined />
            {{ article.views || 0 }} 次阅读
          </span>
        </div>
        <h1 class="article-title">{{ article.title }}</h1>
        <p class="article-summary">{{ article.summary }}</p>
        
        <!-- 标签 -->
        <div class="article-tags" v-if="article.tags?.length">
          <a-tag v-for="tag in article.tags" :key="tag" color="blue">{{ tag }}</a-tag>
        </div>
      </header>

      <!-- 封面图 -->
      <div v-if="article.cover" class="article-cover">
        <img :src="article.cover" :alt="article.title" />
      </div>

      <!-- 文章正文 -->
      <div class="article-body" v-html="renderedContent"></div>

      <!-- 底部操作 -->
      <footer class="article-footer">
        <div class="actions">
          <a-button type="text" :class="{ liked: isLiked }" @click="toggleLike">
            <template #icon><LikeOutlined /></template>
            {{ article.likes || 0 }}
          </a-button>
          <a-button type="text" @click="shareArticle">
            <template #icon><ShareAltOutlined /></template>
            分享
          </a-button>
          <a-button type="text" @click="collectArticle">
            <template #icon><BookOutlined /></template>
            收藏
          </a-button>
        </div>
        <div class="publish-date">
          发布于 {{ formatDate(article.createdAt) }}
        </div>
      </footer>
    </article>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <a-result status="404" title="文章不存在" sub-title="该文章可能已被删除或移除">
        <template #extra>
          <a-button type="primary" @click="goBack">返回科普中心</a-button>
        </template>
      </a-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { marked } from 'marked'
import {
  LeftOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  LikeOutlined,
  ShareAltOutlined,
  BookOutlined,
} from '@ant-design/icons-vue'
import { educationApi } from '@/api'

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

interface Article {
  id: number
  title: string
  content: string
  summary?: string
  cover?: string
  category: string
  tags?: string[]
  views?: number
  likes?: number
  duration?: number
  createdAt: string
}

const route = useRoute()
const router = useRouter()

const article = ref<Article | null>(null)
const loading = ref(true)
const isLiked = ref(false)

// 分类映射 - Red Noir 主题统一使用红色
const categoryMap: Record<string, { label: string; color: string }> = {
  basics: { label: '基础知识', color: 'red' },
  satellite: { label: '卫星技术', color: 'red' },
  rocket: { label: '火箭技术', color: 'red' },
  mission: { label: '航天任务', color: 'red' },
  people: { label: '航天人物', color: 'red' },
  history: { label: '航天历史', color: 'red' },
}

const categoryLabel = computed(() => {
  return categoryMap[article.value?.category || '']?.label || '科普'
})

const categoryColor = computed(() => {
  return categoryMap[article.value?.category || '']?.color || 'default'
})

const renderedContent = computed(() => {
  if (!article.value?.content) return ''
  return marked(article.value.content) as string
})

// 加载文章详情
const loadArticle = async () => {
  const id = route.params.id as string
  if (!id) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const res = await educationApi.getArticle(id)
    article.value = res.data.data
  } catch (error) {
    console.error('加载文章失败:', error)
    article.value = null
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => {
  router.push({ name: 'education' })
}

// 点赞
const toggleLike = () => {
  isLiked.value = !isLiked.value
  if (article.value) {
    article.value.likes = (article.value.likes || 0) + (isLiked.value ? 1 : -1)
  }
  message.success(isLiked.value ? '已点赞' : '已取消点赞')
}

// 分享
const shareArticle = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    message.success('链接已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}

// 收藏
const collectArticle = () => {
  message.info('收藏功能开发中')
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(() => {
  loadArticle()
})
</script>

<style scoped>
.article-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: #000000;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #a1a1aa;
}

.loading-container p {
  color: #a1a1aa;
  margin-top: 16px;
}

.back-nav {
  margin-bottom: 24px;
}

.back-nav :deep(.ant-btn) {
  color: #a1a1aa;
  transition: all 0.3s ease;
}

.back-nav :deep(.ant-btn:hover) {
  color: #ef233c;
}

.article-header {
  margin-bottom: 32px;
  padding: 24px;
  background: #18181b;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  color: #a1a1aa;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-title {
  font-size: 32px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 16px;
  line-height: 1.4;
  font-family: 'Manrope', sans-serif;
}

.article-summary {
  font-size: 18px;
  color: #f4f4f5;
  margin: 0 0 16px;
  line-height: 1.6;
  font-family: 'Inter', sans-serif;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-tags :deep(.ant-tag) {
  background: rgba(239, 35, 60, 0.15);
  border-color: rgba(239, 35, 60, 0.3);
  color: #ef233c;
}

.article-cover {
  margin-bottom: 32px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.article-cover img {
  width: 100%;
  height: auto;
  display: block;
}

.article-body {
  color: #f4f4f5;
  font-size: 16px;
  line-height: 1.8;
  font-family: 'Inter', sans-serif;
  padding: 24px;
  background: #18181b;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3) {
  color: #ffffff;
  margin-top: 32px;
  margin-bottom: 16px;
  font-family: 'Manrope', sans-serif;
}

.article-body :deep(h1) {
  font-size: 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
}

.article-body :deep(h2) {
  font-size: 24px;
}

.article-body :deep(h3) {
  font-size: 20px;
}

.article-body :deep(p) {
  margin-bottom: 16px;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  padding-left: 24px;
  margin-bottom: 16px;
}

.article-body :deep(li) {
  margin-bottom: 8px;
}

.article-body :deep(blockquote) {
  border-left: 4px solid #ef233c;
  padding: 12px 16px;
  margin: 16px 0;
  background: rgba(239, 35, 60, 0.1);
  border-radius: 0 8px 8px 0;
  color: #f4f4f5;
}

.article-body :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  color: #ef233c;
}

.article-body :deep(pre) {
  background: #09090b;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.article-body :deep(pre code) {
  background: none;
  padding: 0;
  color: #f4f4f5;
}

.article-body :deep(strong) {
  color: #ffffff;
  font-weight: 600;
}

.article-body :deep(a) {
  color: #ef233c;
  transition: all 0.3s ease;
}

.article-body :deep(a:hover) {
  text-decoration: underline;
  color: #ff4d5f;
}

.article-body :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 32px 0;
}

.article-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.article-body :deep(th),
.article-body :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px;
  text-align: left;
}

.article-body :deep(th) {
  background: #09090b;
  font-weight: 600;
  color: #ffffff;
}

.article-footer {
  margin-top: 48px;
  padding: 24px;
  background: #18181b;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions :deep(.ant-btn) {
  color: #a1a1aa;
  transition: all 0.3s ease;
}

.actions :deep(.ant-btn:hover) {
  color: #ef233c;
}

.actions :deep(.liked) {
  color: #ef233c;
}

.publish-date {
  color: #a1a1aa;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
}

/* 分类标签颜色 - Red Noir 主题 */
:deep(.ant-tag-blue) {
  background: rgba(239, 35, 60, 0.15) !important;
  border-color: rgba(239, 35, 60, 0.3) !important;
  color: #ef233c !important;
}

:deep(.ant-tag-green) {
  background: rgba(239, 35, 60, 0.15) !important;
  border-color: rgba(239, 35, 60, 0.3) !important;
  color: #ef233c !important;
}

:deep(.ant-tag-orange) {
  background: rgba(239, 35, 60, 0.15) !important;
  border-color: rgba(239, 35, 60, 0.3) !important;
  color: #ef233c !important;
}

:deep(.ant-tag-purple) {
  background: rgba(239, 35, 60, 0.15) !important;
  border-color: rgba(239, 35, 60, 0.3) !important;
  color: #ef233c !important;
}

:deep(.ant-tag-cyan) {
  background: rgba(239, 35, 60, 0.15) !important;
  border-color: rgba(239, 35, 60, 0.3) !important;
  color: #ef233c !important;
}

:deep(.ant-tag-gold) {
  background: rgba(239, 35, 60, 0.15) !important;
  border-color: rgba(239, 35, 60, 0.3) !important;
  color: #ef233c !important;
}

:deep(.ant-tag-default) {
  background: rgba(239, 35, 60, 0.15) !important;
  border-color: rgba(239, 35, 60, 0.3) !important;
  color: #ef233c !important;
}

:deep(.ant-tag-red) {
  background: rgba(239, 35, 60, 0.15) !important;
  border-color: rgba(239, 35, 60, 0.3) !important;
  color: #ef233c !important;
}

@media (max-width: 768px) {
  .article-detail {
    padding: 16px;
  }

  .article-title {
    font-size: 24px;
  }

  .article-meta {
    flex-wrap: wrap;
    gap: 8px;
  }

  .article-footer {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>