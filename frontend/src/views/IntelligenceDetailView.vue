<template>
  <div class="intelligence-detail-view">
    <a-spin :spinning="loading">
      <div v-if="detail" class="detail-container">
        <!-- 返回按钮 -->
        <div class="back-nav">
          <a-button type="text" @click="router.push('/intelligence')">
            <LeftOutlined /> 返回情报列表
          </a-button>
        </div>

        <!-- 文章头部 -->
        <div class="detail-header">
          <div class="detail-tag" :class="detail.category">
            {{ getCategoryLabel(detail.category) }}
          </div>
          <h1>{{ detail.title }}</h1>
          <div class="detail-meta">
            <span><ClockCircleOutlined /> {{ formatDate(detail.publishedAt) }}</span>
            <span><UserOutlined /> {{ detail.source }}</span>
            <span><EyeOutlined /> {{ formatViews(detail.views) }}</span>
            <span><HeartOutlined /> {{ detail.likes }}</span>
            <span><StarOutlined /> {{ detail.collects }}</span>
          </div>
        </div>

        <!-- 摘要 -->
        <div class="summary-box">
          <p>{{ detail.summary }}</p>
        </div>

        <!-- 正文 -->
        <div class="content-text" v-html="renderMarkdown(detail.content)"></div>

        <!-- 深度解读 -->
        <div v-if="detail.analysis" class="analysis-box">
          <h4><BulbOutlined /> 深度解读</h4>
          <p>{{ detail.analysis }}</p>
        </div>

        <!-- 趋势预判 -->
        <div v-if="detail.trend" class="trend-box">
          <h4><LineChartOutlined /> 趋势预判</h4>
          <p>{{ detail.trend }}</p>
        </div>

        <!-- 标签 -->
        <div v-if="detail.tags?.length" class="tags-box">
          <a-tag v-for="tag in detail.tags" :key="tag" color="red">{{ tag }}</a-tag>
        </div>

        <!-- 来源 -->
        <div v-if="detail.sourceUrl" class="source-box">
          <LinkOutlined />
          <a :href="detail.sourceUrl" target="_blank" rel="noopener">查看原文</a>
        </div>

        <!-- 操作栏 -->
        <div class="action-bar">
          <a-button 
            :type="detail.isCollected ? 'primary' : 'default'"
            size="large"
            @click="handleCollect"
          >
            <StarFilled v-if="detail.isCollected" />
            <StarOutlined v-else />
            {{ detail.isCollected ? '已收藏' : '收藏' }}
          </a-button>
          <a-button size="large" @click="handleShare">
            <ShareAltOutlined />
            分享
          </a-button>
        </div>
      </div>

      <!-- 加载失败 -->
      <div v-else-if="!loading" class="error-state">
        <a-result
          status="404"
          title="情报不存在"
          sub-title="该情报可能已被删除或您没有访问权限"
        >
          <template #extra>
            <a-button type="primary" @click="router.push('/intelligence')">
              返回情报列表
            </a-button>
          </template>
        </a-result>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  LeftOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EyeOutlined,
  HeartOutlined,
  StarOutlined,
  StarFilled,
  BulbOutlined,
  LineChartOutlined,
  LinkOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue'
import { intelligenceApi, type Intelligence } from '@/api'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref<Intelligence | null>(null)

const categoryLabels: Record<string, string> = {
  launch: '发射任务',
  satellite: '卫星运行',
  industry: '行业动态',
  research: '科研成果',
  environment: '空间环境',
}

const getCategoryLabel = (category: string) => {
  return categoryLabels[category] || category
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatViews = (views: number) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  }
  return views?.toString() || '0'
}

const renderMarkdown = (content: string) => {
  if (!content) return ''
  return marked(content)
}

