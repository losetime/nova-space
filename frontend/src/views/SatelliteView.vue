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
      <!-- 左侧卫星列表 - 可折叠 -->
      <transition name="slide-left">
        <aside v-if="leftPanelVisible" class="sidebar">
          <div class="sidebar-header">
            <div class="header-title">
              <ThunderboltOutlined class="title-icon" />
              <span>卫星列表</span>
            </div>
            <a-button type="text" class="collapse-btn" @click="toggleLeftPanel">
              <LeftOutlined />
            </a-button>
          </div>
          <SatelliteList
            :satellites="satellites"
            :selected-satellite="selectedSatellite"
            @select-satellite="handleSelectSatellite"
          />
        </aside>
      </transition>

      <!-- 左侧展开按钮 -->
      <transition name="fade">
        <div v-if="!leftPanelVisible" class="panel-trigger left" @click="toggleLeftPanel">
          <RightOutlined />
          <span>卫星列表</span>
        </div>
      </transition>

      <!-- 中央可视化区 -->
      <div class="visualization-area">
        <div id="cesium-container" class="cesium-container"></div>
        
        <!-- 底部控制栏 -->
        <div class="bottom-controls">
          <div class="control-group">
            <a-select v-model:value="filterType" class="filter-select" size="small">
              <a-select-option value="all">全部轨道</a-select-option>
              <a-select-option value="leo">低轨 (LEO)</a-select-option>
              <a-select-option value="meo">中轨 (MEO)</a-select-option>
              <a-select-option value="geo">地球同步 (GEO)</a-select-option>
            </a-select>
          </div>
          <div class="control-group right">
            <a-tooltip title="刷新数据">
              <a-button type="text" class="control-btn" @click="handleRefresh">
                <ReloadOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="全屏模式">
              <a-button type="text" class="control-btn">
                <FullscreenOutlined />
              </a-button>
            </a-tooltip>
          </div>
        </div>
      </div>

      <!-- 右侧展开按钮 -->
      <transition name="fade">
        <div v-if="!rightPanelVisible" class="panel-trigger right" @click="toggleRightPanel">
          <span>详情</span>
          <LeftOutlined />
        </div>
      </transition>

      <!-- 右侧卫星详情 - 可折叠 -->
      <transition name="slide-right">
        <aside v-if="rightPanelVisible" class="detail-sidebar">
          <div class="sidebar-header">
            <div class="header-title">
              <InfoCircleOutlined class="title-icon" />
              <span>卫星详情</span>
            </div>
            <a-button type="text" class="collapse-btn" @click="toggleRightPanel">
              <RightOutlined />
            </a-button>
          </div>
          <SatelliteDetail :satellite="selectedSatellite" />
        </aside>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  GlobalOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import SatelliteList from '@/components/SatelliteList.vue'
import SatelliteDetail from '@/components/SatelliteDetail.vue'
import { useCesium } from '@/hooks/useCesium'
import { useWebSocket } from '@/hooks/useWebSocket'
import { usePanel } from '@/hooks/usePanel'
import { useSatellite } from '@/hooks/useSatellite'

const filterType = ref('all')
const loading = ref(true)

// 初始化 hooks
const cesium = useCesium()
const websocket = useWebSocket()
const { leftPanelVisible, rightPanelVisible, toggleLeftPanel, toggleRightPanel } = usePanel()

// 解构 websocket 数据
const { status, satellites, satelliteCount, lastUpdate } = websocket

// 卫星选择逻辑
const { selectedSatellite, handleSelectSatellite } = useSatellite(cesium, websocket)

// 监听卫星数据变化，更新 Cesium
watch(satellites, (newSatellites) => {
  if (newSatellites && newSatellites.length > 0) {
    newSatellites.forEach(satellite => {
      cesium.updateSatellitePosition(satellite)
    })

    // 清理不存在的卫星
    const currentIds = newSatellites.map(s => s.noradId)
    cesium.cleanupSatellites(currentIds)
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

// 侧边栏通用样式
.sidebar, .detail-sidebar {
  width: 320px;
  background: rgba(12, 12, 20, 0.8);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(0, 212, 255, 0.08);

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

    .collapse-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      transition: all 0.2s;

      &:hover {
        background: rgba(0, 212, 255, 0.1);
        color: #00d4ff;
      }
    }
  }
}

.detail-sidebar {
  border-right: none;
  border-left: 1px solid rgba(0, 212, 255, 0.08);
}

// 面板触发器
.panel-trigger {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;

  &.left {
    left: 0;
    border-radius: 0 12px 12px 0;
    border-left: none;
  }

  &.right {
    right: 0;
    border-radius: 12px 0 0 12px;
    border-right: none;
  }

  &:hover {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    color: #00d4ff;
    padding: 12px 20px;
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

// 底部控制栏
.bottom-controls {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: rgba(15, 15, 25, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.12);
  border-radius: 24px;
  z-index: 100;

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;

    &.right {
      margin-left: auto;
    }
  }

  .filter-select {
    width: 140px;

    :deep(.ant-select-selector) {
      background: rgba(0, 212, 255, 0.08) !important;
      border: 1px solid rgba(0, 212, 255, 0.2) !important;
      border-radius: 20px !important;
      color: #fff !important;
      padding: 4px 12px !important;
      height: auto !important;

      &:hover {
        border-color: rgba(0, 212, 255, 0.4) !important;
      }
    }

    :deep(.ant-select-arrow) {
      color: rgba(255, 255, 255, 0.5);
    }

    :deep(.ant-select-selection-item) {
      font-size: 13px;
    }
  }

  .control-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 212, 255, 0.15);
      color: #00d4ff;
    }
  }
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