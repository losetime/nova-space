<template>
  <div class="satellite-view">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载卫星数据...</p>
      </div>
    </div>

    <!-- 浮动状态指示器 -->
    <div v-show="!loading" class="floating-stats">
      <div class="stat-card">
        <div class="stat-icon satellites">
          <GlobalOutlined />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ satelliteCount }}</span>
          <span class="stat-label">在轨卫星</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon connection" :class="{ connected: status === '已连接' }">
          <ThunderboltOutlined />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ status }}</span>
          <span class="stat-label">数据链路</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon time">
          <ClockCircleOutlined />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ lastUpdate }}</span>
          <span class="stat-label">最后更新</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-area">
      <!-- 左侧面板 - 可折叠 -->
      <transition name="slide-left">
        <aside v-if="activeLeftPanel === 'satellite-list'" class="sidebar">
          <div class="sidebar-header">
            <div class="header-title">
              <ThunderboltOutlined class="title-icon" />
              <span>卫星列表</span>
            </div>
            <a-button type="text" class="close-btn" @click="toggleLeftPanel('satellite-list')">
              <CloseOutlined />
            </a-button>
          </div>
          <SatelliteList
            :satellites="filteredSatellites"
            :selected-satellite="selectedSatellite"
            @select-satellite="handleSelectSatellite"
          />
        </aside>
      </transition>

      <!-- 左侧筛选面板 -->
      <transition name="slide-left">
        <aside v-if="activeLeftPanel === 'filter'" class="sidebar filter-panel">
          <div class="sidebar-header">
            <div class="header-title">
              <FilterOutlined class="title-icon" />
              <span>筛选</span>
            </div>
            <a-button type="text" class="close-btn" @click="toggleLeftPanel('filter')">
              <CloseOutlined />
            </a-button>
          </div>
          <div class="filter-content">
            <!-- 国家筛选 -->
            <div class="filter-section">
              <div class="filter-section-header" @click="toggleFilterSection('country')">
                <span class="section-title">
                  国家/地区
                  <span class="selected-tag">{{ getCountryLabel(selectedCountry) }}</span>
                </span>
                <DownOutlined :class="['expand-icon', { expanded: expandedSections.country }]" />
              </div>
              <transition name="collapse">
                <div v-show="expandedSections.country" class="filter-options country-options">
                  <div class="filter-search">
                    <input
                      v-model="countrySearch"
                      type="text"
                      placeholder="搜索国家..."
                      class="country-search-input"
                    />
                  </div>
                  <div
                    class="filter-option"
                    :class="{ active: !selectedCountry }"
                    @click="selectedCountry = ''"
                  >
                    <GlobalOutlined class="option-icon" />
                    <span>全部</span>
                  </div>
                  <div
                    v-for="country in filteredCountries"
                    :key="country.code"
                    class="filter-option"
                    :class="{ active: selectedCountry === country.code }"
                    @click="selectedCountry = country.code"
                  >
                    <FlagOutlined class="option-icon" />
                    <span class="country-name">{{ getCountryName(country.code) }}({{ country.code }})</span>
                    <span class="country-count">{{ country.count }}</span>
                  </div>
                  <div v-if="filteredCountries.length === 0 && countrySearch" class="no-result">
                    未找到匹配的国家
                  </div>
                  <div v-if="countries.length === 0 && !countrySearch" class="no-result">
                    暂无国家数据
                  </div>
                </div>
              </transition>
            </div>

            <!-- 轨道类型筛选 -->
            <div class="filter-section">
              <div class="filter-section-header" @click="toggleFilterSection('orbit')">
                <span class="section-title">
                  轨道类型
                  <span class="selected-tag">{{ getOrbitTypeLabel(filterType) }}</span>
                </span>
                <DownOutlined :class="['expand-icon', { expanded: expandedSections.orbit }]" />
              </div>
              <transition name="collapse">
                <div v-show="expandedSections.orbit" class="filter-options">
                  <div
                    class="filter-option"
                    :class="{ active: filterType === 'all' }"
                    @click="filterType = 'all'"
                  >
                    <GlobalOutlined class="option-icon" />
                    <span>全部轨道</span>
                  </div>
                  <div
                    class="filter-option"
                    :class="{ active: filterType === 'leo' }"
                    @click="filterType = 'leo'"
                  >
                    <RocketOutlined class="option-icon leo" />
                    <span>低轨 (LEO)</span>
                  </div>
                  <div
                    class="filter-option"
                    :class="{ active: filterType === 'meo' }"
                    @click="filterType = 'meo'"
                  >
                    <RocketOutlined class="option-icon meo" />
                    <span>中轨 (MEO)</span>
                  </div>
                  <div
                    class="filter-option"
                    :class="{ active: filterType === 'geo' }"
                    @click="filterType = 'geo'"
                  >
                    <RocketOutlined class="option-icon geo" />
                    <span>地球同步 (GEO)</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </aside>
      </transition>

      <!-- 中央可视化区 -->
      <div class="visualization-area">
        <div id="cesium-container" class="cesium-container"></div>

        <!-- 底部功能栏 -->
        <div class="bottom-toolbar">
          <div class="toolbar-inner">
            <div
              class="tool-btn"
              :class="{ active: activeLeftPanel === 'filter' }"
              @click="toggleLeftPanel('filter')"
            >
              <FilterOutlined class="tool-icon" />
              <span class="tool-text">筛选</span>
            </div>
            <div
              class="tool-btn"
              :class="{ active: activeLeftPanel === 'satellite-list' }"
              @click="toggleLeftPanel('satellite-list')"
            >
              <UnorderedListOutlined class="tool-icon" />
              <span class="tool-text">卫星列表</span>
            </div>
            <div
              class="tool-btn"
              :class="{ active: activeRightPanel === 'orbit' }"
              @click="toggleRightPanel('orbit')"
            >
              <RocketOutlined class="tool-icon" />
              <span class="tool-text">轨道预测</span>
            </div>
            <div
              class="tool-btn"
              :class="{ active: activeRightPanel === 'transit' }"
              @click="toggleRightPanel('transit')"
            >
              <EyeOutlined class="tool-icon" />
              <span class="tool-text">过境预测</span>
            </div>
            <div class="tool-divider"></div>
            <a-tooltip title="刷新数据">
              <div class="tool-btn icon-only" @click="handleRefresh">
                <ReloadOutlined class="tool-icon" />
              </div>
            </a-tooltip>
            <a-tooltip title="全屏模式">
              <div class="tool-btn icon-only">
                <FullscreenOutlined class="tool-icon" />
              </div>
            </a-tooltip>
          </div>
        </div>
      </div>

      <!-- 右侧面板 - 可折叠 -->
      <transition name="slide-right">
        <aside v-if="activeRightPanel !== 'none'" class="detail-sidebar">
          <div class="sidebar-header">
            <div class="header-title">
              <component :is="getRightPanelIcon()" class="title-icon" />
              <span>{{ getRightPanelTitle() }}</span>
            </div>
            <a-button type="text" class="close-btn" @click="toggleRightPanel(activeRightPanel)">
              <CloseOutlined />
            </a-button>
          </div>

          <!-- 卫星详情 -->
          <SatelliteDetail
            v-if="activeRightPanel === 'detail'"
            :satellite="selectedSatellite"
          />

          <!-- 轨道预测 -->
          <div v-else-if="activeRightPanel === 'orbit'" class="panel-content">
            <OrbitPrediction
              ref="orbitPredictionRef"
              :satellite="selectedSatellite"
              @show-orbit="handleShowPredictedOrbit"
              @fly-to="handleFlyToPosition"
              @clear-orbit="handleClearOrbit"
            />
          </div>

          <!-- 过境预测 -->
          <div v-else-if="activeRightPanel === 'transit'" class="panel-content">
            <PassPrediction
              ref="passPredictionRef"
              :satellite="selectedSatellite"
            />
          </div>
        </aside>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import {
  GlobalOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  UnorderedListOutlined,
  RocketOutlined,
  EyeOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  DownOutlined,
  FlagOutlined
} from '@ant-design/icons-vue'
import SatelliteList from '@/components/SatelliteList.vue'
import SatelliteDetail from '@/components/SatelliteDetail.vue'
import OrbitPrediction from '@/components/OrbitPrediction.vue'
import PassPrediction from '@/components/PassPrediction.vue'
import { useCesium } from '@/hooks/useCesium'
import { useWebSocket } from '@/hooks/useWebSocket'
import { usePanel } from '@/hooks/usePanel'
import { useSatellite } from '@/hooks/useSatellite'
import { satelliteApi } from '@/api'