const fetchDetail = async () => {
  const id = Number(route.params.id)
  if (!id) {
    router.push('/intelligence')
    return
  }

  loading.value = true
  try {
    const res = await intelligenceApi.getDetail(id)
    if (res.data.code === 0) {
      detail.value = res.data.data
    }
  } catch (error) {
    console.error('获取情报详情失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCollect = async () => {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    message.warning('请先登录')
    return
  }

  if (!detail.value) return

  try {
    const res = await intelligenceApi.toggleCollect(detail.value.id)
    if (res.data.code === 0) {
      const collected = res.data.data.collected
      message.success(collected ? '收藏成功' : '已取消收藏')
      if (detail.value) {
        detail.value.isCollected = collected
        detail.value.collects += collected ? 1 : -1
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    message.error('操作失败')
  }
}

const handleShare = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    message.success('链接已复制到剪贴板')
  }).catch(() => {
    message.info('分享链接: ' + url)
  })
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped lang="scss">
.intelligence-detail-view {
  min-height: calc(100vh - 64px);
  background: #000000;
  padding: 40px 24px;
}

.detail-container {
  max-width: 900px;
  margin: 0 auto;
}

.back-nav {
  margin-bottom: 24px;

  :deep(.ant-btn) {
    color: rgba(255, 255, 255, 0.6);

    &:hover {
      color: #ef233c;
    }
  }
}

.detail-header {
  margin-bottom: 32px;

  .detail-tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    margin-bottom: 16px;

    &.launch {
      background: rgba(239, 35, 60, 0.15);
      color: #ef233c;
    }

    &.satellite {
      background: rgba(239, 35, 60, 0.1);
      color: #ff6b6b;
    }

    &.industry {
      background: rgba(255, 193, 7, 0.15);
      color: #ffc107;
    }

    &.research {
      background: rgba(0, 255, 136, 0.15);
      color: #00ff88;
    }

    &.environment {
      background: rgba(255, 107, 53, 0.15);
      color: #ff6b35;
    }
  }

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.4;
    margin-bottom: 16px;
    font-family: 'Manrope', sans-serif;
  }

  .detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    font-size: 14px;
    color: #a1a1aa;

    span {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}

.summary-box {
  background: #18181b;
  border-left: 3px solid #ef233c;
  padding: 20px 24px;
  margin-bottom: 32px;
  border-radius: 0 12px 12px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid #ef233c;

  p {
    color: #f4f4f5;
    font-size: 16px;
    line-height: 1.8;
    margin: 0;
    font-family: 'Inter', sans-serif;
  }
}

.content-text {
  color: #f4f4f5;
  font-size: 16px;
  line-height: 1.9;
  margin-bottom: 32px;
  font-family: 'Inter', sans-serif;

  :deep(h1), :deep(h2), :deep(h3) {
    color: #ffffff;
    margin-top: 32px;
    margin-bottom: 16px;
    font-family: 'Manrope', sans-serif;
  }

  :deep(h1) { font-size: 28px; }
  :deep(h2) { font-size: 24px; }
  :deep(h3) { font-size: 20px; }

  :deep(p) {
    margin-bottom: 20px;
  }

  :deep(ul), :deep(ol) {
    padding-left: 28px;
    margin-bottom: 20px;
  }

  :deep(li) {
    margin-bottom: 10px;
  }

  :deep(code) {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 14px;
  }

  :deep(pre) {
    background: #18181b;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    code {
      background: none;
      padding: 0;
    }
  }

  :deep(blockquote) {
    border-left: 3px solid #ef233c;
    padding-left: 16px;
    margin: 20px 0;
    color: #a1a1aa;
  }
}

.analysis-box, .trend-box {
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;

  h4 {
    color: #ef233c;
    font-size: 16px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Manrope', sans-serif;
  }

  p {
    color: #a1a1aa;
    font-size: 15px;
    line-height: 1.8;
    margin: 0;
    font-family: 'Inter', sans-serif;
  }
}

.trend-box {
  h4 {
    color: #ff6b6b;
  }
}

.tags-box {
  margin: 24px 0;

  :deep(.ant-tag) {
    margin-bottom: 8px;
    padding: 4px 12px;
    font-size: 13px;
    background: rgba(239, 35, 60, 0.15);
    border-color: rgba(239, 35, 60, 0.3);
    color: #ef233c;
  }
}

.source-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #18181b;
  border-radius: 8px;
  margin-bottom: 32px;
  color: #a1a1aa;
  border: 1px solid rgba(255, 255, 255, 0.1);

  a {
    color: #ef233c;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.action-bar {
  display: flex;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  :deep(.ant-btn-primary) {
    background: #ef233c;
    border-color: #ef233c;

    &:hover {
      background: #dc1c33;
      border-color: #dc1c33;
    }
  }

  :deep(.ant-btn-default) {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.2);
    color: #f4f4f5;

    &:hover {
      border-color: #ef233c;
      color: #ef233c;
    }
  }
}

.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;

  :deep(.ant-result-title) {
    color: #ffffff;
  }

  :deep(.ant-result-subtitle) {
    color: #a1a1aa;
  }

  :deep(.ant-btn-primary) {
    background: #ef233c;
    border-color: #ef233c;

    &:hover {
      background: #dc1c33;
      border-color: #dc1c33;
    }
  }
}

@media (max-width: 768px) {
  .detail-header {
    h1 {
      font-size: 24px;
    }

    .detail-meta {
      gap: 12px;
      font-size: 13px;
    }
  }

  .summary-box {
    padding: 16px;

    p {
      font-size: 15px;
    }
  }

  .content-text {
    font-size: 15px;
  }
}
</style>