<template>
  <div class="sunlight-analysis">
    <div v-if="!satellite" class="no-satellite">
      <span>请先选择一颗卫星</span>
    </div>

    <template v-else>
      <!-- 实时状态卡片 -->
      <div class="status-section">
        <div class="section-header">当前状态</div>
        <div class="current-status-card" :class="currentStatus">
          <div class="status-icon">
            <span class="icon-sun" v-if="currentStatus === 'sunlight'">☀</span>
            <span class="icon-moon" v-else>☽</span>
          </div>
          <div class="status-info">
            <div class="status-text">
              {{ currentStatus === 'sunlight' ? '向阳面' : '阴影区' }}
            </div>
            <div v-if="nextEvent" class="next-event">
              {{ nextEvent.type === 'entry' ? '进入阴影' : '离开阴影' }}:
              {{ nextEvent.minutesUntil }} 分钟后
            </div>
          </div>
        </div>
      </div>

      <!-- 分析参数设置 -->
      <div class="analysis-params">
        <div class="param-group">
          <label>分析时长</label>
          <a-select v-model:value="duration" class="param-select">
            <a-select-option :value="90">1.5 小时（约1圈）</a-select-option>
            <a-select-option :value="180">3 小时（约2圈）</a-select-option>
            <a-select-option :value="360">6 小时（约4圈）</a-select-option>
          </a-select>
        </div>

        <div class="param-group">
          <label>开始时间</label>
          <a-date-picker
            v-model:value="startTime"
            show-time
            format="YYYY-MM-DD HH:mm"
            class="param-datepicker"
            :disabled-date="disabledDate"
          />
        </div>
      </div>

      <!-- 分析按钮 -->
      <a-button
        type="primary"
        class="analyze-btn"
        :loading="loading"
        @click="handleAnalyze"
      >
        <template #icon><BulbOutlined /></template>
        开始分析
      </a-button>

      <!-- 分析结果 -->
      <div v-if="analysis" class="analysis-result">
        <div class="result-header">
          <span class="result-title">分析结果</span>
        </div>

        <!-- 日照比例条 -->
        <div class="ratio-bar-container">
          <div class="ratio-bar">
            <div
              class="sunlight-bar"
              :style="{ width: (analysis.sunlightRatio * 100) + '%' }"
            >
              <span v-if="analysis.sunlightRatio > 0.2">日照</span>
            </div>
            <div class="eclipse-bar">
              <span v-if="analysis.sunlightRatio < 0.8">阴影</span>
            </div>
          </div>
          <div class="ratio-percent">
            日照比例: {{ (analysis.sunlightRatio * 100).toFixed(1) }}%
          </div>
        </div>

        <!-- 统计数据 -->
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">轨道周期</span>
            <span class="stat-value">{{ analysis.orbitalPeriod }} 分钟</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">日照时长</span>
            <span class="stat-value sunlight">{{ analysis.sunlightDuration }} 分钟</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">阴影时长</span>
            <span class="stat-value eclipse">{{ analysis.eclipseDuration }} 分钟</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">分析时段</span>
            <span class="stat-value">{{ formatDuration(analysis.sunlightDuration + analysis.eclipseDuration) }}</span>
          </div>
        </div>

        <!-- 轨道分段列表 -->
        <div class="orbit-segments">
          <div class="segments-header" @click="showSegments = !showSegments">
            <span>轨道日照分段</span>
            <DownOutlined :class="{ rotated: showSegments }" />
          </div>
          <transition name="slide">
            <div v-show="showSegments" class="segments-list">
              <div
                v-for="(segment, index) in analysis.orbitSegments"
                :key="index"
                class="segment-item"
                :class="segment.status"
              >
                <div class="segment-status">
                  {{ segment.status === 'sunlight' ? '向阳' : '阴影' }}
                </div>
                <div class="segment-time">
                  {{ formatTime(segment.startTime) }} - {{ formatTime(segment.endTime) }}
                </div>
                <div class="segment-duration">
                  {{ calculateSegmentDuration(segment) }} 分钟
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import {
  BulbOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { satelliteApi, type SunlightAnalysis, type OrbitSegment } from '@/api'
import type { Satellite } from '@/hooks/useLocalSatellites'

const props = defineProps<{
  satellite: Satellite | null
}>()

const emit = defineEmits<{
  (e: 'showSunlightOrbit', segments: OrbitSegment[]): void
  (e: 'clearSunlightOrbit', noradId: string): void
  (e: 'remove-orbit', noradId: string): void
  (e: 'restore-orbit', noradId: string): void
}>()

// 重置分析数据
const reset = () => {
  analysis.value = null
  showSegments.value = false
  currentStatus.value = 'sunlight'
  nextEvent.value = null
}

// 暴露给父组件调用
defineExpose({ reset })

// 状态
const duration = ref(180)
const startTime = ref<Dayjs>(dayjs())
const loading = ref(false)
const analysis = ref<SunlightAnalysis | null>(null)
const showSegments = ref(false)

// 实时状态
const currentStatus = ref<'sunlight' | 'eclipse'>('sunlight')
const nextEvent = ref<{ type: 'entry' | 'exit'; minutesUntil: number } | null>(null)

// 状态轮询定时器
let statusTimer: ReturnType<typeof setInterval> | null = null

// 禁用过去的日期
const disabledDate = (current: Dayjs) => {
  return current && current < dayjs().startOf('day')
}

// 格式化时间
const formatTime = (time: string | undefined) => {
  if (!time) return '--'
  return dayjs(time).format('MM-DD HH:mm')
}

// 格式化时长
const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} 小时 ${mins} 分钟`
}

// 计算轨道段时长
const calculateSegmentDuration = (segment: OrbitSegment) => {
  const start = new Date(segment.startTime).getTime()
  const end = new Date(segment.endTime).getTime()
  return Math.round((end - start) / 60000)
}

// 获取实时日照状态
const fetchCurrentStatus = async () => {
  if (!props.satellite) return

  try {
    const res = await satelliteApi.getSunlightStatus(props.satellite.noradId)
    if (res.data.code === 0 && res.data.data) {
      const status = res.data.data
      currentStatus.value = status.status
      if (status.nextEvent) {
        nextEvent.value = {
          type: status.nextEvent.type,
          minutesUntil: status.nextEvent.minutesUntil,
        }
      } else {
        nextEvent.value = null
      }
    }
  } catch {
    // 静默处理错误
  }
}

// 开始分析
const handleAnalyze = async () => {
  if (!props.satellite) return

  // 删除详情轨道（避免干扰）
  emit('remove-orbit', props.satellite.noradId)

  // 清除之前的分析结果
  analysis.value = null
  showSegments.value = false
  emit('clearSunlightOrbit', props.satellite.noradId)

  loading.value = true
  try {
    const res = await satelliteApi.analyzeSunlight(props.satellite.noradId, {
      startTime: startTime.value.toISOString(),
      duration: duration.value,
    })

    if (res.data.code === 0) {
      analysis.value = res.data.data
      // 更新当前状态
      currentStatus.value = res.data.data.currentStatus
      // 通知父组件显示日照轨道
      emit('showSunlightOrbit', analysis.value.orbitSegments)
    } else {
      message.error(res.data.message || '日照分析失败')
    }
  } catch (error: unknown) {
    console.error('日照分析失败:', error)
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    message.error(err.response?.data?.message || err.message || '日照分析请求失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取实时状态并开始轮询
onMounted(() => {
  fetchCurrentStatus()
  // 每30秒更新一次状态
  statusTimer = setInterval(fetchCurrentStatus, 30000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer)
    statusTimer = null
  }
})
</script>

<style scoped lang="scss">
$primary: #00d4ff;
$primary-light: #7dd3fc;
$accent: #a855f7;
$sunlight-color: #fbbf24;
$eclipse-color: #3b82f6;
$bg-card: rgba(255, 255, 255, 0.03);
$bg-elevated: rgba(255, 255, 255, 0.06);
$text-primary: rgba(255, 255, 255, 0.95);
$text-secondary: rgba(255, 255, 255, 0.6);
$text-muted: rgba(255, 255, 255, 0.4);

.sunlight-analysis {
  // padding 由父组件控制
}

.no-satellite {
  text-align: center;
  padding: 24px;
  color: $text-muted;
  font-size: 13px;
}

.status-section {
  margin-bottom: 16px;
}

.section-header {
  font-size: 12px;
  font-weight: 600;
  color: $text-secondary;
  margin-bottom: 8px;
  padding-left: 4px;
}

.current-status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;

  &.sunlight {
    background: linear-gradient(135deg, rgba($sunlight-color, 0.15) 0%, rgba($sunlight-color, 0.05) 100%);
    border: 1px solid rgba($sunlight-color, 0.3);

    .status-icon {
      background: rgba($sunlight-color, 0.2);
      color: $sunlight-color;
    }
  }

  &.eclipse {
    background: linear-gradient(135deg, rgba($eclipse-color, 0.15) 0%, rgba($eclipse-color, 0.05) 100%);
    border: 1px solid rgba($eclipse-color, 0.3);

    .status-icon {
      background: rgba($eclipse-color, 0.2);
      color: $eclipse-color;
    }
  }

  .status-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 20px;
  }

  .status-info {
    flex: 1;

    .status-text {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
    }

    .next-event {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 4px;
    }
  }
}

.analysis-params {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.param-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    color: $text-secondary;
  }
}

.param-select,
.param-datepicker {
  width: 100%;

  :deep(.ant-select-selector),
  :deep(.ant-picker) {
    background: rgba(20, 20, 28, 1) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 8px !important;
    color: $text-primary !important;

    &:hover {
      border-color: rgba($primary, 0.4) !important;
    }
  }

  :deep(.ant-select-arrow),
  :deep(.ant-picker-suffix) {
    color: $text-muted;
  }
}

.analyze-btn {
  width: 100%;
  height: 40px;
  background: linear-gradient(135deg, $sunlight-color 0%, #f97316 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;

  &:hover {
    opacity: 0.9;
  }
}

.analysis-result {
  margin-top: 20px;
  padding: 16px;
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.result-title {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
}

.ratio-bar-container {
  margin-bottom: 16px;
}

.ratio-bar {
  display: flex;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  background: $eclipse-color;

  .sunlight-bar {
    background: $sunlight-color;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: #000;
    transition: width 0.5s ease;
  }

  .eclipse-bar {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
  }
}

.ratio-percent {
  text-align: center;
  font-size: 12px;
  color: $text-secondary;
  margin-top: 8px;
}

.result-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .stat-label {
    font-size: 11px;
    color: $text-muted;
  }

  .stat-value {
    font-size: 13px;
    color: $text-primary;

    &.sunlight {
      color: $sunlight-color;
    }

    &.eclipse {
      color: $eclipse-color;
    }
  }
}

.orbit-segments {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 12px;
}

.segments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 12px;
  color: $text-secondary;
  padding: 4px 0;

  .anticon {
    transition: transform 0.2s;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.segments-list {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
}

.segment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 4px;

  &.sunlight {
    background: rgba($sunlight-color, 0.1);
  }

  &.eclipse {
    background: rgba($eclipse-color, 0.1);
  }

  .segment-status {
    width: 40px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    padding: 4px 0;
    border-radius: 4px;

    .sunlight & {
      background: rgba($sunlight-color, 0.2);
      color: $sunlight-color;
    }

    .eclipse & {
      background: rgba($eclipse-color, 0.2);
      color: $eclipse-color;
    }
  }

  .segment-time {
    flex: 1;
    font-size: 11px;
    color: $text-secondary;
  }

  .segment-duration {
    font-size: 12px;
    color: $text-primary;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>