const filterType = ref('all')
const selectedCountry = ref('')
const loading = ref(true)

// 可折叠筛选区域状态
const expandedSections = ref({
  country: false,
  orbit: false
})

// 国家列表
const countries = ref<{ code: string; count: number }[]>([])
const countrySearch = ref('')

// 过滤后的国家列表
const filteredCountries = computed(() => {
  if (!countrySearch.value) return countries.value
  const search = countrySearch.value.toLowerCase()
  return countries.value.filter(c => {
    const codeMatch = c.code.toLowerCase().includes(search)
    const nameMatch = getCountryName(c.code).includes(countrySearch.value)
    return codeMatch || nameMatch
  })
})

// 国家代码到中文名称的映射
const COUNTRY_NAMES: Record<string, string> = {
  US: '美国',
  CIS: '俄罗斯',
  PRC: '中国',
  CN: '中国',
  JP: '日本',
  IN: '印度',
  FR: '法国',
  GB: '英国',
  UK: '英国',
  DE: '德国',
  CA: '加拿大',
  IT: '意大利',
  AU: '澳大利亚',
  ES: '西班牙',
  KR: '韩国',
  BR: '巴西',
  IL: '以色列',
  TW: '中国台湾',
  AR: '阿根廷',
  MX: '墨西哥',
  SA: '沙特阿拉伯',
  ID: '印度尼西亚',
  TR: '土耳其',
  NL: '荷兰',
  TH: '泰国',
  ZA: '南非',
  UA: '乌克兰',
  SG: '新加坡',
  PL: '波兰',
  SE: '瑞典',
  NO: '挪威',
  BEL: '比利时',
  MY: '马来西亚',
  PK: '巴基斯坦',
  PHI: '菲律宾',
  VEN: '委内瑞拉',
  CHB: '瑞士',
  DEN: '丹麦',
  EGY: '埃及',
  FIN: '芬兰',
  GRE: '希腊',
  IRA: '伊朗',
  IRAQ: '伊拉克',
  KAZ: '哈萨克斯坦',
  KWT: '科威特',
  MAL: '马来西亚',
  NIG: '尼日利亚',
  PER: '秘鲁',
  POR: '葡萄牙',
  ROM: '罗马尼亚',
  TUN: '突尼斯',
  UAE: '阿联酋',
  CZ: '捷克',
  HUN: '匈牙利',
  LUX: '卢森堡',
  NZ: '新西兰',
  NOR: '挪威',
  POL: '波兰',
  PORT: '葡萄牙',
  RUS: '俄罗斯',
  SPN: '西班牙',
  SWZ: '瑞典',
  TURK: '土耳其',
  AUS: '奥地利',
  BUL: '保加利亚',
  CHL: '智利',
  COL: '哥伦比亚',
  CZE: '捷克',
  EST: '爱沙尼亚',
  GER: '德国',
  IND: '印度尼西亚',
  IRE: '爱尔兰',
  LAT: '拉脱维亚',
  LTU: '立陶宛',
  MEX: '墨西哥',
  MOR: '摩洛哥',
  NETH: '荷兰',
  PAK: '巴基斯坦',
  PRY: '巴拉圭',
  SIN: '新加坡',
  SLV: '斯洛伐克',
  SVN: '斯洛文尼亚',
  URY: '乌拉圭',
  VNM: '越南',
  // 常见补充
  RU: '俄罗斯',
  CH: '瑞士',
  AT: '奥地利',
  BE: '比利时',
  DK: '丹麦',
  FI: '芬兰',
  GR: '希腊',
  IE: '爱尔兰',
  PT: '葡萄牙',
  CZSK: '捷克斯洛伐克',
  SU: '苏联',
  TBD: '待定',
  F: '法国',
  I: '意大利',
  J: '日本',
  TB: '英国',
  ITAL: '意大利',
  FRAN: '法国',
  JPN: '日本',
  GERM: '德国',
  USAA: '美国',
  ASC: '美属萨摩亚',
  BGD: '孟加拉国',
}

