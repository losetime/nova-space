import { ref, onUnmounted } from 'vue'
import * as Cesium from 'cesium'

export function useCesium() {
  const viewer = ref(null)
  const satelliteEntities = new Map()
  const predictedOrbitEntities = new Map() // 存储预测轨道实体
  const isInitialized = ref(false)

  // 初始化 Cesium 场景
  const initCesium = () => {
    if (isInitialized.value) return

    viewer.value = new Cesium.Viewer('cesium-container', {
      baseLayerPicker: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      geocoder: false,  // 禁用搜索按钮
      vrButton: false,
      selectionIndicator: false,
      shadows: false,
      scene3DOnly: true,
      useDefaultRenderLoop: true,
      targetFrameRate: 60,
      shouldRender: true,
      contextOptions: {
        webgl: {
          alpha: true
        }
      }
    })

    // 设置相机视角
    viewer.value.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 20000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    })

    isInitialized.value = true
  }

  // 更新卫星位置
  const updateSatellitePosition = (satellite) => {
    if (!viewer.value) return

    const { noradId, name, position } = satellite

    if (satelliteEntities.has(noradId)) {
      // 更新现有卫星
      const entity = satelliteEntities.get(noradId)
      entity.position = Cesium.Cartesian3.fromDegrees(
        position.lng,
        position.lat,
        position.alt
      )
    } else {
      // 创建新卫星实体
      const entity = viewer.value.entities.add({
        id: noradId,
        name: name,
        position: Cesium.Cartesian3.fromDegrees(
          position.lng,
          position.lat,
          position.alt
        ),
        point: {
          pixelSize: 6,
          color: Cesium.Color.fromCssColorString('#00ff9d'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1
        },
        label: {
          text: name,
          font: '12px monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          showBackground: true,
          backgroundColor: new Cesium.Color(0, 0, 0, 0.5),
          show: false
        }
      })
      satelliteEntities.set(noradId, entity)
    }
  }

  // 更新卫星轨道
  const updateOrbit = (noradId, orbitPoints) => {
    if (!viewer.value) return

    const orbitEntityId = `orbit_${noradId}`
    const existingOrbit = viewer.value.entities.getById(orbitEntityId)
    if (existingOrbit) {
      viewer.value.entities.remove(existingOrbit)
    }

    const positions = []
    orbitPoints.forEach(point => {
      positions.push(
        Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt)
      )
    })

    viewer.value.entities.add({
      id: orbitEntityId,
      polyline: {
        positions: positions,
        width: 2,
        material: Cesium.Color.fromCssColorString('#00ffff'),
        clampToGround: false
      }
    })
  }

  // 显示预测轨道
  const showPredictedOrbit = (noradId: string, orbitPoints: Array<{ lat: number; lng: number; alt: number }>) => {
    if (!viewer.value || !orbitPoints.length) return

    // 清除该卫星之前的预测轨道
    clearPredictedOrbit(noradId)

    // 创建轨道点位置数组
    const positions = orbitPoints.map(point =>
      Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt)
    )

    // 创建预测轨道线（紫色渐变）
    const orbitEntityId = `predicted_orbit_${noradId}`
    const orbitEntity = viewer.value.entities.add({
      id: orbitEntityId,
      polyline: {
        positions: positions,
        width: 3,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.fromCssColorString('#a855f7'), // 紫色
        }),
        clampToGround: false
      }
    })

    predictedOrbitEntities.set(noradId, orbitEntity)

    // 添加轨道点标记（每隔一定间隔显示一个点）
    const step = Math.max(1, Math.floor(orbitPoints.length / 20)) // 最多显示20个点
    for (let i = 0; i < orbitPoints.length; i += step) {
      const point = orbitPoints[i]
      const pointEntityId = `predicted_point_${noradId}_${i}`
      
      viewer.value.entities.add({
        id: pointEntityId,
        position: Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt),
        point: {
          pixelSize: 3,
          color: Cesium.Color.fromCssColorString('#a855f7').withAlpha(0.6),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
          outlineWidth: 1
        }
      })
      
      predictedOrbitEntities.set(pointEntityId, true)
    }

    // 飞到轨道中心位置
    if (orbitPoints.length > 0) {
      const centerIndex = Math.floor(orbitPoints.length / 2)
      const centerPoint = orbitPoints[centerIndex]
      flyToPosition(centerPoint, orbitPoints[0].alt + 5000000)
    }
  }

  // 清除预测轨道
  const clearPredictedOrbit = (noradId: string) => {
    if (!viewer.value) return

    // 删除预测轨道线
    const orbitEntityId = `predicted_orbit_${noradId}`
    const orbitEntity = viewer.value.entities.getById(orbitEntityId)
    if (orbitEntity) {
      viewer.value.entities.remove(orbitEntity)
      predictedOrbitEntities.delete(orbitEntityId)
    }

    // 删除所有预测轨道点
    const keysToRemove = []
    predictedOrbitEntities.forEach((_, key) => {
      if (key.toString().startsWith(`predicted_point_${noradId}_`)) {
        const pointEntity = viewer.value.entities.getById(key)
        if (pointEntity) {
          viewer.value.entities.remove(pointEntity)
        }
        keysToRemove.push(key)
      }
    })
    keysToRemove.forEach(key => predictedOrbitEntities.delete(key))
  }

  // 清除所有预测轨道
  const clearAllPredictedOrbits = () => {
    if (!viewer.value) return

    const entitiesToRemove = []
    viewer.value.entities.values.forEach(entity => {
      if (entity.id && (
        entity.id.toString().startsWith('predicted_orbit_') ||
        entity.id.toString().startsWith('predicted_point_')
      )) {
        entitiesToRemove.push(entity)
      }
    })
    
    entitiesToRemove.forEach(entity => {
      viewer.value.entities.remove(entity)
    })
    
    predictedOrbitEntities.clear()
  }

  // 飞到指定位置
  const flyToPosition = (position: { lat: number; lng: number; alt: number }, distance?: number) => {
    if (!viewer.value) return

    const { lat, lng, alt } = position
    const flyDistance = distance || alt + 10000000

    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, flyDistance),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-60),
        roll: 0
      },
      duration: 1.5
    })
  }

  // 隐藏所有卫星标签
  const hideAllLabels = () => {
    satelliteEntities.forEach((entity) => {
      if (entity.label) {
        entity.label.show = false
      }
    })
  }

  // 显示指定卫星标签
  const showSatelliteLabel = (noradId: number) => {
    const selectedEntity = satelliteEntities.get(noradId)
    if (selectedEntity && selectedEntity.label) {
      selectedEntity.label.show = true
    }
  }

  // 切换视角到卫星
  const flyToSatellite = (satellite) => {
    if (!satellite || !viewer.value) return

    const { position } = satellite

    if (!position || isNaN(position.lng) || isNaN(position.lat) || isNaN(position.alt)) {
      return
    }

    const destination = Cesium.Cartesian3.fromDegrees(
      position.lng,
      position.lat,
      position.alt + 20000000
    )

    viewer.value.camera.flyTo({
      destination: destination,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      },
      duration: 2.0
    })
  }

  // 清除所有轨道
  const clearAllOrbits = () => {
    if (!viewer.value) return

    const entitiesToRemove = []
    viewer.value.entities.values.forEach(entity => {
      if (entity.id && entity.id.toString().startsWith('orbit_')) {
        entitiesToRemove.push(entity)
      }
    })
    entitiesToRemove.forEach(entity => {
      viewer.value.entities.remove(entity)
    })
  }

  // 清理卫星
  const cleanupSatellites = (currentNoradIds) => {
    const currentIds = new Set(currentNoradIds)
    satelliteEntities.forEach((entity, noradId) => {
      if (!currentIds.has(noradId)) {
        viewer.value.entities.remove(entity)
        satelliteEntities.delete(noradId)
      }
    })
  }

  // 销毁
  const destroyCesium = () => {
    if (viewer.value) {
      viewer.value.destroy()
      viewer.value = null
    }
    satelliteEntities.clear()
    predictedOrbitEntities.clear()
    isInitialized.value = false
  }

  onUnmounted(() => {
    destroyCesium()
  })

  return {
    viewer,
    isInitialized,
    initCesium,
    updateSatellitePosition,
    updateOrbit,
    clearAllOrbits,
    flyToSatellite,
    hideAllLabels,
    showSatelliteLabel,
    cleanupSatellites,
    showPredictedOrbit,
    clearPredictedOrbit,
    clearAllPredictedOrbits,
    flyToPosition,
    destroyCesium
  }
}
