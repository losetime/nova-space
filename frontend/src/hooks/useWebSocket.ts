import { ref, onUnmounted } from 'vue'

export interface Satellite {
  noradId: string
  name: string
  position: {
    lng: number
    lat: number
    alt: number
  }
  timestamp: string
  countryCode?: string
}

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null)
  const status = ref('已断开')
  const satellites = ref<Satellite[]>([])
  const satelliteCount = ref(0)
  const lastUpdate = ref('--')
  const isInitialized = ref(false)

  // 动态获取地址（开发环境通过 vite proxy，生产环境通过 nginx）
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/satellites`
  const apiUrl = `${window.location.origin}/api/satellites`

  const initWebSocket = () => {
    if (isInitialized.value) return

    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket 连接已建立')
        status.value = '已连接'
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'satellites') {
            satellites.value = data.data
            satelliteCount.value = data.data.length
            lastUpdate.value = new Date(data.timestamp).toLocaleTimeString()
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

      ws.value.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        status.value = '连接错误'
      }

      isInitialized.value = true
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
      status.value = '连接失败'
    }
  }

  // 重连（不重置 isInitialized）
  const reconnect = () => {
    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket 连接已建立')
        status.value = '已连接'
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'satellites') {
            satellites.value = data.data
            satelliteCount.value = data.data.length
            lastUpdate.value = new Date(data.timestamp).toLocaleTimeString()
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

      ws.value.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        status.value = '连接错误'
      }
    } catch (error) {
      console.error('重连失败:', error)
    }
  }

  // 获取卫星数据（HTTP 方式）
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