// 获取国家中文名称
const getCountryName = (code: string): string => {
  return COUNTRY_NAMES[code] || code
}

// 轨道类型标签（与列表格式一致）
const getOrbitTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    all: '全部',
    leo: '低轨(LEO)',
    meo: '中轨(MEO)',
    geo: '地球同步(GEO)'
  }
  return labels[type] || ''
}

// 获取国家选择标签（格式与列表一致，包含卫星数量）
const getCountryLabel = (code: string): string => {
  if (!code) return '全部'
  const country = countries.value.find(c => c.code === code)
  const count = country ? country.count : 0
  return `${getCountryName(code)}(${code})  ${count}`
}

// 切换筛选区域展开/折叠（同时关闭其他区域）
const toggleFilterSection = (section: 'orbit' | 'country') => {
  // 如果当前区域是折叠状态，则展开它并关闭其他区域
  if (!expandedSections.value[section]) {
    expandedSections.value.orbit = section === 'orbit'
    expandedSections.value.country = section === 'country'
  } else {
    // 如果当前区域是展开状态，则折叠它
    expandedSections.value[section] = false
  }
}

// 初始化 hooks
const cesium = useCesium()
const websocket = useWebSocket()
const {
  activeLeftPanel,
  activeRightPanel,
  toggleLeftPanel,
  toggleRightPanel,
  showSatelliteDetail
} = usePanel()

