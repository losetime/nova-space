import { ref, onUnmounted, shallowRef } from 'vue'
import type { SatellitePosition, TLEData } from '@/workers/orbit.worker'

export interface OrbitWorkerState {
  isReady: boolean
  isLoading: boolean
  error: string | null
  satelliteCount: number
  lastUpdate: string | null
}

export function useOrbitWorker() {
  const worker = shallowRef<Worker | null>(null)
  const positions = shallowRef<SatellitePosition[]>([])
  const state = ref<OrbitWorkerState>({
    isReady: false,
    isLoading: false,
    error: null,
    satelliteCount: 0,
    lastUpdate: null,
  })

  let computeInterval: ReturnType<typeof setInterval> | null = null

  const initWorker = () => {
    if (worker.value) return

    worker.value = new Worker(
      new URL('../workers/orbit.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.value.onmessage = (e: MessageEvent) => {
      const { type, data } = e.data

      if (type === 'ready') {
        state.value.isReady = true
        state.value.isLoading = false
        state.value.satelliteCount = data.total
        console.log(`[OrbitWorker] 初始化完成，加载 ${data.total} 颗卫星`)
        startComputeLoop()
      } else if (type === 'positions') {
        positions.value = data
        state.value.lastUpdate = e.data.timestamp
      }
    }

    worker.value.onerror = (error) => {
      state.value.error = error.message
      state.value.isLoading = false
      console.error('[OrbitWorker] 错误:', error)
    }
  }

  const initSatellites = (tles: TLEData[]) => {
    if (!worker.value) {
      initWorker()
    }

    state.value.isLoading = true
    state.value.error = null
    worker.value?.postMessage({ type: 'init', data: { tles } })
  }

  const startComputeLoop = (intervalMs: number = 3000) => {
    if (computeInterval) {
      clearInterval(computeInterval)
    }

    // 立即计算一次
    computePositions()

    // 定时计算
    computeInterval = setInterval(() => {
      computePositions()
    }, intervalMs)
  }

  const stopComputeLoop = () => {
    if (computeInterval) {
      clearInterval(computeInterval)
      computeInterval = null
    }
  }

  const computePositions = (timestamp?: number) => {
    if (!worker.value || !state.value.isReady) return

    worker.value.postMessage({
      type: 'compute',
      data: { timestamp: timestamp ?? Date.now() },
    })
  }

  const terminate = () => {
    stopComputeLoop()
    worker.value?.terminate()
    worker.value = null
    state.value.isReady = false
    state.value.isLoading = false
  }

  onUnmounted(() => {
    terminate()
  })

  return {
    positions,
    state,
    initWorker,
    initSatellites,
    computePositions,
    startComputeLoop,
    stopComputeLoop,
    terminate,
  }
}