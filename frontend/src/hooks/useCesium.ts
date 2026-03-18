import { ref, onUnmounted } from "vue";
import * as Cesium from "cesium";

interface Satellite {
  noradId: string;
  name: string;
  position: {
    lng: number;
    lat: number;
    alt: number;
  };
}

// 卫星渲染器 - PointPrimitive + Billboard 混合方案
class SatelliteRenderer {
  private viewer: Cesium.Viewer;
  private pointCollection: Cesium.PointPrimitiveCollection | null = null;
  private billboardCollection: Cesium.BillboardCollection | null = null;
  private labelCollection: Cesium.LabelCollection | null = null;

  private pointMap: Map<string, Cesium.PointPrimitive> = new Map();
  private selectedNoradId: string | null = null;
  private selectedBillboard: Cesium.Billboard | null = null;
  private selectedLabel: Cesium.Label | null = null;
  private satellitePositions: Map<string, { name: string; position: Cesium.Cartesian3 }> = new Map();

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.initialize();
  }

  // 初始化 - 创建三个集合
  initialize() {
    // 1. PointPrimitiveCollection - 所有卫星点
    this.pointCollection = new Cesium.PointPrimitiveCollection();
    this.viewer.scene.primitives.add(this.pointCollection);

    // 2. BillboardCollection - 选中的卫星（贴图高亮）
    this.billboardCollection = new Cesium.BillboardCollection();
    this.viewer.scene.primitives.add(this.billboardCollection);

    // 3. LabelCollection - 选中的卫星标签
    this.labelCollection = new Cesium.LabelCollection();
    this.viewer.scene.primitives.add(this.labelCollection);
  }

  // 动态生成卫星图标
  private createSatelliteIcon(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // 绘制外圈光晕
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(0, 255, 157, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 157, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 157, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    // 绘制中心点
    ctx.fillStyle = '#00ff9d';
    ctx.beginPath();
    ctx.arc(16, 16, 6, 0, Math.PI * 2);
    ctx.fill();

    // 绘制白色高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(16, 16, 3, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL();
  }

  // 批量更新卫星位置（分批处理，避免阻塞主线程）
  updateSatellites(satellites: Satellite[], batchSize: number = 500) {
    // 先标记所有现有卫星为"待删除"
    const currentIds = new Set(satellites.map(s => s.noradId));

    // 删除不在新列表中的卫星
    const idsToRemove: string[] = [];
    this.pointMap.forEach((_, noradId) => {
      if (!currentIds.has(noradId)) {
        idsToRemove.push(noradId);
      }
    });
    idsToRemove.forEach(id => {
      const point = this.pointMap.get(id);
      if (point && this.pointCollection) {
        this.pointCollection.remove(point);
      }
      this.pointMap.delete(id);
      this.satellitePositions.delete(id);
    });

    let index = 0;
    const total = satellites.length;

    const processBatch = () => {
      const end = Math.min(index + batchSize, total);

      for (let i = index; i < end; i++) {
        const sat = satellites[i];
        const position = Cesium.Cartesian3.fromDegrees(
          sat.position.lng, sat.position.lat, sat.position.alt
        );

        if (this.pointMap.has(sat.noradId)) {
          // 更新现有点的位置
          const point = this.pointMap.get(sat.noradId)!;
          point.position = position;

          // 如果是选中的卫星，同步更新 Billboard 和 Label 位置
          if (sat.noradId === this.selectedNoradId) {
            if (this.selectedBillboard) {
              this.selectedBillboard.position = position;
            }
            if (this.selectedLabel) {
              this.selectedLabel.position = position;
            }
          }
        } else {
          // 创建新点
          const point = this.pointCollection!.add({
            position,
            pixelSize: 3,
            color: Cesium.Color.fromCssColorString('#00ff9d'),
          });
          this.pointMap.set(sat.noradId, point);
        }

        // 存储卫星位置和名称（用于选中逻辑）
        this.satellitePositions.set(sat.noradId, { name: sat.name, position });
      }

      index = end;

      // 如果还有剩余，下一帧继续处理
      if (index < total) {
        requestAnimationFrame(processBatch);
      }
    };

    // 开始分批处理
    requestAnimationFrame(processBatch);
  }

  // 选中卫星 - 切换为 Billboard
  selectSatellite(noradId: string, name: string) {
    const point = this.pointMap.get(noradId);
    if (!point) return;

    // 取消之前的选中
    this.deselectSatellite();

    // 隐藏点（设为透明）
    point.color = Cesium.Color.TRANSPARENT;

    // 创建高亮 Billboard
    this.selectedBillboard = this.billboardCollection!.add({
      position: point.position.clone(),
      image: this.createSatelliteIcon(),
      width: 32,
      height: 32,
      scaleByDistance: new Cesium.NearFarScalar(1e7, 1.0, 1e8, 0.5),
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    });

    // 创建标签
    this.selectedLabel = this.labelCollection!.add({
      position: point.position.clone(),
      text: name,
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -20),
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString('rgba(0, 0, 0, 0.7)'),
    });

    this.selectedNoradId = noradId;
  }

  // 取消选中 - 恢复为点
  deselectSatellite() {
    if (this.selectedNoradId) {
      // 恢复点的颜色
      const point = this.pointMap.get(this.selectedNoradId);
      if (point) {
        point.color = Cesium.Color.fromCssColorString('#00ff9d');
      }
    }

    // 移除 Billboard
    if (this.selectedBillboard) {
      this.billboardCollection!.remove(this.selectedBillboard);
      this.selectedBillboard = null;
    }

    // 移除标签
    if (this.selectedLabel) {
      this.labelCollection!.remove(this.selectedLabel);
      this.selectedLabel = null;
    }

    this.selectedNoradId = null;
  }

  // 设置点大小（根据相机高度）
  setPointSize(pixelSize: number) {
    this.pointCollection?.forEach(point => {
      point.pixelSize = pixelSize;
    });
  }

  // 清除所有卫星
  clearAllSatellites() {
    this.pointCollection?.removeAll();
    this.pointMap.clear();
    this.satellitePositions.clear();
    this.deselectSatellite();
  }

  // 获取卫星位置
  getSatellitePosition(noradId: string): Cesium.Cartesian3 | null {
    const point = this.pointMap.get(noradId);
    return point ? point.position.clone() : null;
  }

  // 获取卫星数量
  getSatelliteCount(): number {
    return this.pointMap.size;
  }

  // 销毁
  destroy() {
    this.pointCollection?.removeAll();
    this.billboardCollection?.removeAll();
    this.labelCollection?.removeAll();
    this.pointMap.clear();
    this.satellitePositions.clear();
  }
}