// 解构 websocket 数据
const { status, satellites, satelliteCount, lastUpdate } = websocket

// 卫星元数据映射
const satelliteMetadata = ref<Map<string, { countryCode?: string }>>(new Map())

// 筛选后的卫星列表
const filteredSatellites = computed(() => {
  let result = satellites.value

  // 按轨道类型筛选
  if (filterType.value !== 'all') {
    result = result.filter(sat => {
      const alt = sat.position.alt
      if (filterType.value === 'leo') return alt < 2000
      if (filterType.value === 'meo') return alt >= 2000 && alt < 35000
      if (filterType.value === 'geo') return alt >= 35000
      return true
    })
  }

  // 按国家筛选
  if (selectedCountry.value) {
    console.log('=== 国家筛选调试 ===')
    console.log('选择的国家代码:', selectedCountry.value)
    console.log('筛选前卫星数:', result.length)
    console.log('元数据 Map 大小:', satelliteMetadata.value.size)

    // 打印前3个卫星的 noradId
    console.log('前3个卫星 noradId:', result.slice(0, 3).map(s => s.noradId))

    // 打印元数据中的前3个 key
    const metaKeys = Array.from(satelliteMetadata.value.keys()).slice(0, 3)
    console.log('元数据前3个 key:', metaKeys)

    let matchedCount = 0
    let noMetadataCount = 0
    let countryCodeMismatchCount = 0

    result = result.filter(sat => {
      const meta = satelliteMetadata.value.get(sat.noradId)
      if (!meta) {
        noMetadataCount++
        return false
      }
      if (meta.countryCode === selectedCountry.value) {
        matchedCount++
        return true
      }
      countryCodeMismatchCount++
      return false
    })

    console.log('匹配成功:', matchedCount)
    console.log('无元数据:', noMetadataCount)
    console.log('国家代码不匹配:', countryCodeMismatchCount)
    console.log('筛选后卫星数:', result.length)
  }

  return result
})

// 卫星选择逻辑
const { selectedSatellite, handleSelectSatellite: baseHandleSelectSatellite } = useSatellite(cesium, websocket)

// 子组件引用
const orbitPredictionRef = ref<InstanceType<typeof OrbitPrediction> | null>(null)
const passPredictionRef = ref<InstanceType<typeof PassPrediction> | null>(null)

// 获取右侧面板标题
const getRightPanelTitle = () => {
  switch (activeRightPanel.value) {
    case 'detail':
      return '卫星详情'
    case 'orbit':
      return '轨道预测'
    case 'transit':
      return '过境预测'
    default:
      return ''
  }
}

// 获取右侧面板图标
const getRightPanelIcon = () => {
  switch (activeRightPanel.value) {
    case 'detail':
      return InfoCircleOutlined
    case 'orbit':
      return RocketOutlined
    case 'transit':
      return EyeOutlined
    default:
      return InfoCircleOutlined
  }
}

// 选择卫星后显示详情
const handleSelectSatellite = (satellite: typeof selectedSatellite.value) => {
  baseHandleSelectSatellite(satellite)
  showSatelliteDetail()
}

// 显示预测轨道
const handleShowPredictedOrbit = (points: Array<{ lat: number; lng: number; alt: number }>) => {
  if (cesium && selectedSatellite.value) {
    cesium.showPredictedOrbit(selectedSatellite.value.noradId, points)
  }
}

