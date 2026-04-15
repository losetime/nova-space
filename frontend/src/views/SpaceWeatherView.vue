<template>
  <div class="space-weather-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <ThunderboltOutlined class="header-icon" />
        <div class="header-text">
          <h1>空间天气预警</h1>
          <p>实时监测太阳活动与地磁环境</p>
        </div>
      </div>
      <div class="update-time">
        <ClockCircleOutlined />
        <span>{{ lastUpdate || '加载中...' }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p>正在获取空间天气数据...</p>
    </div>

    <template v-else>
      <!-- 实时状态卡片 -->
      <div class="status-cards">
        <!-- 地磁暴等级 -->
        <div class="status-card" :class="getLevelClass(currentStatus?.geomagnetic?.scale)">
          <div class="card-icon">
            <GlobalOutlined />
          </div>
          <div class="card-content">
            <div class="card-label">地磁暴等级</div>
            <div class="card-value">
              <span class="scale-value">G{{ currentStatus?.geomagnetic?.scale || 0 }}</span>
              <span class="scale-text">{{ translateLevelText(currentStatus?.geomagnetic?.text, currentStatus?.geomagnetic?.scale) }}</span>
            </div>
            <div class="card-prob" v-if="currentStatus?.geomagnetic?.minorProb">
              概率: {{ currentStatus.geomagnetic.minorProb }}%
            </div>
          </div>
        </div>

        <!-- 太阳耀斑等级 -->
        <div class="status-card" :class="getLevelClass(currentStatus?.solarFlare?.scale)">
          <div class="card-icon">
            <FireOutlined />
          </div>
          <div class="card-content">
            <div class="card-label">太阳耀斑等级</div>
            <div class="card-value">
              <span class="scale-value">S{{ currentStatus?.solarFlare?.scale || 0 }}</span>
              <span class="scale-text">{{ translateLevelText(currentStatus?.solarFlare?.text, currentStatus?.solarFlare?.scale) }}</span>
            </div>
            <div class="card-prob" v-if="currentStatus?.solarFlare?.minorProb">
              概率: {{ currentStatus.solarFlare.minorProb }}%
            </div>
          </div>
        </div>

        <!-- 辐射风暴等级 -->
        <div class="status-card" :class="getLevelClass(currentStatus?.radiation?.scale)">
          <div class="card-icon">
            <AlertOutlined />
          </div>
          <div class="card-content">
            <div class="card-label">辐射风暴等级</div>
            <div class="card-value">
              <span class="scale-value">R{{ currentStatus?.radiation?.scale || 0 }}</span>
              <span class="scale-text">{{ translateLevelText(currentStatus?.radiation?.text, currentStatus?.radiation?.scale) }}</span>
            </div>
            <div class="card-prob" v-if="currentStatus?.radiation?.minorProb">
              概率: {{ currentStatus.radiation.minorProb }}%
            </div>
          </div>
        </div>

        <!-- 太阳风速度 -->
        <div class="status-card solar-wind">
          <div class="card-icon">
            <DashboardOutlined />
          </div>
          <div class="card-content">
            <div class="card-label">太阳风速度</div>
            <div class="card-value">
              <span class="scale-value">{{ currentStatus?.solarWind?.speed || 0 }}</span>
              <span class="scale-unit">km/s</span>
            </div>
            <div class="card-time" v-if="currentStatus?.solarWind?.timeStamp">
              {{ formatTime(currentStatus.solarWind.timeStamp) }}
            </div>
          </div>
        </div>
      </div>

      <!-- X射线通量图表 -->
      <div class="chart-section">
        <div class="section-header">
          <LineChartOutlined />
          <span>X射线通量趋势 (最近6小时)</span>
          <a-tag v-if="currentFluxClass" :color="getFluxClassColor(currentFluxClass)">
            当前级别: {{ currentFluxClass }}级
          </a-tag>
        </div>
        <div class="chart-wrapper">
          <div v-if="chartLoading" class="chart-loading">
            <a-spin />
            <span>加载图表数据...</span>
          </div>
          <div v-if="chartError" class="chart-error">
            <WarningOutlined />
            <span>{{ chartError }}</span>
          </div>
          <div class="chart-container" ref="chartRef" v-show="!chartLoading && !chartError"></div>
        </div>
      </div>

      <!-- 预警列表 -->
      <div class="alerts-section">
        <div class="section-header">
          <AlertOutlined />
          <span>最新预警</span>
          <a-tag color="blue">{{ alerts.length }} 条</a-tag>
        </div>

        <div v-if="alertsLoading" class="alerts-loading">
          <a-spin />
        </div>

        <div v-else-if="alerts.length === 0" class="no-alerts">
          <CheckCircleOutlined />
          <span>当前无空间天气预警</span>
        </div>

        <div v-else class="alerts-list">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="alert-item"
            :class="getAlertClass(alert)"
            @click="showAlertDetail(alert)"
          >
            <div class="alert-header">
              <a-tag :color="getAlertColor(alert)">
                {{ getAlertTypeLabel(alert.type) }}
                <span v-if="alert.level > 0">{{ alert.level }}</span>
              </a-tag>
              <span class="alert-time">{{ formatTime(alert.issueTime) }}</span>
            </div>
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-summary">{{ getAlertSummary(alert) }}</div>
          </div>
        </div>
      </div>

      <!-- 等级说明 -->
      <div class="scale-info">
        <div class="section-header">
          <InfoCircleOutlined />
          <span>等级说明</span>
        </div>
        <div class="scale-tables">
          <div class="scale-table">
            <h4>地磁暴等级 (G)</h4>
            <div class="scale-items">
              <div class="scale-item"><span class="dot g1"></span>G1 - 微弱</div>
              <div class="scale-item"><span class="dot g2"></span>G2 - 中等</div>
              <div class="scale-item"><span class="dot g3"></span>G3 - 强烈</div>
              <div class="scale-item"><span class="dot g4"></span>G4 - 严重</div>
              <div class="scale-item"><span class="dot g5"></span>G5 - 极端</div>
            </div>
          </div>
          <div class="scale-table">
            <h4>太阳耀斑等级 (S)</h4>
            <div class="scale-items">
              <div class="scale-item"><span class="dot s1"></span>S1 - 微弱</div>
              <div class="scale-item"><span class="dot s2"></span>S2 - 中等</div>
              <div class="scale-item"><span class="dot s3"></span>S3 - 强烈</div>
              <div class="scale-item"><span class="dot s4"></span>S4 - 严重</div>
              <div class="scale-item"><span class="dot s5"></span>S5 - 极端</div>
            </div>
          </div>
          <div class="scale-table">
            <h4>辐射风暴等级 (R)</h4>
            <div class="scale-items">
              <div class="scale-item"><span class="dot r1"></span>R1 - 微弱</div>
              <div class="scale-item"><span class="dot r2"></span>R2 - 中等</div>
              <div class="scale-item"><span class="dot r3"></span>R3 - 强烈</div>
              <div class="scale-item"><span class="dot r4"></span>R4 - 严重</div>
              <div class="scale-item"><span class="dot r5"></span>R5 - 极端</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 预警详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      :title="selectedAlert?.title"
      :footer="null"
      width="700px"
      class="alert-detail-modal"
    >
      <div v-if="selectedAlert" class="alert-detail-content">
        <div class="detail-header">
          <a-tag :color="getAlertColor(selectedAlert)" size="large">
            {{ getAlertTypeLabel(selectedAlert.type) }}
            <span v-if="selectedAlert.level > 0">等级 {{ selectedAlert.level }}</span>
          </a-tag>
          <span class="detail-time">{{ formatTime(selectedAlert.issueTime) }}</span>
        </div>
        <div class="detail-section">
          <h4>预警概述</h4>
          <p>{{ getAlertSummary(selectedAlert) }}</p>
        </div>
        <div class="detail-section">
          <h4>详细信息</h4>
          <div class="detail-message">{{ selectedAlert.message }}</div>
        </div>
        <div class="detail-section" v-if="selectedAlert.level > 0">
          <h4>可能影响</h4>
          <ul class="impact-list">
            <li v-for="impact in getAlertImpacts(selectedAlert)" :key="impact">
              {{ impact }}
            </li>
          </ul>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  FireOutlined,
  AlertOutlined,
  DashboardOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import { spaceWeatherApi, type SpaceWeatherStatus, type SpaceWeatherAlert } from '@/api'

// 数据
const loading = ref(true)
const alertsLoading = ref(false)
const chartLoading = ref(false)
const chartError = ref('')
const currentStatus = ref<SpaceWeatherStatus | null>(null)
const alerts = ref<SpaceWeatherAlert[]>([])
const lastUpdate = ref('')
const chartRef = ref<HTMLElement | null>(null)
const currentFluxClass = ref('')
let chartInstance: echarts.ECharts | null = null
let refreshTimer: number | null = null

// 预警详情
const detailVisible = ref(false)
const selectedAlert = ref<SpaceWeatherAlert | null>(null)

// 翻译等级文本
const translateLevelText = (text: string, scale: number) => {
  if (!text || text === 'none' || scale === 0) {
    return '平静'
  }
  const translations: Record<string, string> = {
    'minor': '微弱',
    'moderate': '中等',
    'strong': '强烈',
    'severe': '严重',
    'extreme': '极端',
  }
  return translations[text.toLowerCase()] || text
}

// 获取耀斑等级颜色
const getFluxClassColor = (fluxClass: string) => {
  const colors: Record<string, string> = {
    'A': 'green',
    'B': 'lime',
    'C': 'gold',
    'M': 'orange',
    'X': 'red',
  }
  return colors[fluxClass] || 'default'
}

// 获取当前状态
const fetchCurrentStatus = async () => {
  try {
    const res = await spaceWeatherApi.getCurrentStatus()
    if (res.data.code === 0) {
      currentStatus.value = res.data.data
      lastUpdate.value = new Date().toLocaleString('zh-CN')
    }
  } catch (error) {
    console.error('Failed to fetch current status:', error)
  }
}

// 获取预警列表
const fetchAlerts = async () => {
  alertsLoading.value = true
  try {
    const res = await spaceWeatherApi.getAlerts(20)
    if (res.data.code === 0) {
      alerts.value = res.data.data.list
    }
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
  } finally {
    alertsLoading.value = false
  }
}

// 获取X射线通量数据并绘制图表
const fetchXrayFlux = async () => {
  chartLoading.value = true
  chartError.value = ''
  try {
    const res = await spaceWeatherApi.getXrayFlux(6)
    if (res.data.code === 0) {
      const data = res.data.data.data
      if (data && data.length > 0) {
        // 计算当前耀斑等级
        const lastFlux = data[data.length - 1]?.flux || 0
        currentFluxClass.value = getFluxClass(lastFlux)
        
        // 先关闭 loading，让容器渲染
        chartLoading.value = false
        
        // 等待 DOM 更新
        await nextTick()
        
        // 再等待一小段时间确保容器完全渲染
        setTimeout(() => {
          renderChart(data)
        }, 100)
      } else {
        chartError.value = '暂无数据'
        chartLoading.value = false
      }
    }
  } catch (error) {
    console.error('Failed to fetch X-ray flux:', error)
    chartError.value = '数据加载失败'
    chartLoading.value = false
  }
}

// 根据通量值判断耀斑等级
const getFluxClass = (flux: number): string => {
  if (flux >= 1e-4) return 'X'
  if (flux >= 1e-5) return 'M'
  if (flux >= 1e-6) return 'C'
  if (flux >= 1e-7) return 'B'
  return 'A'
}

// 渲染图表
const renderChart = (data: Array<{ time: string; flux: number }>) => {
  if (!chartRef.value) {
    console.warn('Chart container not ready, retrying...')
    // 容器未就绪，延迟重试
    setTimeout(() => renderChart(data), 200)
    return
  }

  // 销毁旧实例
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }

  try {
    chartInstance = echarts.init(chartRef.value)

    // 按时间排序并去重
  const timeMap = new Map<string, number>()
  data.forEach((d: { time: string; flux: number }) => {
    const time = d.time
    if (!timeMap.has(time) || d.flux > (timeMap.get(time) || 0)) {
      timeMap.set(time, d.flux)
    }
  })
  
  const sortedData = Array.from(timeMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-100) // 只取最近100个点

  const times = sortedData.map(([time]) => formatChartTime(time))
  const fluxes = sortedData.map(([, flux]) => flux)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      borderColor: '#3f3f46',
      textStyle: { color: '#f4f4f5' },
      formatter: (params: { axisValue: string; value: number }[]) => {
        const flux = params[0]?.value
        const fluxClass = getFluxClass(flux)
        return `${params[0].axisValue}<br/>通量: ${flux.toExponential(2)} W/m²<br/>等级: ${fluxClass}级`
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: '#3f3f46' } },
      axisLabel: { 
        color: '#a1a1aa', 
        fontSize: 10,
        rotate: 45,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'log',
      name: 'W/m²',
      nameTextStyle: { color: '#a1a1aa' },
      min: 1e-9,
      max: 1e-3,
      axisLine: { show: false },
      axisLabel: {
        color: '#a1a1aa',
        formatter: (value: number) => {
          if (value >= 1e-4) return '1e-4\n(X)'
          if (value >= 1e-5) return '1e-5\n(M)'
          if (value >= 1e-6) return '1e-6\n(C)'
          if (value >= 1e-7) return '1e-7\n(B)'
          if (value >= 1e-8) return '1e-8\n(A)'
          return ''
        },
      },
      splitLine: { lineStyle: { color: '#27272a' } },
    },
    series: [
      {
        type: 'line',
        data: fluxes,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#00d4ff',
          width: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
            { offset: 1, color: 'rgba(0, 212, 255, 0.05)' },
          ]),
        },
        markLine: {
          silent: true,
          symbol: 'none',
          label: {
            show: true,
            position: 'insideEndTop',
            color: '#a1a1aa',
            fontSize: 10,
          },
          data: [
            { 
              yAxis: 1e-8, 
              name: 'A',
              label: { formatter: 'A' },
              lineStyle: { color: '#22c55e', type: 'dashed' } 
            },
            { 
              yAxis: 1e-7, 
              name: 'B',
              label: { formatter: 'B' },
              lineStyle: { color: '#84cc16', type: 'dashed' } 
            },
            { 
              yAxis: 1e-6, 
              name: 'C',
              label: { formatter: 'C' },
              lineStyle: { color: '#eab308', type: 'dashed' } 
            },
            { 
              yAxis: 1e-5, 
              name: 'M',
              label: { formatter: 'M' },
              lineStyle: { color: '#f97316', type: 'dashed' } 
            },
            { 
              yAxis: 1e-4, 
              name: 'X',
              label: { formatter: 'X' },
              lineStyle: { color: '#ef4444', type: 'dashed' } 
            },
          ],
        },
      },
    ],
  }

  chartInstance.setOption(option)
  } catch (error) {
    console.error('Failed to render chart:', error)
    chartError.value = '图表渲染失败'
  }
}