export function useCesium() {
  const viewer = ref<Cesium.Viewer | null>(null);
  const satelliteRenderer = ref<SatelliteRenderer | null>(null);
  const predictedOrbitEntities = new Map();
  const isInitialized = ref(false);

  // 初始化 Cesium 场景
  const initCesium = () => {
    if (isInitialized.value) return;

    viewer.value = new Cesium.Viewer("cesium-container", {
      baseLayerPicker: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      geocoder: false,
      vrButton: false,
      selectionIndicator: false,
      shadows: false,
      scene3DOnly: true,
      useDefaultRenderLoop: true,
      targetFrameRate: 60,
      shouldRender: true,
      contextOptions: {
        webgl: {
          alpha: true,
        },
      },
    });

    // 设置相机视角
    viewer.value.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 20000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });

    // 初始化卫星渲染器
    satelliteRenderer.value = new SatelliteRenderer(viewer.value);

    isInitialized.value = true;
  };

  // 批量更新卫星位置（高性能版本）
  const updateSatellites = (satellites: Satellite[]) => {
    if (!satelliteRenderer.value) return;
    satelliteRenderer.value.updateSatellites(satellites);
  };

  // 清除所有卫星
  const clearAllSatellites = () => {
    if (!satelliteRenderer.value) return;
    satelliteRenderer.value.clearAllSatellites();
  };

  // 更新单个卫星位置（兼容旧接口，但推荐使用 updateSatellites）
  const updateSatellitePosition = (satellite: Satellite) => {
    if (!satelliteRenderer.value) return;
    satelliteRenderer.value.updateSatellites([satellite]);
  };

  // 更新卫星轨道
  const updateOrbit = (noradId: string, orbitPoints: Array<{ lng: number; lat: number; alt: number }>) => {
    if (!viewer.value) return;

    const orbitEntityId = `orbit_${noradId}`;
    const existingOrbit = viewer.value.entities.getById(orbitEntityId);
    if (existingOrbit) {
      viewer.value.entities.remove(existingOrbit);
    }

    const positions = orbitPoints.map((point) =>
      Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt)
    );

    viewer.value.entities.add({
      id: orbitEntityId,
      polyline: {
        positions: positions,
        width: 2,
        material: Cesium.Color.fromCssColorString("#00ffff"),
        clampToGround: false,
      },
    });
  };

  // 显示预测轨道
  const showPredictedOrbit = (
    noradId: string,
    orbitPoints: Array<{ lat: number; lng: number; alt: number }>,
  ) => {
    if (!viewer.value || !orbitPoints.length) return;

    // 清除该卫星之前的预测轨道
    clearPredictedOrbit(noradId);

    // 创建轨道点位置数组
    const positions = orbitPoints.map((point) =>
      Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt),
    );

    // 创建预测轨道线（紫色渐变）
    const orbitEntityId = `predicted_orbit_${noradId}`;
    const orbitEntity = viewer.value.entities.add({
      id: orbitEntityId,
      polyline: {
        positions: positions,
        width: 3,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.fromCssColorString("#a855f7"),
        }),
        clampToGround: false,
      },
    });

    predictedOrbitEntities.set(noradId, orbitEntity);

    // 添加轨道点标记（每隔一定间隔显示一个点）
    const step = Math.max(1, Math.floor(orbitPoints.length / 20));
    for (let i = 0; i < orbitPoints.length; i += step) {
      const point = orbitPoints[i];
      const pointEntityId = `predicted_point_${noradId}_${i}`;

      viewer.value.entities.add({
        id: pointEntityId,
        position: Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt),
        point: {
          pixelSize: 3,
          color: Cesium.Color.fromCssColorString("#a855f7").withAlpha(0.6),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
          outlineWidth: 1,
        },
      });

      predictedOrbitEntities.set(pointEntityId, true);
    }

    // 飞到轨道中心位置
    if (orbitPoints.length > 0) {
      const centerIndex = Math.floor(orbitPoints.length / 2);
      const centerPoint = orbitPoints[centerIndex];
      flyToPosition(centerPoint, orbitPoints[0].alt + 5000000);
    }
  };

  // 清除预测轨道
  const clearPredictedOrbit = (noradId: string) => {
    if (!viewer.value) return;

    // 删除预测轨道线
    const orbitEntityId = `predicted_orbit_${noradId}`;
    const orbitEntity = viewer.value.entities.getById(orbitEntityId);
    if (orbitEntity) {
      viewer.value.entities.remove(orbitEntity);
      predictedOrbitEntities.delete(orbitEntityId);
    }

    // 删除所有预测轨道点
    const keysToRemove: string[] = [];
    predictedOrbitEntities.forEach((_, key) => {
      if (key.toString().startsWith(`predicted_point_${noradId}_`)) {
        const pointEntity = viewer.value!.entities.getById(key);
        if (pointEntity) {
          viewer.value!.entities.remove(pointEntity);
        }
        keysToRemove.push(key as string);
      }
    });
    keysToRemove.forEach((key) => predictedOrbitEntities.delete(key));
  };

  // 清除所有预测轨道
  const clearAllPredictedOrbits = () => {
    if (!viewer.value) return;

    const entitiesToRemove: Cesium.Entity[] = [];
    viewer.value.entities.values.forEach((entity) => {
      if (
        entity.id &&
        (entity.id.toString().startsWith("predicted_orbit_") ||
          entity.id.toString().startsWith("predicted_point_"))
      ) {
        entitiesToRemove.push(entity);
      }
    });

    entitiesToRemove.forEach((entity) => {
      viewer.value!.entities.remove(entity);
    });

    predictedOrbitEntities.clear();
  };

  // 飞到指定位置
  const flyToPosition = (
    position: { lat: number; lng: number; alt: number },
    distance?: number,
  ) => {
    if (!viewer.value) return;

    const { lat, lng, alt } = position;
    const flyDistance = distance || alt + 10000000;

    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, flyDistance),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-60),
        roll: 0,
      },
      duration: 1.5,
    });
  };

  // 显示指定卫星标签（选中卫星）
  const showSatelliteLabel = (noradId: string, name?: string) => {
    if (!satelliteRenderer.value) return;

    // 先取消之前的选中
    satelliteRenderer.value.deselectSatellite();

    // 如果有名称，则选中该卫星
    if (name) {
      satelliteRenderer.value.selectSatellite(noradId, name);
    }
  };

  // 隐藏卫星标签（取消选中）
  const hideSatelliteLabel = () => {
    if (!satelliteRenderer.value) return;
    satelliteRenderer.value.deselectSatellite();
  };

  // 切换视角到卫星
  const flyToSatellite = (satellite: Satellite) => {
    if (!satellite || !viewer.value) return;

    const { position } = satellite;

    if (!position || isNaN(position.lng) || isNaN(position.lat) || isNaN(position.alt)) {
      return;
    }

    const destination = Cesium.Cartesian3.fromDegrees(
      position.lng,
      position.lat,
      position.alt + 20000000,
    );

    viewer.value.camera.flyTo({
      destination: destination,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 2.0,
    });
  };

  // 清除所有轨道
  const clearAllOrbits = () => {
    if (!viewer.value) return;

    const entitiesToRemove: Cesium.Entity[] = [];
    viewer.value.entities.values.forEach((entity) => {
      if (entity.id && entity.id.toString().startsWith("orbit_")) {
        entitiesToRemove.push(entity);
      }
    });
    entitiesToRemove.forEach((entity) => {
      viewer.value!.entities.remove(entity);
    });
  };

  // 清理卫星（兼容旧接口）
  const cleanupSatellites = (currentNoradIds: string[]) => {
    // 新方案中 updateSatellites 已经处理了清理逻辑
    // 这里保留空实现以保持兼容性
  };

  // 销毁
  const destroyCesium = () => {
    if (satelliteRenderer.value) {
      satelliteRenderer.value.destroy();
      satelliteRenderer.value = null;
    }
    if (viewer.value) {
      viewer.value.destroy();
      viewer.value = null;
    }
    predictedOrbitEntities.clear();
    isInitialized.value = false;
  };

  onUnmounted(() => {
    destroyCesium();
  });

  return {
    viewer,
    isInitialized,
    initCesium,
    updateSatellites,
    updateSatellitePosition,
    clearAllSatellites,
    updateOrbit,
    clearAllOrbits,
    flyToSatellite,
    showSatelliteLabel,
    hideSatelliteLabel,
    cleanupSatellites,
    showPredictedOrbit,
    clearPredictedOrbit,
    clearAllPredictedOrbits,
    flyToPosition,
    destroyCesium,
  };
}