// 飞到指定位置
const handleFlyToPosition = (position: { lat: number; lng: number; alt: number }) => {
  if (cesium) {
    cesium.flyToPosition(position)
  }
}

// 清除预测轨道
const handleClearOrbit = (noradId: string) => {
  if (cesium && noradId) {
    cesium.clearPredictedOrbit(noradId)
  }
}

// 监听筛选后的卫星数据变化，更新 Cesium（使用批量更新提高性能）
watch(filteredSatellites, (newSatellites) => {
  if (newSatellites && newSatellites.length > 0) {
    // 使用批量更新替代逐个更新，大幅提升性能
    cesium.updateSatellites(newSatellites)
  } else {
    // 当筛选结果为空时，清除所有卫星
    cesium.clearAllSatellites?.()
  }
}, { deep: true })

// 延迟初始化 - 先渲染页面，再加载数据
onMounted(async () => {
  // 使用 requestAnimationFrame 确保 DOM 已渲染
  requestAnimationFrame(() => {
    // 初始化 Cesium
    cesium.initCesium()

    // 初始化 WebSocket
    websocket.connect()

    // 延迟获取一次 HTTP 数据作为备份
    setTimeout(() => {
      websocket.fetchSatellites()
    }, 1000)

    // 延迟隐藏 loading，确保 Cesium 渲染完成
    setTimeout(() => {
      loading.value = false
    }, 300)
  })

  // 加载国家列表
  try {
    const res = await satelliteApi.getCountries()
    if (res.data.code === 0) {
      countries.value = res.data.data || []
    }
  } catch (err) {
    console.error('加载国家列表失败:', err)
  }

  // 加载卫星元数据
  try {
    console.log('开始加载卫星元数据...')
    const metaRes = await satelliteApi.getAllMetadata()
    console.log('元数据响应:', metaRes.data.code, '数据条数:', metaRes.data.data?.length)
    if (metaRes.data.code === 0 && metaRes.data.data) {
      const map = new Map<string, { countryCode?: string }>()
      metaRes.data.data.forEach((item: { noradId: string; countryCode?: string }) => {
        map.set(item.noradId, { countryCode: item.countryCode })
      })
      satelliteMetadata.value = map
      console.log('元数据加载成功，Map 大小:', map.size)
      // 打印前3条数据
      console.log('前3条元数据:', metaRes.data.data.slice(0, 3))
    } else {
      console.error('元数据响应异常:', metaRes.data)
    }
  } catch (err) {
    console.error('加载卫星元数据失败:', err)
  }
})

const handleRefresh = () => {
  // 刷新数据
  websocket.connect()
}
</script>

<style scoped lang="scss">
.satellite-view {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background: #0a0a0f;
  position: relative;
  overflow: hidden;
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
  border: 3px solid rgba(0, 212, 255, 0.2);
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin: 0;
}

// 浮动状态指示器
.floating-stats {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  z-index: 100;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(15, 15, 25, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(0, 212, 255, 0.25);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5),
                0 0 30px rgba(0, 212, 255, 0.1);
  }

  .stat-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 18px;
    transition: all 0.3s;

    &.satellites {
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 212, 255, 0.05) 100%);
      color: #00d4ff;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
    }

    &.connection {
      background: linear-gradient(135deg, rgba(255, 77, 77, 0.15) 0%, rgba(255, 77, 77, 0.05) 100%);
      color: #ff4d4d;

      &.connected {
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 255, 136, 0.05) 100%);
        color: #00ff88;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
        animation: pulse-glow 2s ease-in-out infinite;
      }
    }

    &.time {
      background: linear-gradient(135deg, rgba(123, 44, 191, 0.15) 0%, rgba(123, 44, 191, 0.05) 100%);
      color: #7b2cbf;
    }

    &.filter {
      background: linear-gradient(135deg, rgba(255, 170, 0, 0.15) 0%, rgba(255, 170, 0, 0.05) 100%);
      color: #ffaa00;
    }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .stat-value {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.5px;
    }

    .stat-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.45);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 255, 136, 0.4);
  }
}

// 主内容区
.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

// 侧边栏通用样式 - 绝对定位
.sidebar, .detail-sidebar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 320px;
  background: rgba(12, 12, 20, 0.95);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.sidebar {
  left: 0;
  border-right: 1px solid rgba(0, 212, 255, 0.08);
}

