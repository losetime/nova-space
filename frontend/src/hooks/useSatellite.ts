import { ref } from 'vue'
import type { Satellite } from './useLocalSatellites'
import { satelliteApi, type SatelliteDetail } from '@/api'

export function useSatellite(
  cesium: any,
  localSatellites: any
) {
  const selectedSatellite = ref<Satellite | null>(null)
  const selectedMetadata = ref<SatelliteDetail['metadata']>(null)
  const rightPanelVisible = ref(true)
  const orbitLoading = ref(false)

  const handleSelectSatellite = async (satellite: Satellite) => {
    selectedSatellite.value = satellite
    selectedMetadata.value = null

    // 取消之前的选中，然后选中当前卫星
    if (cesium) {
      cesium.showSatelliteLabel(satellite.noradId, satellite.name)
      cesium.clearAllOrbits()
      cesium.flyToSatellite(satellite)
    }

    // 显示右侧面板
    rightPanelVisible.value = true

    // 请求详细数据（位置 + 元数据 + 轨道）
    await fetchSatelliteDetail(satellite.noradId)
  }

  // 获取卫星详细数据
  const fetchSatelliteDetail = async (noradId: string | number) => {
    orbitLoading.value = true
    try {
      const response = await satelliteApi.getDetail(noradId)
      const { position, metadata, orbit } = response.data.data

      // 更新元数据
      selectedMetadata.value = metadata

      // 更新卫星位置（使用最新计算的位置）
      // 后端返回的 position 结构: { noradId, name, lat, lng, alt, velocity? }
      if (position && selectedSatellite.value) {
        selectedSatellite.value = {
          ...selectedSatellite.value,
          position: {
            lat: position.lat,
            lng: position.lng,
            alt: position.alt,
          }
        }
      }

      // 绘制轨道
      if (orbit?.orbitPoints && orbit.orbitPoints.length > 0 && cesium) {
        cesium.updateOrbit(noradId, orbit.orbitPoints)
      }
    } catch (error) {
      console.error('获取卫星详细数据失败:', error)
    } finally {
      orbitLoading.value = false
    }
  }

  const toggleRightPanel = () => {
    rightPanelVisible.value = !rightPanelVisible.value
  }

  return {
    selectedSatellite,
    selectedMetadata,
    rightPanelVisible,
    orbitLoading,
    handleSelectSatellite,
    toggleRightPanel
  }
}