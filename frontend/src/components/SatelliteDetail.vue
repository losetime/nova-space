<template>
  <div class="satellite-detail" v-if="satellite">
    <!-- 卫星头部 -->
    <div class="detail-header">
      <div class="sat-visual">
        <div class="orbit-container">
          <div class="orbit-path"></div>
          <div class="satellite-marker">
            <div class="marker-dot"></div>
            <div class="marker-glow"></div>
          </div>
        </div>
      </div>
      <div class="sat-title">
        <h3>{{ satellite.name }}</h3>
        <span class="norad-id">NORAD #{{ satellite.noradId }}</span>
      </div>
    </div>

    <!-- 轨道参数卡片 -->
    <div class="section">
      <div class="section-header">
        <CompassOutlined class="section-icon" />
        <span>轨道参数</span>
      </div>
      <div class="param-grid">
        <div class="param-card">
          <div class="param-icon lng">
            <EnvironmentOutlined />
          </div>
          <div class="param-content">
            <label>经度</label>
            <span class="param-value">{{ formatNumber(satellite.position.lng, 4) }}°</span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon lat">
            <EnvironmentOutlined />
          </div>
          <div class="param-content">
            <label>纬度</label>
            <span class="param-value">{{ formatNumber(satellite.position.lat, 4) }}°</span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon alt">
            <RocketOutlined />
          </div>
          <div class="param-content">
            <label>轨道高度</label>
            <span class="param-value">{{ formatNumber(satellite.position.alt / 1000, 0) }} km</span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon orbit">
            <GlobalOutlined />
          </div>
          <div class="param-content">
            <label>轨道类型</label>
            <span :class="['param-value', 'orbit-type', getOrbitClass(satellite.position.alt)]">
              {{ getOrbitType(satellite.position.alt) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态信息 -->
    <div class="section">
      <div class="section-header">
        <DashboardOutlined class="section-icon" />
        <span>运行状态</span>
      </div>
      <div class="status-panel">
        <div class="status-row">
          <div class="status-indicator active">
            <span class="indicator-dot"></span>
            <span class="indicator-text">运行中</span>
          </div>
          <span class="status-time">{{ formatTime(satellite.timestamp) }}</span>
        </div>
        <div class="status-bar">
          <div class="bar-fill" style="width: 92%"></div>
        </div>
        <div class="status-meta">
          <span>信号强度: 优秀</span>
          <span>92%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 空状态 -->
  <div class="empty-state" v-else>
    <div class="empty-visual">
      <div class="empty-orbit">
        <div class="empty-dot"></div>
      </div>
      <GlobalOutlined class="empty-globe" />
    </div>
    <p>请选择一颗卫星</p>
    <span>从左侧列表中选择卫星查看详细信息</span>
  </div>
</template>

<script setup lang="ts">
import {
  GlobalOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  RocketOutlined,
  DashboardOutlined,
} from '@ant-design/icons-vue'
import type { Satellite } from '@/hooks/useWebSocket'

interface Props {
  satellite: Satellite | null
}

const props = defineProps<Props>()

const formatNumber = (num: number, decimals: number): string => {
  return num.toFixed(decimals)
}

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getOrbitType = (alt: number): string => {
  if (alt < 2000000) return '低轨 LEO'      // < 2000 km
  if (alt < 35000000) return '中轨 MEO'     // < 35000 km
  return '地球同步 GEO'
}

const getOrbitClass = (alt: number): string => {
  if (alt < 2000000) return 'leo'
  if (alt < 35000000) return 'meo'
  return 'geo'
}
</script>

<style scoped lang="scss">
.satellite-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.15);
    border-radius: 2px;
  }
}

// 头部
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.08);
  margin-bottom: 20px;
}

.sat-visual {
  width: 64px;
  height: 64px;
  flex-shrink: 0;

  .orbit-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .orbit-path {
      width: 50px;
      height: 50px;
      border: 2px solid rgba(0, 212, 255, 0.2);
      border-radius: 50%;
      animation: orbit-spin 10s linear infinite;
    }

    .satellite-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: orbit-motion 4s linear infinite;

      .marker-dot {
        width: 10px;
        height: 10px;
        background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
        border-radius: 50%;
        box-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
      }

      .marker-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%);
        border-radius: 50%;
      }
    }
  }
}

@keyframes orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes orbit-motion {
  0% { transform: translate(calc(-50% + 25px), -50%); }
  25% { transform: translate(-50%, calc(-50% + 25px)); }
  50% { transform: translate(calc(-50% - 25px), -50%); }
  75% { transform: translate(-50%, calc(-50% - 25px)); }
  100% { transform: translate(calc(-50% + 25px), -50%); }
}

.sat-title {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 17px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 6px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .norad-id {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
    background: rgba(0, 212, 255, 0.08);
    padding: 3px 8px;
    border-radius: 6px;
  }
}

// 区块
.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;

  .section-icon {
    font-size: 14px;
    color: #00d4ff;
  }
}

// 参数网格
.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.param-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.08);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.15);
  }

  .param-icon {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 14px;

    &.lng { background: rgba(0, 212, 255, 0.12); color: #00d4ff; }
    &.lat { background: rgba(0, 255, 136, 0.12); color: #00ff88; }
    &.alt { background: rgba(123, 44, 191, 0.12); color: #b366e8; }
    &.orbit { background: rgba(255, 170, 0, 0.12); color: #ffaa00; }
  }

  .param-content {
    flex: 1;
    min-width: 0;

    label {
      display: block;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .param-value {
      font-size: 13px;
      font-weight: 600;
      color: #fff;

      &.orbit-type {
        &.leo { color: #00ff88; }
        &.meo { color: #00d4ff; }
        &.geo { color: #b366e8; }
      }
    }
  }
}

// 状态面板
.status-panel {
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;

  .indicator-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff4d4d;
  }

  &.active .indicator-dot {
    background: #00ff88;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  .indicator-text {
    font-size: 13px;
    font-weight: 500;
    color: #00ff88;
  }
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.status-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.status-bar {
  height: 4px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #00d4ff, #00ff88);
    border-radius: 2px;
    transition: width 0.5s ease;
  }
}

.status-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

// 空状态
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 24px;
}

.empty-visual {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 24px;

  .empty-orbit {
    width: 80px;
    height: 80px;
    border: 2px dashed rgba(0, 212, 255, 0.2);
    border-radius: 50%;
    animation: slow-spin 15s linear infinite;

    .empty-dot {
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 12px;
      height: 12px;
      background: rgba(0, 212, 255, 0.3);
      border-radius: 50%;
    }
  }

  .empty-globe {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 28px;
    color: rgba(0, 212, 255, 0.25);
  }
}

@keyframes slow-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.empty-state span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}
</style>