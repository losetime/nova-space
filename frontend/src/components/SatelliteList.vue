<template>
  <div class="satellite-list">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-wrapper">
        <SearchOutlined class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索卫星名称或 ID..."
          class="search-input"
        />
        <transition name="fade">
          <div v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
            <CloseCircleOutlined />
          </div>
        </transition>
      </div>
      <div class="search-meta">
        <span class="result-count">
          <span class="count">{{ filteredSatellites.length }}</span>
          <span class="divider">/</span>
          <span class="total">{{ satellites.length }}</span>
        </span>
      </div>
    </div>

    <!-- 卫星列表 -->
    <div class="list-container" ref="listRef">
      <transition-group name="list" tag="div" class="satellite-items">
        <div
          v-for="satellite in filteredSatellites"
          :key="satellite.noradId"
          :class="['satellite-item', { active: selectedSatellite?.noradId === satellite.noradId }]"
          @click="$emit('select-satellite', satellite)"
        >
          <!-- 卫星图标 -->
          <div class="sat-icon">
            <div class="orbit-ring"></div>
            <div class="sat-dot" :style="{ animationDelay: `${Math.random() * 2}s` }"></div>
          </div>
          
          <!-- 卫星信息 -->
          <div class="sat-content">
            <div class="sat-header">
              <span class="sat-name">{{ satellite.name }}</span>
              <span class="sat-id">#{{ satellite.noradId }}</span>
            </div>
            <div class="sat-meta">
              <span :class="['orbit-badge', getOrbitClass(satellite.position.alt)]">
                {{ getOrbitType(satellite.position.alt) }}
              </span>
              <span class="alt-value">
                <ArrowUpOutlined class="alt-icon" />
                {{ formatAlt(satellite.position.alt) }} km
              </span>
            </div>
          </div>

          <!-- 状态指示 -->
          <div class="sat-indicator">
            <div class="signal-wave">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </transition-group>

      <!-- 空状态 -->
      <div v-if="filteredSatellites.length === 0" class="empty-state">
        <div class="empty-icon">
          <GlobalOutlined />
        </div>
        <p>没有找到匹配的卫星</p>
        <span>尝试使用其他关键词搜索</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SearchOutlined, CloseCircleOutlined, GlobalOutlined, ArrowUpOutlined } from '@ant-design/icons-vue'
import type { Satellite } from '@/hooks/useWebSocket'

interface Props {
  satellites: Satellite[]
  selectedSatellite: Satellite | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'select-satellite': [satellite: Satellite]
}>()

const searchQuery = ref('')
const listRef = ref<HTMLElement | null>(null)

const filteredSatellites = computed(() => {
  if (!searchQuery.value) {
    return props.satellites.slice(0, 100)
  }

  const query = searchQuery.value.toLowerCase()
  return props.satellites.filter(sat =>
    sat.name.toLowerCase().includes(query) ||
    sat.noradId.toLowerCase().includes(query)
  ).slice(0, 100)
})

const getOrbitType = (alt: number): string => {
  if (alt < 2000) return 'LEO'
  if (alt < 35000) return 'MEO'
  return 'GEO'
}

const getOrbitClass = (alt: number): string => {
  if (alt < 2000) return 'leo'
  if (alt < 35000) return 'meo'
  return 'geo'
}

const formatAlt = (alt: number): string => {
  return alt.toFixed(0)
}
</script>

<style scoped lang="scss">
.satellite-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 搜索区域
.search-section {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.08);
  flex-shrink: 0;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 14px;
    color: rgba(255, 255, 255, 0.35);
    font-size: 14px;
    transition: all 0.3s;
  }

  .search-input {
    width: 100%;
    padding: 12px 40px;
    background: rgba(0, 212, 255, 0.04);
    border: 1px solid rgba(0, 212, 255, 0.12);
    border-radius: 14px;
    color: #fff;
    font-size: 13px;
    outline: none;
    transition: all 0.3s ease;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    &:hover {
      border-color: rgba(0, 212, 255, 0.25);
    }

    &:focus {
      border-color: #00d4ff;
      background: rgba(0, 212, 255, 0.08);
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1),
                  0 0 20px rgba(0, 212, 255, 0.1);

      & + .search-icon,
      & ~ .search-icon {
        color: #00d4ff;
      }
    }
  }

  .search-clear {
    position: absolute;
    right: 12px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;

    &:hover {
      color: #00d4ff;
      background: rgba(0, 212, 255, 0.15);
    }
  }
}

.search-meta {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;

  .result-count {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;

    .count {
      color: #00d4ff;
      font-weight: 600;
    }

    .divider {
      color: rgba(255, 255, 255, 0.3);
    }

    .total {
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

// 列表容器
.list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.15);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 212, 255, 0.3);
    }
  }
}

.satellite-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// 卫星列表项
.satellite-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: rgba(0, 212, 255, 0.06);
    border-color: rgba(0, 212, 255, 0.15);
    transform: translateX(4px);

    .orbit-ring {
      border-color: rgba(0, 212, 255, 0.3);
    }

    .sat-dot {
      box-shadow: 0 0 12px rgba(0, 255, 136, 0.6);
    }
  }

  &.active {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.1);

    .sat-name {
      color: #00d4ff;
    }

    .orbit-ring {
      border-color: rgba(0, 212, 255, 0.5);
      animation: spin 8s linear infinite;
    }

    .sat-dot {
      background: #00d4ff;
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.8);
    }
  }
}

// 卫星图标
.sat-icon {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  .orbit-ring {
    position: absolute;
    width: 36px;
    height: 36px;
    border: 2px solid rgba(0, 212, 255, 0.15);
    border-radius: 50%;
    transition: all 0.3s;
  }

  .sat-dot {
    width: 10px;
    height: 10px;
    background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
    border-radius: 50%;
    position: relative;
    z-index: 1;
    animation: pulse 2.5s ease-in-out infinite;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

// 卫星内容
.sat-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sat-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .sat-name {
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s;
  }

  .sat-id {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.35);
    flex-shrink: 0;
  }
}

.sat-meta {
  display: flex;
  align-items: center;
  gap: 10px;

  .orbit-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &.leo {
      background: rgba(0, 255, 136, 0.12);
      color: #00ff88;
    }

    &.meo {
      background: rgba(0, 212, 255, 0.12);
      color: #00d4ff;
    }

    &.geo {
      background: rgba(123, 44, 191, 0.12);
      color: #b366e8;
    }
  }

  .alt-value {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);

    .alt-icon {
      font-size: 10px;
      color: rgba(0, 212, 255, 0.6);
    }
  }
}

// 信号指示器
.sat-indicator {
  flex-shrink: 0;

  .signal-wave {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 16px;

    span {
      width: 3px;
      background: rgba(0, 255, 136, 0.5);
      border-radius: 2px;

      &:nth-child(1) {
        height: 6px;
        animation: wave 1.2s ease-in-out infinite;
      }

      &:nth-child(2) {
        height: 10px;
        animation: wave 1.2s ease-in-out 0.2s infinite;
      }

      &:nth-child(3) {
        height: 14px;
        animation: wave 1.2s ease-in-out 0.4s infinite;
      }
    }
  }
}

@keyframes wave {
  0%, 100% {
    transform: scaleY(1);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(0.6);
    opacity: 1;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  .empty-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 212, 255, 0.05);
    border-radius: 50%;
    margin-bottom: 20px;

    .anticon {
      font-size: 36px;
      color: rgba(0, 212, 255, 0.3);
      animation: float 3s ease-in-out infinite;
    }
  }

  p {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 6px;
  }

  span {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

// 列表过渡动画
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

// fade 过渡
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>