// 格式化图表时间
const formatChartTime = (time: string) => {
  const date = new Date(time)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

// 获取等级样式类
const getLevelClass = (level: number) => {
  if (!level || level === 0) return 'level-0'
  if (level <= 2) return 'level-low'
  if (level <= 3) return 'level-medium'
  return 'level-high'
}

// 获取预警样式类
const getAlertClass = (alert: SpaceWeatherAlert) => {
  if (alert.level >= 4) return 'alert-critical'
  if (alert.level >= 2) return 'alert-warning'
  return 'alert-info'
}

// 获取预警颜色
const getAlertColor = (alert: SpaceWeatherAlert) => {
  if (alert.level >= 4) return 'red'
  if (alert.level >= 2) return 'orange'
  return 'blue'
}

// 获取预警类型标签
const getAlertTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    geomagnetic: '地磁暴',
    radiation: '辐射风暴',
    radio_blackout: '无线电中断',
    xray_flux: 'X射线通量',
    unknown: '其他',
  }
  return labels[type] || type
}

// 获取预警摘要（中文）
const getAlertSummary = (alert: SpaceWeatherAlert) => {
  const type = alert.type
  const level = alert.level
  
  const summaries: Record<string, Record<number, string>> = {
    geomagnetic: {
      1: '预计将发生G1级地磁暴，可能对电力系统产生轻微影响，高纬度地区可见极光。',
      2: '预计将发生G2级地磁暴，可能对电力系统产生影响，卫星运行可能受干扰。',
      3: '预计将发生G3级地磁暴，电力系统可能出现电压报警，卫星导航可能受影响。',
      4: '预计将发生G4级严重地磁暴，可能影响电网稳定性，卫星通信可能中断。',
      5: '预计将发生G5级极端地磁暴，电网可能出现广泛问题，卫星可能严重受损。',
    },
    radiation: {
      1: '预计将发生S1级辐射风暴，对宇航员有轻微辐射风险。',
      2: '预计将发生S2级辐射风暴，宇航员需采取防护措施。',
      3: '预计将发生S3级辐射风暴，宇航员必须进入防护舱。',
      4: '预计将发生S4级严重辐射风暴，卫星可能受损。',
      5: '预计将发生S5级极端辐射风暴，卫星将严重受损。',
    },
    radio_blackout: {
      1: '预计将发生R1级无线电中断，高频通信可能受影响。',
      2: '预计将发生R2级无线电中断，高频通信将受明显影响。',
      3: '预计将发生R3级无线电中断，高频通信将广泛中断。',
      4: '预计将发生R4级严重无线电中断，通信将严重受影响。',
      5: '预计将发生R5级极端无线电中断，高频通信将完全中断。',
    },
    xray_flux: {
      0: '太阳X射线通量监测，关注耀斑活动。',
    },
  }
  
  if (summaries[type] && summaries[type][level]) {
    return summaries[type][level]
  }
  
  return '空间天气预警，请关注后续信息。'
}