.detail-sidebar {
  right: 0;
  border-left: 1px solid rgba(0, 212, 255, 0.08);
}

.sidebar-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 212, 255, 0.08);
  flex-shrink: 0;

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;

    .title-icon {
      font-size: 16px;
      color: #00d4ff;
    }
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 77, 77, 0.1);
      color: #ff4d4d;
    }
  }
}

// 面板内容
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.15);
    border-radius: 2px;
  }
}

// 可视化区域
.visualization-area {
  flex: 1;
  position: relative;
  background: radial-gradient(ellipse at center, #0f1628 0%, #0a0a0f 70%);
}

.cesium-container {
  position: absolute;
  inset: 0;

  // 隐藏 Cesium 底部信息栏
  :deep(.cesium-viewer-bottom) {
    display: none !important;
  }

  :deep(.cesium-widget-credits) {
    display: none !important;
  }

  :deep(.cesium-credit-logoContainer) {
    display: none !important;
  }

  :deep(.cesium-credit-textContainer) {
    display: none !important;
  }

  // 隐藏 Cesium 右侧工具栏（包含搜索按钮）
  :deep(.cesium-viewer-toolbar) {
    display: none !important;
  }

  :deep(.cesium-toolbar-button) {
    display: none !important;
  }

  // 隐藏地理编码器/搜索框
  :deep(.cesium-geocoder) {
    display: none !important;
  }

  :deep(.cesium-geocoder-input) {
    display: none !important;
  }

  // 隐藏所有 Cesium 按钮
  :deep(.cesium-button) {
    display: none !important;
  }
}

// 底部功能栏
.bottom-toolbar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.toolbar-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(15, 15, 25, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.6);

  &:hover {
    background: rgba(0, 212, 255, 0.1);
    color: #00d4ff;
  }

  &.active {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%);
    color: #00d4ff;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
  }

  &.icon-only {
    padding: 10px;
  }

  .tool-icon {
    font-size: 16px;
  }

  .tool-text {
    font-size: 13px;
    font-weight: 500;
  }
}

.tool-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 8px;
}

// 筛选面板样式
.filter-panel {
  .filter-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .filter-section {
    margin-bottom: 8px;
    background: rgba(0, 212, 255, 0.02);
    border: 1px solid rgba(0, 212, 255, 0.06);
    border-radius: 12px;
    overflow: hidden;
  }

  .filter-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 212, 255, 0.04);
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.85);
      display: flex;
      align-items: center;
      gap: 8px;

      .selected-tag {
        font-size: 11px;
        font-weight: 500;
        color: #00d4ff;
        background: rgba(0, 212, 255, 0.15);
        padding: 2px 8px;
        border-radius: 6px;
      }
    }

    .expand-icon {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      transition: transform 0.3s ease;

      &.expanded {
        transform: rotate(180deg);
      }
    }
  }

  .filter-options {
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: rgba(0, 212, 255, 0.02);
    border: 1px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.65);
    font-size: 13px;

    &:hover {
      background: rgba(0, 212, 255, 0.06);
      border-color: rgba(0, 212, 255, 0.1);
    }

    &.active {
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(0, 212, 255, 0.06) 100%);
      border-color: rgba(0, 212, 255, 0.25);
      color: #00d4ff;
    }

    .option-icon {
      font-size: 15px;
      color: rgba(0, 212, 255, 0.6);

      &.leo { color: #00ff88; }
      &.meo { color: #00d4ff; }
      &.geo { color: #b366e8; }
    }

    .country-name {
      flex: 1;
    }

    .country-count {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }

  // 国家搜索
  .country-options {
    .filter-search {
      padding: 0 0 8px;
    }

    .country-search-input {
      width: 100%;
      padding: 8px 12px;
      background: rgba(0, 212, 255, 0.04);
      border: 1px solid rgba(0, 212, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 12px;
      outline: none;
      transition: all 0.2s;

      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }

      &:focus {
        border-color: rgba(0, 212, 255, 0.3);
        background: rgba(0, 212, 255, 0.06);
      }
    }

    .no-result {
      text-align: center;
      padding: 16px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
    }
  }
}

// 折叠动画
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 500px;
}

// 过渡动画
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.35s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.35s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>