<template>
  <div class="pass-prediction">
    <div v-if="!satellite" class="no-satellite">
      <span>请先选择一颗卫星</span>
    </div>

    <template v-else>
      <!-- 观察者位置设置 -->
      <div class="observer-settings">
        <div class="section-title">
          <EnvironmentOutlined />
          <span>观察位置</span>
          <a-tooltip title="使用浏览器定位">
            <a-button type="link" size="small" @click="detectLocation" :loading="locating">
              <AimOutlined />
            </a-button>
          </a-tooltip>
        </div>

        <div class="location-inputs">
          <div class="input-group">
            <label>纬度</label>
            <a-input-number
              v-model:value="observer.lat"
              :min="-90"
              :max="90"
              :step="0.0001"
              :precision="4"
              placeholder="纬度"
            />
          </div>
          <div class="input-group">
            <label>经度</label>
            <a-input-number
              v-model:value="observer.lng"
              :min="-180"
              :max="180"
              :step="0.0001"
              :precision="4"
              placeholder="经度"
            />
          </div>
          <div class="input-group small">
            <label>海拔(m)</label>
            <a-input-number
              v-model:value="observer.alt"
              :min="0"
              :max="9000"
              placeholder="海拔"
            />
          </div>
        </div>

        <!-- 预设城市 -->
        <div class="preset-cities">
          <span class="preset-label">快速选择：</span>
          <a-tag
            v-for="city in presetCities"
            :key="city.name"
            :color="observer.lat === city.lat && observer.lng === city.lng ? 'cyan' : 'default'"
            @click="selectCity(city)"
          >
            {{ city.name }}
          </a-tag>
        </div>
      </div>

      <!-- 预测参数 -->
      <div class="prediction-params">
        <div class="param-row">
          <div class="param-group">
            <label>预测天数</label>
            <a-select v-model:value="days" class="param-select">
              <a-select-option :value="1">1 天</a-select-option>
              <a-select-option :value="3">3 天</a-select-option>
              <a-select-option :value="7">7 天</a-select-option>
              <a-select-option :value="14">14 天</a-select-option>
            </a-select>
          </div>
          <div class="param-group">
            <label>最小高度角</label>
            <a-select v-model:value="minElevation" class="param-select">
              <a-select-option :value="5">5°</a-select-option>
              <a-select-option :value="10">10°</a-select-option>
              <a-select-option :value="15">15°</a-select-option>
              <a-select-option :value="20">20°</a-select-option>
              <a-select-option :value="30">30°</a-select-option>
            </a-select>
          </div>
        </div>
      </div>

      <!-- 预测按钮 -->
      <a-button
        type="primary"
        class="predict-btn"
        :loading="loading"
        :disabled="!isValidLocation"
        @click="handlePredict"
      >
        <template #icon><CalculatorOutlined /></template>
        开始预测
      </a-button>

      <!-- 预测结果 -->
      <div v-if="prediction" class="prediction-result">
        <div class="result-header">
          <span class="result-title">预测结果</span>
          <a-tag color="cyan">{{ prediction.totalPasses }} 次过境</a-tag>
        </div>

        <div v-if="prediction.passes.length === 0" class="no-passes">
          <span>在预测时间内没有符合条件的过境</span>
        </div>

        <div v-else class="passes-list">
          <div
            v-for="(pass, index) in prediction.passes"
            :key="index"
            class="pass-item"
            :class="{ visible: pass.visible, selected: selectedPassIndex === index }"
            @click="handlePassClick(pass, index)"
          >
            <div class="pass-header">
              <div class="pass-date">
                <CalendarOutlined />
                <span>{{ formatDate(pass.startTime) }}</span>
              </div>
              <div class="pass-badges">
                <a-tag v-if="pass.visible" color="green">
                  <EyeOutlined /> 肉眼可见
                </a-tag>
                <a-tag :color="getElevationColor(pass.maxElevation)">
                  {{ pass.maxElevation.toFixed(1) }}°
                </a-tag>
              </div>
            </div>

            <div class="pass-details">
              <div class="detail-row">
                <div class="detail-item">
                  <span class="detail-label">开始</span>
                  <span class="detail-value">{{ formatTime(pass.startTime) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">结束</span>
                  <span class="detail-value">{{ formatTime(pass.endTime) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">持续</span>
                  <span class="detail-value">{{ formatDuration(pass.duration) }}</span>
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-item">
                  <span class="detail-label">起始方位</span>
                  <span class="detail-value">{{ getAzimuthDirection(pass.startAzimuth) }} ({{ pass.startAzimuth }}°)</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">结束方位</span>
                  <span class="detail-value">{{ getAzimuthDirection(pass.endAzimuth) }} ({{ pass.endAzimuth }}°)</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">最高点</span>
                  <span class="detail-value">{{ formatTime(pass.maxElevationTime) }}</span>
                </div>
              </div>
            </div>

            <!-- 可视化轨迹 -->
            <div class="pass-visual">
              <div class="azimuth-track">
                <div class="track-line">
                  <div class="track-start" :style="{ left: '0%' }">
                    <span class="azimuth-label">{{ pass.startAzimuth }}°</span>
                  </div>
                  <div class="track-max" :style="{ left: '50%' }">
                    <span class="elevation-label">{{ pass.maxElevation }}°</span>
                  </div>
                  <div class="track-end" :style="{ right: '0%' }">
                    <span class="azimuth-label">{{ pass.endAzimuth }}°</span>
                  </div>
                  <svg class="track-curve" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <path
                      :d="`M 0 50 Q 50 ${50 - pass.maxElevation * 0.5} 100 50`"
                      fill="none"
                      stroke="rgba(0, 212, 255, 0.5)"
                      stroke-width="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  EyeOutlined,
  EnvironmentOutlined,
  AimOutlined,
  CalculatorOutlined,
  CalendarOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { satelliteApi, type PassPrediction, type PassEvent } from '@/api'
import type { Satellite } from '@/hooks/useWebSocket'

const props = defineProps<{
  satellite: Satellite | null
}>()

const emit = defineEmits<{
  'show-trajectory': [data: {
    noradId: string
    startTime: string
    endTime: string
    observer: { lat: number; lng: number; alt: number }
  }]
}>()

// 选中的过境索引
const selectedPassIndex = ref<number | null>(null)

// 重置预测数据
const reset = () => {
  prediction.value = null
}

// 暴露给父组件调用
defineExpose({ reset })

// 观察者位置
const observer = ref({
  lat: 39.9042,
  lng: 116.4074,
  alt: 0,
})

const locating = ref(false)
const days = ref(7)
const minElevation = ref(10)
const loading = ref(false)
const prediction = ref<PassPrediction | null>(null)

// 预设城市
const presetCities = [
  { name: '北京', lat: 39.9042, lng: 116.4074, alt: 0 },
  { name: '上海', lat: 31.2304, lng: 121.4737, alt: 0 },
  { name: '广州', lat: 23.1291, lng: 113.2644, alt: 0 },
  { name: '深圳', lat: 22.5431, lng: 114.0579, alt: 0 },
  { name: '成都', lat: 30.5728, lng: 104.0668, alt: 0 },
]

// 验证位置是否有效
const isValidLocation = computed(() => {
  return (
    observer.value.lat >= -90 &&
    observer.value.lat <= 90 &&
    observer.value.lng >= -180 &&
    observer.value.lng <= 180
  )
})

// 检测当前位置
const detectLocation = async () => {
  if (!navigator.geolocation) {
    message.warning('您的浏览器不支持地理定位功能')
    return
  }

  locating.value = true
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      })
    })

    observer.value.lat = position.coords.latitude
    observer.value.lng = position.coords.longitude
    observer.value.alt = position.coords.altitude || 0
  } catch (error: any) {
    console.error('获取位置失败:', error)
    if (error.code === 1) {
      message.error('位置权限被拒绝，请允许访问位置信息')
    } else if (error.code === 2) {
      message.error('无法获取位置信息，请检查设备设置')
    } else if (error.code === 3) {
      message.error('获取位置超时，请重试')
    } else {
      message.error('获取位置失败，请手动输入坐标')
    }
  } finally {
    locating.value = false
  }
}