// 获取预警影响
const getAlertImpacts = (alert: SpaceWeatherAlert) => {
  const type = alert.type
  const level = alert.level
  
  const impacts: Record<string, Record<number, string[]>> = {
    geomagnetic: {
      1: ['高纬度地区可能看到极光', '电力系统轻微波动', '卫星表面充电增加'],
      2: ['极光范围扩大到中纬度', '电力系统电压波动', '卫星运行受轻微干扰', 'GPS精度下降'],
      3: ['极光可见范围大幅扩大', '电力系统需要保护措施', '卫星导航受影响', '无线电通信受干扰'],
      4: ['低纬度地区可能看到极光', '电网可能出现电压问题', '卫星通信中断', 'GPS导航失效'],
      5: ['全球范围可见极光', '电网可能出现广泛故障', '卫星严重受损', '无线电通信完全中断'],
    },
    radiation: {
      1: ['宇航员辐射风险轻微增加', '高空飞行辐射增加'],
      2: ['宇航员需限制舱外活动', '高空飞行辐射明显增加'],
      3: ['宇航员必须进入防护舱', '卫星太阳能电池受损', '高空飞行辐射危险'],
      4: ['宇航员辐射危险', '卫星电子设备可能故障', '高空飞行禁止'],
      5: ['宇航员生命危险', '卫星将严重受损', '高空飞行极度危险'],
    },
    radio_blackout: {
      1: ['高频通信轻微受影响', '低频导航信号减弱'],
      2: ['高频通信受明显影响', '跨极地航班通信受影响'],
      3: ['高频通信广泛中断', '低频导航受影响', '跨极地航班改道'],
      4: ['高频通信严重中断', '卫星通信受影响', '航空通信困难'],
      5: ['高频通信完全中断', '卫星通信中断', '航空通信中断'],
    },
  }
  
  if (impacts[type] && impacts[type][level]) {
    return impacts[type][level]
  }
  
  return ['请关注官方发布的最新信息']
}

