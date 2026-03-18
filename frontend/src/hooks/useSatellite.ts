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

    // 取消之前的选中，然后选中当前卫星
    if (cesium) {
      cesium.showSatelliteLabel(satellite.noradId, satellite.name)
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