// 选择预设城市
const selectCity = (city: typeof presetCities[0]) => {
  observer.value = { ...city }
}

// 开始预测
const handlePredict = async () => {
  if (!props.satellite || !isValidLocation.value) return

  loading.value = true
  try {
    const res = await satelliteApi.predictPasses(props.satellite.noradId, {
      lat: observer.value.lat,
      lng: observer.value.lng,
      alt: observer.value.alt,
      days: days.value,
      minElevation: minElevation.value,
    })

    if (res.data.code === 0) {
      prediction.value = res.data.data
    } else {
      message.error(res.data.message || '过境预测失败')
    }
  } catch (error: any) {
    console.error('过境预测失败:', error)
    message.error(error.response?.data?.message || '过境预测请求失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (time: string) => {
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化持续时间
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}分${secs}秒`
}

// 获取方位角方向
const getAzimuthDirection = (azimuth: number): string => {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(azimuth / 45) % 8
  return directions[index] ?? '北'
}

// 获取高度角颜色
const getElevationColor = (elevation: number): string => {
  if (elevation >= 60) return 'gold'
  if (elevation >= 30) return 'cyan'
  return 'blue'
}

// 点击过境记录，显示轨迹
const handlePassClick = (pass: PassEvent, index: number) => {
  if (!props.satellite) return

  // 切换选中状态
  if (selectedPassIndex.value === index) {
    selectedPassIndex.value = null
  } else {
    selectedPassIndex.value = index

    // 发送事件给父组件，请求显示轨迹
    emit('show-trajectory', {
      noradId: props.satellite.noradId,
      startTime: pass.startTime,
      endTime: pass.endTime,
      observer: { ...observer.value },
    })
  }
}

// 初始化时尝试获取位置
onMounted(() => {
  // 默认使用北京
})
</script>

<style scoped lang="scss">
$primary: #00d4ff;
$primary-light: #7dd3fc;
$accent: #a855f7;
$bg-card: rgba(255, 255, 255, 0.03);
$bg-elevated: rgba(255, 255, 255, 0.06);
$text-primary: rgba(255, 255, 255, 0.95);
$text-secondary: rgba(255, 255, 255, 0.6);
$text-muted: rgba(255, 255, 255, 0.4);

.pass-prediction {
  // padding 由父组件控制
}

.no-satellite {
  text-align: center;
  padding: 24px;
  color: $text-muted;
  font-size: 13px;
}

.observer-settings {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;

  .anticon {
    color: $accent;
  }
}

.location-inputs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  .input-group {
    flex: 1;

    &.small {
      flex: 0.5;
    }

    label {
      display: block;
      font-size: 11px;
      color: $text-muted;
      margin-bottom: 4px;
    }

    :deep(.ant-input-number) {
      width: 100%;
      background: rgba(20, 20, 28, 1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;

      .ant-input-number-input {
        color: $text-primary;
      }
    }
  }
}

.preset-cities {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .preset-label {
    font-size: 11px;
    color: $text-muted;
  }

  .ant-tag {
    cursor: pointer;
    margin: 0;
    font-size: 11px;

    &:hover {
      opacity: 0.8;
    }
  }
}

.prediction-params {
  margin-bottom: 16px;
}

.param-row {
  display: flex;
  gap: 12px;
}

.param-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    color: $text-secondary;
  }
}

.param-select {
  width: 100%;

  :deep(.ant-select-selector) {
    background: rgba(20, 20, 28, 1) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 8px !important;
    color: $text-primary !important;

    &:hover {
      border-color: rgba($primary, 0.4) !important;
    }
  }

  :deep(.ant-select-arrow) {
    color: $text-muted;
  }
}

.predict-btn {
  width: 100%;
  height: 40px;
  background: linear-gradient(135deg, $primary 0%, $accent 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
  }
}

.prediction-result {
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

.no-passes {
  text-align: center;
  padding: 24px;
  color: $text-muted;
  font-size: 13px;
}

.passes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
}

.pass-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba($primary, 0.2);
  }

  &.selected {
    background: rgba($primary, 0.1);
    border-color: rgba($primary, 0.4);
    box-shadow: 0 0 20px rgba($primary, 0.15);
  }

  &.visible {
    border-color: rgba(0, 255, 136, 0.3);

    .pass-header {
      .pass-date {
        color: #00ff88;
      }
    }
  }
}

.pass-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  .pass-date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;

    .anticon {
      color: $primary;
    }
  }

  .pass-badges {
    display: flex;
    gap: 6px;

    .ant-tag {
      margin: 0;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.pass-details {
  margin-bottom: 10px;
}

.detail-row {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.detail-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;

  .detail-label {
    font-size: 10px;
    color: $text-muted;
    text-transform: uppercase;
  }

  .detail-value {
    font-size: 12px;
    color: $text-primary;
  }
}

.pass-visual {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.azimuth-track {
  position: relative;
  height: 50px;
}

.track-line {
  position: relative;
  height: 100%;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}

.track-start,
.track-end,
.track-max {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  z-index: 2;
}

.track-start {
  left: 0;
  transform: translateX(0);
}

.track-end {
  right: 0;
  transform: translateX(0);
  left: auto;
}

.track-max {
  top: 5px;
}

.azimuth-label,
.elevation-label {
  font-size: 10px;
  color: $text-muted;
  white-space: nowrap;
}

.elevation-label {
  color: $primary;
  font-weight: 600;
}

.track-curve {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>