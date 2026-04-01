import { ref, onUnmounted } from 'vue'
import { useThrottleFn } from '@vueuse/core'

export interface Satellite {
  noradId: string
  name: string
  position: {
    lng: number
    lat: number
    alt: number
  }
  timestamp: string
  // 筛选字段
  countryCode?: string
  mission?: string
  operator?: string
}

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null)
  const status = ref('已断开')
  const satellites = ref<Satellite[]>([])
  const satelliteCount = ref(0)
  const lastUpdate = ref('--')
  const isInitialized = ref(false)
  const useHttpFallback = ref(false) // 是否使用 HTTP 备用模式

  // 动态获取地址（开发环境通过 vite proxy，生产环境通过 nginx）
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/satellites`
  const apiUrl = `${window.location.origin}/api/satellites`

  // 内部数据缓冲（节流用）
  let pendingData: Satellite[] = []

  // 节流更新函数 - 最多每 5 秒更新一次 UI（与后端推送同步）
  const throttledUpdate = useThrottleFn(() => {
    if (pendingData.length > 0) {
      satellites.value = pendingData
      satelliteCount.value = pendingData.length
      pendingData = []
    }
  }, 5000)

  const initWebSocket = () => {
    if (isInitialized.value) return

    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket 连接已建立')
        status.value = '已连接'
        useHttpFallback.value = false // WebSocket 成功，禁用 HTTP 备用
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'satellites') {
            // 先存入缓冲区，通过节流更新 UI
            pendingData = data.data
            lastUpdate.value = new Date(data.timestamp).toLocaleTimeString()
            throttledUpdate()
          }
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error)
        }
      }

      ws.value.onclose = () => {
        console.log('WebSocket 连接已关闭')
        status.value = '已断开'

        // 尝试重连
        setTimeout(() => {
          console.log('尝试重新连接...')
          if (isInitialized.value) {
            reconnect()
          }
        }, 5000)
      }

      ws.value.onerror = () => {
        console.error('WebSocket 连接失败，切换到 HTTP 备用模式')
        status.value = 'HTTP 模式'
        useHttpFallback.value = true
        // WebSocket 失败后才发起 HTTP 备用请求
        fetchSatellites()
      }

      isInitialized.value = true
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
      status.value = '连接失败'
      useHttpFallback.value = true
      fetchSatellites()
    }
  }

  // 重连（不重置 isInitialized）
  const reconnect = () => {
    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket 连接已建立')
        status.value = '已连接'
        useHttpFallback.value = false
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'satellites') {
            // 先存入缓冲区，通过节流更新 UI
            pendingData = data.data
            lastUpdate.value = new Date(data.timestamp).toLocaleTimeString()
            throttledUpdate()
          }
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error)
        }
      }

      ws.value.onclose = () => {
        console.log('WebSocket 连接已关闭')
        status.value = '已断开'

        setTimeout(() => {
          if (isInitialized.value) {
            reconnect()
          }
        }, 5000)
      }

      ws.value.onerror = () => {
        console.error('WebSocket 重连失败')
        status.value = 'HTTP 模式'
        useHttpFallback.value = true
        fetchSatellites()
      }
    } catch (error) {
      console.error('重连失败:', error)
      useHttpFallback.value = true
      fetchSatellites()
    }
  }

  // 获取卫星数据（HTTP 方式 - 仅作为 WebSocket 失败时的备用）
  const fetchSatellites = async () => {
    try {
      const response = await fetch(apiUrl)
      const data = await response.json()

      if (data.code === 0) {
        satellites.value = data.data.satellites
        satelliteCount.value = data.data.count
        lastUpdate.value = new Date().toLocaleTimeString()
      }
    } catch (error) {
      console.error('获取卫星数据失败:', error)
    }

    // 如果是 HTTP 备用模式，定时轮询
    if (useHttpFallback.value) {
      setTimeout(() => {
        if (useHttpFallback.value) {
          fetchSatellites()
        }
      }, 10000) // 每 10 秒轮询一次
    }
  }

  const cleanupSatelliteImageMap = (currentNoradIds: string[]) => {
    // 清理逻辑
  }

  const connect = () => {
    if (ws.value) {
      ws.value.close()
    }
    initWebSocket()
  }

  // 断开连接并清理
  const disconnect = () => {
    if (ws.value) {
      isInitialized.value = false
      useHttpFallback.value = false
      ws.value.close()
      ws.value = null
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    status,
    satellites,
    satelliteCount,
    lastUpdate,
    isInitialized,
    connect,
    disconnect,
    fetchSatellites,
    cleanupSatelliteImageMap
  }
}