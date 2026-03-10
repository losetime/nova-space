import { ref, onMounted, onUnmounted } from 'vue'

export interface Satellite {
  noradId: string
  name: string
  position: {
    lng: number
    lat: number
    alt: number
  }
  timestamp: string
}

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null)
  const status = ref('已断开')
  const satellites = ref<Satellite[]>([])
  const satelliteCount = ref(0)
  const lastUpdate = ref('--')

  // 后端地址
  const wsUrl = 'ws://localhost:3001/ws/satellites'
  const apiUrl = 'http://localhost:3001/api/satellites'

  const initWebSocket = () => {
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
          initWebSocket()
        }, 5000)
      }

      ws.value.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        status.value = '连接错误'
      }
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
      status.value = '连接失败'
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

  onMounted(() => {
    initWebSocket()
    // 也通过 HTTP 获取一次数据作为备份
    setTimeout(fetchSatellites, 1000)
  })

  onUnmounted(() => {
    if (ws.value) {
      ws.value.close()
    }
  })

  return {
    status,
    satellites,
    satelliteCount,
    lastUpdate,
    connect,
    fetchSatellites,
    cleanupSatelliteImageMap
  }
}