// 显示预警详情
const showAlertDetail = (alert: SpaceWeatherAlert) => {
  selectedAlert.value = alert
  detailVisible.value = true
}

// 初始化
onMounted(async () => {
  loading.value = true
  await Promise.all([fetchCurrentStatus(), fetchAlerts(), fetchXrayFlux()])
  loading.value = false

  // 每5分钟刷新一次
  refreshTimer = window.setInterval(() => {
    fetchCurrentStatus()
    fetchAlerts()
    fetchXrayFlux()
  }, 5 * 60 * 1000)

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 处理窗口大小变化
const handleResize = () => {
  chartInstance?.resize()
}

// 清理
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  chartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.space-weather-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #27272a;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 36px;
  color: #00d4ff;
}

.header-text h1 {
  margin: 0;
  font-size: 24px;
  color: #f4f4f5;
}

.header-text p {
  margin: 4px 0 0;
  color: #71717a;
  font-size: 14px;
}

.update-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #71717a;
  font-size: 14px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  color: #71717a;
}

.loading-container p {
  margin-top: 16px;
}

/* 状态卡片 */
.status-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.status-card {
  background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #3f3f46;
  transition: all 0.3s ease;
  cursor: default;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.status-card.level-0 {
  border-color: #3f3f46;
}

.status-card.level-low {
  border-color: #22c55e;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
}

.status-card.level-medium {
  border-color: #f59e0b;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
}

.status-card.level-high {
  border-color: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.status-card.solar-wind {
  border-color: #00d4ff;
}

.card-icon {
  font-size: 32px;
  color: #00d4ff;
}

.status-card.level-low .card-icon {
  color: #22c55e;
}

.status-card.level-medium .card-icon {
  color: #f59e0b;
}

.status-card.level-high .card-icon {
  color: #ef4444;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 12px;
  color: #71717a;
  margin-bottom: 4px;
}

.card-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.scale-value {
  font-size: 28px;
  font-weight: 700;
  color: #f4f4f5;
}

.scale-text {
  font-size: 14px;
  color: #a1a1aa;
}

.scale-unit {
  font-size: 14px;
  color: #a1a1aa;
}

.card-prob,
.card-time {
  font-size: 12px;
  color: #71717a;
  margin-top: 4px;
}

/* 图表区域 */
.chart-section {
  background: #18181b;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #27272a;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #f4f4f5;
}

.chart-loading,
.chart-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #71717a;
  gap: 8px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

/* 预警列表 */
.alerts-section {
  background: #18181b;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #27272a;
}

.alerts-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #22c55e;
  gap: 8px;
}

.no-alerts span {
  font-size: 14px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  background: #27272a;
  border-radius: 8px;
  padding: 16px;
  border-left: 3px solid #3f3f46;
  cursor: pointer;
  transition: all 0.2s ease;
}

.alert-item:hover {
  background: #3f3f46;
}

.alert-item.alert-info {
  border-left-color: #3b82f6;
}

.alert-item.alert-warning {
  border-left-color: #f59e0b;
}

.alert-item.alert-critical {
  border-left-color: #ef4444;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-time {
  font-size: 12px;
  color: #71717a;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
  color: #f4f4f5;
  margin-bottom: 8px;
}

.alert-summary {
  font-size: 13px;
  color: #a1a1aa;
  line-height: 1.5;
}

/* 等级说明 */
.scale-info {
  background: #18181b;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #27272a;
}

.scale-tables {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.scale-table h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #f4f4f5;
}

.scale-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scale-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #a1a1aa;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.g1, .dot.s1, .dot.r1 { background: #22c55e; }
.dot.g2, .dot.s2, .dot.r2 { background: #84cc16; }
.dot.g3, .dot.s3, .dot.r3 { background: #f59e0b; }
.dot.g4, .dot.s4, .dot.r4 { background: #f97316; }
.dot.g5, .dot.s5, .dot.r5 { background: #ef4444; }

/* 预警详情弹窗 */
.alert-detail-content {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #27272a;
}

.detail-time {
  color: #71717a;
  font-size: 14px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #f4f4f5;
}

.detail-section p {
  margin: 0;
  color: #a1a1aa;
  line-height: 1.6;
}

.detail-message {
  background: #27272a;
  border-radius: 8px;
  padding: 16px;
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.impact-list {
  margin: 0;
  padding-left: 20px;
  color: #a1a1aa;
}

.impact-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 1200px) {
  .status-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .scale-tables {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .space-weather-view {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .status-cards {
    grid-template-columns: 1fr;
  }
  .scale-tables {
    grid-template-columns: 1fr;
  }
}
</style>