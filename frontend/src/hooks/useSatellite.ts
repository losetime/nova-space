import { ref, computed } from 'vue'
import type { Satellite } from './useLocalSatellites'
import { satelliteApi, type SatelliteDetail } from '@/api'

interface CesiumHelper {
  showSatelliteLabel: (noradId: string, name: string) => void
  clearAllOrbits: () => void
  flyToSatellite: (satellite: Satellite) => void
  updateOrbit: (noradId: string | number, points: Array<{ lat: number; lng: number; alt: number }>) => void
}

export function useSatellite(
  cesium: CesiumHelper | null,
  localSatellites: { satellites: { value: Satellite[] } }
) {
  const selectedNoradId = ref<string | null>(null)
  const selectedMetadata = ref<SatelliteDetail['metadata']>(null)
  const rightPanelVisible = ref(true)
  const orbitLoading = ref(false)

  const selectedSatellite = computed<Satellite | null>(() => {
    if (!selectedNoradId.value) return null
    return localSatellites.satellites.value.find(s => s.noradId === selectedNoradId.value) || null
  })

  const handleSelectSatellite = async (satellite: Satellite) => {
    selectedNoradId.value = satellite.noradId
    selectedMetadata.value = null

    if (cesium) {
      cesium.showSatelliteLabel(satellite.noradId, satellite.name)
      cesium.clearAllOrbits()
      cesium.flyToSatellite(satellite)
    }

    rightPanelVisible.value = true
    await fetchSatelliteDetail(satellite.noradId)
  }

  const fetchSatelliteDetail = async (noradId: string | number) => {
    orbitLoading.value = true
    try {
      const response = await satelliteApi.getDetail(noradId)
      const { metadata, orbit } = response.data.data

      selectedMetadata.value = metadata

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