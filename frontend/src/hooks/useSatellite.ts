import { ref } from 'vue'
import type { Satellite } from './useWebSocket'
import { satelliteApi } from '@/api'

export function useSatellite(
  cesium: any,
  websocket: any
) {
  const selectedSatellite = ref<Satellite | null>(null)
  const rightPanelVisible = ref(true)
  const orbitLoading = ref(false)

  const handleSelectSatellite = async (satellite: Satellite) => {
    selectedSatellite.value = satellite
    
    // 隐藏所有卫星标签，然后显示选中的卫星标签
    if (cesium) {
      cesium.hideAllLabels()
      cesium.showSatelliteLabel(satellite.noradId)
      cesium.clearAllOrbits()
      cesium.flyToSatellite(satellite)
    }
    
    // 显示右侧面板
    rightPanelVisible.value = true
    
    // 请求轨道数据
    await requestOrbitData(satellite.noradId)
  }

  // 请求卫星轨道数据
  const requestOrbitData = async (noradId: string | number) => {
    orbitLoading.value = true
    try {
      const response = await satelliteApi.getOrbit(noradId)
      const { orbitPoints } = response.data.data
      if (orbitPoints && orbitPoints.length > 0 && cesium) {
        cesium.updateOrbit(noradId, orbitPoints)
      }
    } catch (error) {
      console.error('获取轨道数据失败:', error)
    } finally {
      orbitLoading.value = false
    }
  }

  const toggleRightPanel = () => {
    rightPanelVisible.value = !rightPanelVisible.value
  }

  return {
    selectedSatellite,
    rightPanelVisible,
    orbitLoading,
    handleSelectSatellite,
    toggleRightPanel
  }
}
