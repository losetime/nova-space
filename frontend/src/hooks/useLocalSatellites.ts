import { ref, onUnmounted, computed } from 'vue'
import { useOrbitWorker } from './useOrbitWorker'
import { satelliteApi } from '@/api'
import type { TLEData } from '@/api'

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
  mission?: string
  operator?: string
}

export interface LocalSatellitesState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  isLoading: boolean
  error: string | null
  satelliteCount: number
  lastUpdate: string | null
}

export function useLocalSatellites() {
  const { metadata, positions, state: workerState, initSatellites, terminate } = useOrbitWorker()

  const state = ref<LocalSatellitesState>({
    status: 'idle',
    isLoading: false,
    error: null,
    satelliteCount: 0,
    lastUpdate: null,
  })

  const satellites = computed<Satellite[]>(() => {
    const meta = metadata.value
    const pos = positions.value

    if (Object.keys(meta).length === 0 || pos.length === 0) {
      return []
    }

    return pos.map((p) => {
      const m = meta[p.noradId]
      return {
        noradId: p.noradId,
        name: m?.name || '',
        position: {
          lat: p.lat,
          lng: p.lng,
          alt: p.alt,
        },
        timestamp: workerState.value.lastUpdate || new Date().toISOString(),
        countryCode: m?.countryCode,
        mission: m?.mission,
        operator: m?.operator,
      }
    })
  })

  const satelliteCount = computed(() => {
    return positions.value.length
  })

  const lastUpdate = computed(() => {
    return workerState.value.lastUpdate
  })

  const loadTLEData = async () => {
    if (state.value.isLoading) return

    state.value.isLoading = true
    state.value.status = 'loading'
    state.value.error = null

    try {
      const response = await satelliteApi.getTLEs()
      const { tles, count } = response.data.data

      if (tles && tles.length > 0) {
        initSatellites(tles as TLEData[])
        state.value.satelliteCount = count
        state.value.status = 'ready'
      } else {
        state.value.status = 'error'
        state.value.error = '没有可用的卫星数据'
      }
    } catch (error: unknown) {
      state.value.status = 'error'
      const err = error as { message?: string }
      state.value.error = err.message || '加载卫星数据失败'
      console.error('[LocalSatellites] 加载 TLE 数据失败:', error)
    } finally {
      state.value.isLoading = false
    }
  }

  const refresh = async () => {
    terminate()
    await loadTLEData()
  }

  const cleanupSatelliteImageMap = (_currentNoradIds: string[]) => {
    // 兼容旧接口，不再需要清理
  }

  const connect = async () => {
    await loadTLEData()
  }

  const disconnect = () => {
    terminate()
    state.value.status = 'idle'
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    state,
    satellites,
    satelliteCount,
    lastUpdate,
    status: computed(() => state.value.status),
    isInitialized: computed(() => workerState.value.isReady),
    loadTLEData,
    refresh,
    connect,
    disconnect,
    fetchSatellites: loadTLEData,
    cleanupSatelliteImageMap,
  }
}