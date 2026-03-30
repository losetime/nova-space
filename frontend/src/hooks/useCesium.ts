import { ref, onUnmounted } from "vue";
import * as Cesium from "cesium";
import satelliteModelUrl from "@/assets/satellite.glb";

interface Satellite {
  noradId: string;
  name: string;
  position: {
    lng: number;
    lat: number;
    alt: number;
  };
}

// 颜色分类类型
export type ColorSchemeType = 'orbit' | 'purpose' | 'country' | 'objectType';

// 图例项
export interface LegendItem {
  color: string;
  label: string;
}

// 轨道类型颜色配置
const ORBIT_COLORS: Record<string, { color: Cesium.Color; label: string }> = {
  LEO: { color: Cesium.Color.fromCssColorString('#00ff88'), label: '低轨 LEO' },
  MEO: { color: Cesium.Color.fromCssColorString('#00d4ff'), label: '中轨 MEO' },
  GEO: { color: Cesium.Color.fromCssColorString('#b366e8'), label: '地球同步 GEO' },
  HEO: { color: Cesium.Color.fromCssColorString('#ffaa00'), label: '大椭圆轨道' },
};

// 轨道类型判断（基于高度，单位：米）
function getOrbitType(alt: number): string {
  if (alt < 2000000) return 'LEO';      // < 2000 km
  if (alt < 35000000) return 'MEO';     // 2000-35000 km
  if (alt < 45000000) return 'GEO';     // 35000-45000 km
  return 'HEO';
}

// 轨道类型图例
const ORBIT_LEGEND: LegendItem[] = [
  { color: '#00ff88', label: '低轨 LEO (<2000km)' },
  { color: '#00d4ff', label: '中轨 MEO (2000-35000km)' },
  { color: '#b366e8', label: '地球同步 GEO (>35000km)' },
  { color: '#ffaa00', label: '大椭圆轨道' },
];

// 卫星渲染器 - PointPrimitive + Model 混合方案
class SatelliteRenderer {
  private viewer: Cesium.Viewer;
  private pointCollection: Cesium.PointPrimitiveCollection | null = null;
  private labelCollection: Cesium.LabelCollection | null = null;

  private pointMap: Map<string, Cesium.PointPrimitive> = new Map();
  private selectedNoradId: string | null = null;
  private selectedModel: Cesium.Entity | null = null;
  private selectedLabel: Cesium.Label | null = null;
  private satellitePositions: Map<string, { name: string; position: Cesium.Cartesian3; alt: number }> =
    new Map();
  private clickHandler: Cesium.ScreenSpaceEventHandler | null = null;
  private onSatelliteClick: ((noradId: string, name: string) => void) | null = null;

  // 悬停相关
  private hoverHandler: Cesium.ScreenSpaceEventHandler | null = null;
  private hoveredNoradId: string | null = null;
  private hoverLabel: Cesium.Label | null = null;

  // 空间网格索引（用于悬停检测优化）
  private spatialGrid: Map<string, Set<string>> = new Map();
  private readonly GRID_SIZE = 100; // 网格大小（像素）

  // 默认卫星样式
  private readonly DEFAULT_PIXEL_SIZE = 3;
  private readonly HOVER_PIXEL_SIZE = 8;
  private readonly DEFAULT_COLOR = Cesium.Color.fromCssColorString("#00ff9d");
  private readonly HOVER_COLOR = Cesium.Color.fromCssColorString("#00ffff");

  // 颜色分类
  private colorScheme: ColorSchemeType = 'orbit';

  // 缓存上一次的卫星 ID 集合（用于增量更新）
  private lastSatelliteIds: Set<string> = new Set();

  // 相机事件监听器
  private cameraListenerRemover: (() => void) | null = null;

  // 可见卫星计数
  visibleCount = 0;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.initialize();
  }

  // 检测卫星是否可见（屏幕范围内）
  private isSatelliteVisible(position: Cesium.Cartesian3): boolean {
    // 屏幕范围检测
    const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(
      this.viewer.scene, position
    );

    // 如果无法转换为屏幕坐标，说明在视野外或被地球遮挡
    if (!screenPos) return false;

    const canvas = this.viewer.scene.canvas;
    const margin = 100; // 边缘余量

    return screenPos.x >= -margin &&
           screenPos.x <= canvas.width + margin &&
           screenPos.y >= -margin &&
           screenPos.y <= canvas.height + margin;
  }

  // 根据相机高度决定渲染策略（LOD）
  private shouldRenderSatellite(alt: number, cameraHeight: number): boolean {
    // 超远视角（> 50000 km）：只渲染 GEO 卫星
    if (cameraHeight > 50000000) {
      return alt >= 35000000; // GEO
    }

    // 远视角（> 20000 km）：渲染 MEO + GEO
    if (cameraHeight > 20000000) {
      return alt >= 2000000; // MEO+
    }

    // 近视角：渲染所有
    return true;
  }

  // 初始化 - 创建两个集合
  initialize() {
    // 1. PointPrimitiveCollection - 所有卫星点
    this.pointCollection = new Cesium.PointPrimitiveCollection();
    this.viewer.scene.primitives.add(this.pointCollection);

    // 2. LabelCollection - 选中的卫星标签
    this.labelCollection = new Cesium.LabelCollection();
    this.viewer.scene.primitives.add(this.labelCollection);

    // 3. 设置点击事件处理
    this.setupClickHandler();

    // 4. 设置悬停事件处理
    this.setupHoverHandler();

    // 5. 设置相机移动监听（更新可见性）
    this.setupCameraListener();
  }

  // 设置相机移动监听
  private setupCameraListener() {
    // 使用节流避免频繁更新
    let lastUpdateTime = 0;
    const updateInterval = 200; // 200ms 节流

    this.cameraListenerRemover = this.viewer.camera.changed.addEventListener(() => {
      const now = Date.now();
      if (now - lastUpdateTime > updateInterval) {
        lastUpdateTime = now;
        this.updateVisibility();
      }
    });
  }

  // 设置点击事件处理
  private setupClickHandler() {
    if (this.clickHandler) {
      this.clickHandler.destroy();
    }

    this.clickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // 处理点击事件
    this.clickHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const clickedPosition = event.position;
      const pickedObject = this.viewer.scene.pick(clickedPosition);

      // 检查是否点击了卫星点
      if (pickedObject && pickedObject.primitive) {
        // 遍历查找匹配的卫星
        const clickedNoradId = this.findClickedSatellite(pickedObject.primitive);
        if (clickedNoradId) {
          const satInfo = this.satellitePositions.get(clickedNoradId);
          if (satInfo && this.onSatelliteClick) {
            this.onSatelliteClick(clickedNoradId, satInfo.name);
          }
          return;
        }
      }

      // 如果没有直接点击到卫星点，尝试通过距离检测
      const nearbySatellite = this.findNearbySatellite(clickedPosition);
      if (nearbySatellite) {
        const satInfo = this.satellitePositions.get(nearbySatellite);
        if (satInfo && this.onSatelliteClick) {
          this.onSatelliteClick(nearbySatellite, satInfo.name);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  // 查找被点击的卫星
  private findClickedSatellite(primitive: any): string | null {
    for (const [noradId, point] of this.pointMap.entries()) {
      if (point === primitive) {
        return noradId;
      }
    }
    return null;
  }

  // 通过屏幕坐标查找附近的卫星（像素距离检测）
  private findNearbySatellite(screenPosition: Cesium.Cartesian2): string | null {
    const maxDistance = 15; // 最大点击距离（像素）
    let closestNoradId: string | null = null;
    let closestDistance = maxDistance;

    for (const [noradId, satInfo] of this.satellitePositions.entries()) {
      // 将卫星世界坐标转换为屏幕坐标
      const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(
        this.viewer.scene,
        satInfo.position
      );

      if (screenPos) {
        const distance = Math.sqrt(
          Math.pow(screenPos.x - screenPosition.x, 2) +
          Math.pow(screenPos.y - screenPosition.y, 2)
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestNoradId = noradId;
        }
      }
    }

    return closestNoradId;
  }

  // 设置卫星点击回调
  setOnSatelliteClick(callback: (noradId: string, name: string) => void) {
    this.onSatelliteClick = callback;
  }

  // 设置悬停事件处理
  private setupHoverHandler() {
    if (this.hoverHandler) {
      this.hoverHandler.destroy();
    }

    this.hoverHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // 处理鼠标移动事件
    this.hoverHandler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      const mousePosition = movement.endPosition;
      const nearbySatellite = this.findNearbySatelliteForHover(mousePosition);

      if (nearbySatellite !== this.hoveredNoradId) {
        // 取消之前的高亮
        if (this.hoveredNoradId) {
          this.unhighlightSatellite(this.hoveredNoradId);
        }

        // 高亮新的卫星
        if (nearbySatellite) {
          this.highlightSatellite(nearbySatellite);
          this.hoveredNoradId = nearbySatellite;
        } else {
          this.hoveredNoradId = null;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  // 高亮卫星（变大、改变颜色、发光效果）
  private highlightSatellite(noradId: string) {
    const point = this.pointMap.get(noradId);
    if (point && noradId !== this.selectedNoradId) {
      point.pixelSize = this.HOVER_PIXEL_SIZE;
      point.color = this.HOVER_COLOR;
      // 发光效果
      point.outlineWidth = 4;
      point.outlineColor = Cesium.Color.fromCssColorString("#00ffff").withAlpha(0.6);
    }

    // 显示悬停标签（卫星下方居中）
    const satInfo = this.satellitePositions.get(noradId);
    if (satInfo && this.labelCollection) {
      this.hoverLabel = this.labelCollection.add({
        position: satInfo.position,
        text: satInfo.name,
        font: "12px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.TOP,  // 标签顶部对齐卫星
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,  // 水平居中
        pixelOffset: new Cesium.Cartesian2(0, 15),  // 向下偏移
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
      });
    }
  }

  // 取消高亮卫星
  private unhighlightSatellite(noradId: string) {
    const point = this.pointMap.get(noradId);
    if (point && noradId !== this.selectedNoradId) {
      point.pixelSize = this.DEFAULT_PIXEL_SIZE;
      point.color = this.DEFAULT_COLOR;
      // 移除发光效果
      point.outlineWidth = 0;
    }

    // 移除悬停标签
    if (this.hoverLabel && this.labelCollection) {
      this.labelCollection.remove(this.hoverLabel);
      this.hoverLabel = null;
    }
  }

  // 查找鼠标附近的卫星（用于悬停检测，使用空间网格优化）
  private findNearbySatelliteForHover(screenPosition: Cesium.Cartesian2): string | null {
    const maxDistance = 20; // 悬停检测范围（像素）
    let closestNoradId: string | null = null;
    let closestDistance = maxDistance;

    // 使用空间网格优化：只检测当前网格及相邻网格中的卫星
    const gridX = Math.floor(screenPosition.x / this.GRID_SIZE);
    const gridY = Math.floor(screenPosition.y / this.GRID_SIZE);

    // 检查当前网格及相邻 8 个网格
    const candidates: Set<string> = new Set();
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cell = this.spatialGrid.get(key);
        if (cell) {
          cell.forEach(id => candidates.add(id));
        }
      }
    }

    // 如果网格中没有候选卫星，返回 null
    if (candidates.size === 0) {
      return null;
    }

    // 只检测候选卫星
    for (const noradId of candidates) {
      // 跳过已选中的卫星
      if (noradId === this.selectedNoradId) continue;

      const satInfo = this.satellitePositions.get(noradId);
      if (!satInfo) continue;

      const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(
        this.viewer.scene,
        satInfo.position
      );

      if (screenPos) {
        const distance = Math.sqrt(
          Math.pow(screenPos.x - screenPosition.x, 2) +
          Math.pow(screenPos.y - screenPosition.y, 2)
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestNoradId = noradId;
        }
      }
    }

    return closestNoradId;
  }

  // 更新空间网格索引
  private updateSpatialGrid() {
    this.spatialGrid.clear();

    for (const [noradId, satInfo] of this.satellitePositions.entries()) {
      const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(
        this.viewer.scene,
        satInfo.position
      );

      if (screenPos) {
        const gridX = Math.floor(screenPos.x / this.GRID_SIZE);
        const gridY = Math.floor(screenPos.y / this.GRID_SIZE);
        const key = `${gridX},${gridY}`;

        if (!this.spatialGrid.has(key)) {
          this.spatialGrid.set(key, new Set());
        }
        this.spatialGrid.get(key)!.add(noradId);
      }
    }
  }

  // 批量更新卫星位置（增量更新 + 可见性优化）
  updateSatellites(satellites: Satellite[], batchSize: number = 1000) {
    const currentIds = new Set(satellites.map((s) => s.noradId));
    const cameraHeight = this.viewer.camera.positionCartographic.height;

    // 增量更新：只处理新增和删除的卫星
    const idsToRemove: string[] = [];

    // 找出需要删除的卫星
    this.lastSatelliteIds.forEach(id => {
      if (!currentIds.has(id)) {
        idsToRemove.push(id);
      }
    });

    // 删除不在新列表中的卫星
    idsToRemove.forEach((id) => {
      const point = this.pointMap.get(id);
      if (point && this.pointCollection) {
        this.pointCollection.remove(point);
      }
      this.pointMap.delete(id);
      this.satellitePositions.delete(id);
    });

    // 更新所有卫星
    this.visibleCount = 0;

    satellites.forEach(sat => {
      const position = Cesium.Cartesian3.fromDegrees(
        sat.position.lng,
        sat.position.lat,
        sat.position.alt,
      );

      // LOD 检测（根据相机高度决定是否渲染）
      const shouldRender = this.shouldRenderSatellite(sat.position.alt, cameraHeight);

      // 可见性检测
      const isVisible = shouldRender && this.isSatelliteVisible(position);

      // 获取颜色（基于分类方式）
      const color = this.getSatelliteColor(sat);

      if (this.pointMap.has(sat.noradId)) {
        // 更新现有点的位置和可见性
        const point = this.pointMap.get(sat.noradId)!;
        point.position = position;
        point.show = isVisible;

        // 更新颜色
        if (sat.noradId !== this.selectedNoradId && sat.noradId !== this.hoveredNoradId) {
          point.color = color;
        }

        // 如果是选中的卫星，同步更新 Model 和 Label 位置
        if (sat.noradId === this.selectedNoradId) {
          if (this.selectedModel) {
            this.selectedModel.position = new Cesium.ConstantPositionProperty(position);
          }
          if (this.selectedLabel) {
            this.selectedLabel.position = position;
          }
        }
      } else {
        // 创建新点
        const point = this.pointCollection!.add({
          position,
          pixelSize: this.DEFAULT_PIXEL_SIZE,
          color,
          show: isVisible,
        });
        this.pointMap.set(sat.noradId, point);
      }

      if (isVisible) this.visibleCount++;

      // 存储卫星位置和名称（用于选中逻辑）
      this.satellitePositions.set(sat.noradId, { name: sat.name, position, alt: sat.position.alt });
    });

    // 更新缓存
    this.lastSatelliteIds = currentIds;

    // 更新空间网格索引（仅用于悬停检测）
    this.updateSpatialGrid();
  }

  // 相机移动时更新可见性
  updateVisibility() {
    const cameraHeight = this.viewer.camera.positionCartographic.height;
    this.visibleCount = 0;

    this.satellitePositions.forEach((satInfo, noradId) => {
      const point = this.pointMap.get(noradId);
      if (!point) return;

      // LOD 检测
      const shouldRender = this.shouldRenderSatellite(satInfo.alt, cameraHeight);

      // 可见性检测
      const isVisible = shouldRender && this.isSatelliteVisible(satInfo.position);
      point.show = isVisible;

      if (isVisible) this.visibleCount++;
    });

    // 更新空间网格索引
    this.updateSpatialGrid();
  }

  // 获取可见卫星数量
  getVisibleCount(): number {
    return this.visibleCount;
  }

  // 获取卫星颜色（基于分类方式）
  private getSatelliteColor(sat: Satellite): Cesium.Color {
    if (this.colorScheme === 'orbit') {
      const orbitType = getOrbitType(sat.position.alt);
      return ORBIT_COLORS[orbitType]?.color || this.DEFAULT_COLOR;
    }
    // 其他分类方式可以在这里扩展
    return this.DEFAULT_COLOR;
  }

  // 设置颜色分类方式
  setColorScheme(scheme: ColorSchemeType) {
    this.colorScheme = scheme;
    // 更新所有卫星的颜色
    this.refreshAllColors();
  }

  // 刷新所有卫星颜色
  private refreshAllColors() {
    this.satellitePositions.forEach((satInfo, noradId) => {
      const point = this.pointMap.get(noradId);
      if (point && noradId !== this.selectedNoradId && noradId !== this.hoveredNoradId) {
        const color = this.getSatelliteColor({ noradId, name: satInfo.name, position: { lng: 0, lat: 0, alt: satInfo.alt } });
        point.color = color;
      }
    });
  }

  // 获取当前分类的图例
  getLegend(): LegendItem[] {
    if (this.colorScheme === 'orbit') {
      return ORBIT_LEGEND;
    }
    // 其他分类方式的图例
    return [];
  }

  // 选中卫星 - 切换为 3D 模型
  selectSatellite(noradId: string, name: string) {
    const point = this.pointMap.get(noradId);
    if (!point) return;

    // 取消之前的选中
    this.deselectSatellite();

    // 清除悬停效果（如果正在悬停的是当前卫星）
    if (this.hoveredNoradId === noradId) {
      this.hoveredNoradId = null;
      // 移除悬停标签
      if (this.hoverLabel && this.labelCollection) {
        this.labelCollection.remove(this.hoverLabel);
        this.hoverLabel = null;
      }
    }

    // 清除点的样式（防止之前 hover 的发光效果残留）
    point.pixelSize = this.DEFAULT_PIXEL_SIZE;
    point.outlineWidth = 0;
    // 隐藏点（设为透明）
    point.color = Cesium.Color.TRANSPARENT;

    // 创建 3D 模型 Entity
    this.selectedModel = this.viewer.entities.add({
      id: `selected_model_${noradId}`,
      position: point.position.clone(),
      orientation: Cesium.Transforms.headingPitchRollQuaternion(
        point.position.clone(),
        new Cesium.HeadingPitchRoll(
          Cesium.Math.toRadians(120),
          Cesium.Math.toRadians(-20),
          Cesium.Math.toRadians(30),
        ),
      ),
      model: {
        uri: satelliteModelUrl,
        minimumPixelSize: 64,
        maximumScale: 50000,
        scale: 500,
      },
    });

    // 创建标签（模型下方居中）
    this.selectedLabel = this.labelCollection!.add({
      position: point.position.clone(),
      text: name,
      font: "14px sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, 50),
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
    });

    this.selectedNoradId = noradId;
  }

  // 取消选中 - 恢复为点
  deselectSatellite() {
    if (this.selectedNoradId) {
      // 恢复点的样式
      const point = this.pointMap.get(this.selectedNoradId);
      if (point) {
        point.pixelSize = this.DEFAULT_PIXEL_SIZE;
        point.color = this.DEFAULT_COLOR;
      }
    }

    // 移除 3D 模型
    if (this.selectedModel) {
      this.viewer.entities.remove(this.selectedModel);
      this.selectedModel = null;
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
    if (!this.pointCollection) return;
    // PointPrimitiveCollection 没有forEach，使用 pointMap 遍历
    this.pointMap.forEach((point) => {
      point.pixelSize = pixelSize;
    });
  }

  // 清除所有卫星
  clearAllSatellites() {
    this.pointCollection?.removeAll();
    this.pointMap.clear();
    this.satellitePositions.clear();
    this.spatialGrid.clear();
    this.lastSatelliteIds.clear();
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
    if (this.cameraListenerRemover) {
      this.cameraListenerRemover();
      this.cameraListenerRemover = null;
    }
    if (this.clickHandler) {
      this.clickHandler.destroy();
      this.clickHandler = null;
    }
    if (this.hoverHandler) {
      this.hoverHandler.destroy();
      this.hoverHandler = null;
    }
    this.pointCollection?.removeAll();
    this.labelCollection?.removeAll();
    if (this.selectedModel) {
      this.viewer.entities.remove(this.selectedModel);
      this.selectedModel = null;
    }
    this.pointMap.clear();
    this.satellitePositions.clear();
    this.spatialGrid.clear();
    this.lastSatelliteIds.clear();
  }
}

export function useCesium() {
  const viewer = ref<Cesium.Viewer | null>(null);
  const satelliteRenderer = ref<SatelliteRenderer | null>(null);
  const predictedOrbitEntities = new Map();
  const isInitialized = ref(false);

  // 轨道线集合（使用 PolylineCollection 提升性能）
  let orbitCollection: Cesium.PolylineCollection | null = null;
  const orbitPolylines: Map<string, Cesium.Polyline> = new Map();

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

    // 初始化轨道线集合
    orbitCollection = new Cesium.PolylineCollection();
    viewer.value.scene.primitives.add(orbitCollection);

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

  // 更新卫星轨道（使用 PolylineCollection 优化）
  const updateOrbit = (
    noradId: string,
    orbitPoints: Array<{ lng: number; lat: number; alt: number }>,
  ) => {
    if (!viewer.value || !orbitCollection) return;

    const orbitId = `orbit_${noradId}`;

    // 如果已存在，先移除
    const existingOrbit = orbitPolylines.get(orbitId);
    if (existingOrbit) {
      orbitCollection.remove(existingOrbit);
      orbitPolylines.delete(orbitId);
    }

    // 创建新的轨道线
    const positions = orbitPoints.map((point) =>
      Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt),
    );

    const polyline = orbitCollection.add({
      show: true,
      positions: positions,
      width: 2,
      material: Cesium.Material.fromType('Color', {
        color: Cesium.Color.CYAN
      }),
    });

    orbitPolylines.set(orbitId, polyline);
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

    // 不自动飞行，保持相机当前位置
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

  // 过境轨迹实体存储
  const passTrajectoryEntities = new Map<string, boolean>();

  // 显示过境轨迹
  const showPassTrajectory = (
    noradId: string,
    orbitPoints: Array<{ lat: number; lng: number; alt: number; timestamp?: string }>,
    observer: { lat: number; lng: number; alt: number },
    passInfo?: { startTime: string; endTime: string; maxElevationTime?: string }
  ) => {
    if (!viewer.value || !orbitPoints.length) return;

    // 清除之前的过境轨迹
    clearPassTrajectory();

    // 1. 绘制过境轨迹线（渐变色）
    const trajectoryId = `pass_trajectory_${noradId}`;

    // 创建渐变颜色的轨迹线
    const positions: Cesium.Cartesian3[] = [];
    const colors: Cesium.Color[] = [];

    orbitPoints.forEach((point, index) => {
      positions.push(Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt));

      // 颜色根据位置渐变：开始(蓝) -> 中间(青) -> 结束(蓝)
      const ratio = index / (orbitPoints.length - 1);
      const color = ratio < 0.5
        ? Cesium.Color.lerp(
            Cesium.Color.fromCssColorString("#3b82f6"), // 蓝色
            Cesium.Color.fromCssColorString("#00ff88"), // 青绿色
            ratio * 2,
            new Cesium.Color()
          )
        : Cesium.Color.lerp(
            Cesium.Color.fromCssColorString("#00ff88"),
            Cesium.Color.fromCssColorString("#3b82f6"),
            (ratio - 0.5) * 2,
            new Cesium.Color()
          );
      colors.push(color);
    });

    // 使用 PolylineOutlineMaterialProperty 创建轨迹线
    viewer.value.entities.add({
      id: trajectoryId,
      polyline: {
        positions: positions,
        width: 4,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.4,
          color: Cesium.Color.fromCssColorString("#00ff88"),
        }),
        clampToGround: false,
      },
    });
    passTrajectoryEntities.set(trajectoryId, true);

    // 2. 标记观察者位置
    const observerId = `pass_observer_${noradId}`;
    viewer.value.entities.add({
      id: observerId,
      position: Cesium.Cartesian3.fromDegrees(observer.lng, observer.lat, observer.alt),
      point: {
        pixelSize: 12,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: '观察者',
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -15),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    passTrajectoryEntities.set(observerId, true);

    // 3. 标记起始点
    if (orbitPoints.length > 0) {
      const startPoint = orbitPoints[0];
      const startId = `pass_start_${noradId}`;
      viewer.value.entities.add({
        id: startId,
        position: Cesium.Cartesian3.fromDegrees(startPoint.lng, startPoint.lat, startPoint.alt),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString("#3b82f6"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
        },
        label: {
          text: '开始',
          font: '12px sans-serif',
          fillColor: Cesium.Color.fromCssColorString("#3b82f6"),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
        },
      });
      passTrajectoryEntities.set(startId, true);
    }

    // 4. 标记结束点
    if (orbitPoints.length > 1) {
      const endPoint = orbitPoints[orbitPoints.length - 1];
      const endId = `pass_end_${noradId}`;
      viewer.value.entities.add({
        id: endId,
        position: Cesium.Cartesian3.fromDegrees(endPoint.lng, endPoint.lat, endPoint.alt),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString("#3b82f6"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
        },
        label: {
          text: '结束',
          font: '12px sans-serif',
          fillColor: Cesium.Color.fromCssColorString("#3b82f6"),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
        },
      });
      passTrajectoryEntities.set(endId, true);
    }

    // 5. 标记最高点（轨道中点附近）
    const midIndex = Math.floor(orbitPoints.length / 2);
    if (midIndex > 0 && midIndex < orbitPoints.length) {
      const maxPoint = orbitPoints[midIndex];
      const maxId = `pass_max_${noradId}`;
      viewer.value.entities.add({
        id: maxId,
        position: Cesium.Cartesian3.fromDegrees(maxPoint.lng, maxPoint.lat, maxPoint.alt),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString("#00ff88"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: '最高点',
          font: '12px sans-serif',
          fillColor: Cesium.Color.fromCssColorString("#00ff88"),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
        },
      });
      passTrajectoryEntities.set(maxId, true);
    }

    // 6. 飞到轨迹视图（确保地球和轨迹都可见）
    // 计算所有点的包围球，然后调整相机位置
    const allPoints = [
      Cesium.Cartesian3.fromDegrees(observer.lng, observer.lat, observer.alt),
      ...orbitPoints.map(p => Cesium.Cartesian3.fromDegrees(p.lng, p.lat, p.alt))
    ];

    // 使用观察者位置作为参考点
    const observerPosition = Cesium.Cartesian3.fromDegrees(observer.lng, observer.lat, 0);
    const boundingSphere = Cesium.BoundingSphere.fromPoints(allPoints);

    // 飞到包围球，确保所有内容可见
    viewer.value.camera.flyToBoundingSphere(boundingSphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),   // heading: 正北
        Cesium.Math.toRadians(-45), // pitch: 俯视45度
        boundingSphere.radius * 3   // range: 3倍包围球半径，确保地球可见
      ),
      duration: 1.5,
    });
  };

  // 清除过境轨迹
  const clearPassTrajectory = () => {
    if (!viewer.value) return;

    passTrajectoryEntities.forEach((_, key) => {
      const entity = viewer.value!.entities.getById(key);
      if (entity) {
        viewer.value!.entities.remove(entity);
      }
    });
    passTrajectoryEntities.clear();
  };

  // ==================== 时间轴动画 ====================

  // 动画状态
  const animationState = ref({
    isPlaying: false,
    progress: 0, // 0-100
    currentTime: '',
    startTime: '',
    endTime: '',
    duration: 0, // 秒
  });

  // 动画相关实体
  let animationEntity: Cesium.Entity | null = null;
  let animationClockCallback: (() => void) | null = null;

  // 播放过境动画
  const playPassAnimation = (
    noradId: string,
    orbitPoints: Array<{ lat: number; lng: number; alt: number; timestamp?: string }>,
    options?: {
      speed?: number; // 播放速度倍数，默认 60（1秒=1分钟）
    }
  ) => {
    if (!viewer.value || !orbitPoints.length) return;

    // 停止之前的动画
    stopPassAnimation();

    const speed = options?.speed || 60; // 默认 60 倍速

    // 创建时间采样位置属性
    const positionProperty = new Cesium.SampledPositionProperty();

    orbitPoints.forEach((point) => {
      if (point.timestamp) {
        const time = Cesium.JulianDate.fromIso8601(point.timestamp);
        const position = Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.alt);
        positionProperty.addSample(time, position);
      }
    });

    // 获取时间范围
    const startTime = Cesium.JulianDate.fromIso8601(orbitPoints[0].timestamp!);
    const stopTime = Cesium.JulianDate.fromIso8601(orbitPoints[orbitPoints.length - 1].timestamp!);

    // 设置时钟
    const clock = viewer.value.clock;
    clock.startTime = startTime.clone();
    clock.stopTime = stopTime.clone();
    clock.currentTime = startTime.clone();
    clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    clock.multiplier = speed;
    clock.shouldAnimate = true;

    // 创建移动的卫星实体
    animationEntity = viewer.value.entities.add({
      id: `pass_animation_${noradId}`,
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: startTime,
          stop: stopTime,
        }),
      ]),
      position: positionProperty,
      model: {
        uri: satelliteModelUrl,
        minimumPixelSize: 32,
        maximumScale: 50000,
        scale: 20000,
      },
      path: {
        resolution: 60,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.fromCssColorString("#00ff88"),
        }),
        width: 3,
        leadTime: 0,
        trailTime: 300, // 显示5分钟的轨迹
      },
    });

    // 更新动画状态
    animationState.value.isPlaying = true;
    animationState.value.progress = 0;
    animationState.value.startTime = Cesium.JulianDate.toIso8601(startTime);
    animationState.value.endTime = Cesium.JulianDate.toIso8601(stopTime);
    animationState.value.duration = Cesium.JulianDate.secondsDifference(stopTime, startTime);

    // 设置时钟回调更新进度
    animationClockCallback = () => {
      if (!viewer.value) return;

      const currentTime = viewer.value.clock.currentTime;
      const progress = Cesium.JulianDate.secondsDifference(currentTime, startTime) /
                       Cesium.JulianDate.secondsDifference(stopTime, startTime);

      animationState.value.progress = Math.max(0, Math.min(100, progress * 100));
      animationState.value.currentTime = Cesium.JulianDate.toIso8601(currentTime);

      // 动画结束时停止
      if (progress >= 1) {
        stopPassAnimation();
      }
    };

    viewer.value.clock.onTick.addEventListener(animationClockCallback);

    // 飞到轨迹视图（保持地球居中，不再自动飞行）
    // 动画播放时保持当前视角，避免相机跳动
  };

  // 停止动画
  const stopPassAnimation = () => {
    if (!viewer.value) return;

    // 移除时钟回调
    if (animationClockCallback) {
      viewer.value.clock.onTick.removeEventListener(animationClockCallback);
      animationClockCallback = null;
    }

    // 移除动画实体
    if (animationEntity) {
      viewer.value.entities.remove(animationEntity);
      animationEntity = null;
    }

    // 停止时钟动画
    viewer.value.clock.shouldAnimate = false;

    // 更新状态
    animationState.value.isPlaying = false;
  };

  // 暂停/继续动画
  const toggleAnimationPause = () => {
    if (!viewer.value) return;
    viewer.value.clock.shouldAnimate = !viewer.value.clock.shouldAnimate;
    animationState.value.isPlaying = viewer.value.clock.shouldAnimate;
  };

  // 设置动画进度（0-100）
  const setAnimationProgress = (progress: number) => {
    if (!viewer.value) return;

    const startTime = viewer.value.clock.startTime;
    const stopTime = viewer.value.clock.stopTime;
    const totalSeconds = Cesium.JulianDate.secondsDifference(stopTime, startTime);
    const targetSeconds = (progress / 100) * totalSeconds;

    const newTime = Cesium.JulianDate.addSeconds(startTime, targetSeconds, new Cesium.JulianDate());
    viewer.value.clock.currentTime = newTime;
    animationState.value.progress = progress;
    animationState.value.currentTime = Cesium.JulianDate.toIso8601(newTime);
  };

  // 设置播放速度
  const setAnimationSpeed = (speed: number) => {
    if (!viewer.value) return;
    viewer.value.clock.multiplier = speed;
  };

  // ==================== 天空投影视角 ====================

  // 天空投影相关实体
  const skyViewEntities = new Map<string, boolean>();

  // 切换到天空投影视角
  const flyToSkyView = (observer: { lat: number; lng: number; alt: number }) => {
    if (!viewer.value) return;

    // 清除之前的天空投影标记
    clearSkyView();

    // 相机飞到观察者位置，仰视天空
    // 将相机放在观察者上方约 100 米处，向下看
    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        observer.lng,
        observer.lat,
        observer.alt + 100 // 观察者上方 100 米
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90), // 仰视天空
        roll: 0,
      },
      duration: 2,
    });

    // 绘制地平圈参考线
    drawHorizonCircle(observer);

    // 绘制方位角参考线
    drawAzimuthLines(observer);

    // 标记观察者位置
    const observerId = 'sky_observer';
    viewer.value.entities.add({
      id: observerId,
      position: Cesium.Cartesian3.fromDegrees(observer.lng, observer.lat, observer.alt),
      point: {
        pixelSize: 8,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
    });
    skyViewEntities.set(observerId, true);
  };

  // 绘制地平圈（高度角 0° 的圆）
  const drawHorizonCircle = (observer: { lat: number; lng: number; alt: number }) => {
    if (!viewer.value) return;

    // 地平圈半径（根据观察者高度计算，约 5km）
    const radius = 5000;
    const points: Cesium.Cartesian3[] = [];

    for (let i = 0; i <= 360; i += 5) {
      const heading = Cesium.Math.toRadians(i);
      // 使用地面距离计算
      const position = Cesium.Cartesian3.fromDegrees(
        observer.lng + (radius * Math.sin(heading)) / 111000,
        observer.lat + (radius * Math.cos(heading)) / 111000,
        observer.alt
      );
      points.push(position);
    }

    const horizonId = 'sky_horizon';
    viewer.value.entities.add({
      id: horizonId,
      polyline: {
        positions: points,
        width: 2,
        material: Cesium.Color.CYAN.withAlpha(0.5),
        clampToGround: false,
      },
    });
    skyViewEntities.set(horizonId, true);
  };

  // 绘制方位角参考线（北、东、南、西）
  const drawAzimuthLines = (observer: { lat: number; lng: number; alt: number }) => {
    if (!viewer.value) return;

    const radius = 5000; // 与地平圈相同
    const directions = [
      { angle: 0, label: '北' },
      { angle: 90, label: '东' },
      { angle: 180, label: '南' },
      { angle: 270, label: '西' },
    ];

    directions.forEach(({ angle, label }) => {
      const rad = Cesium.Math.toRadians(angle);
      const endLng = observer.lng + (radius * Math.sin(rad)) / 111000;
      const endLat = observer.lat + (radius * Math.cos(rad)) / 111000;

      // 绘制方位线
      const lineId = `sky_azimuth_${angle}`;
      viewer.value!.entities.add({
        id: lineId,
        polyline: {
          positions: [
            Cesium.Cartesian3.fromDegrees(observer.lng, observer.lat, observer.alt),
            Cesium.Cartesian3.fromDegrees(endLng, endLat, observer.alt),
          ],
          width: 1,
          material: Cesium.Color.WHITE.withAlpha(0.3),
        },
      });
      skyViewEntities.set(lineId, true);

      // 添加方位标签
      const labelId = `sky_label_${angle}`;
      viewer.value!.entities.add({
        id: labelId,
        position: Cesium.Cartesian3.fromDegrees(endLng, endLat, observer.alt + 10),
        label: {
          text: label,
          font: '14px sans-serif',
          fillColor: Cesium.Color.CYAN,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
      });
      skyViewEntities.set(labelId, true);
    });
  };

  // 清除天空投影标记
  const clearSkyView = () => {
    if (!viewer.value) return;

    skyViewEntities.forEach((_, key) => {
      const entity = viewer.value!.entities.getById(key);
      if (entity) {
        viewer.value!.entities.remove(entity);
      }
    });
    skyViewEntities.clear();
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
    if (!orbitCollection) return;

    orbitCollection.removeAll();
    orbitPolylines.clear();
  };

  // 清理卫星（兼容旧接口）
  const cleanupSatellites = (currentNoradIds: string[]) => {
    // 新方案中 updateSatellites 已经处理了清理逻辑
    // 这里保留空实现以保持兼容性
  };

  // 设置卫星点击回调
  const setOnSatelliteClick = (callback: (noradId: string, name: string) => void) => {
    if (satelliteRenderer.value) {
      satelliteRenderer.value.setOnSatelliteClick(callback);
    }
  };

  // 设置颜色分类方式
  const setColorScheme = (scheme: ColorSchemeType) => {
    if (satelliteRenderer.value) {
      satelliteRenderer.value.setColorScheme(scheme);
    }
  };

  // 获取图例
  const getLegend = (): LegendItem[] => {
    if (satelliteRenderer.value) {
      return satelliteRenderer.value.getLegend();
    }
    return [];
  };

  // 销毁
  const destroyCesium = () => {
    if (satelliteRenderer.value) {
      satelliteRenderer.value.destroy();
      satelliteRenderer.value = null;
    }
    if (orbitCollection) {
      viewer.value?.scene.primitives.remove(orbitCollection);
      orbitCollection = null;
      orbitPolylines.clear();
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
    showPassTrajectory,
    clearPassTrajectory,
    animationState,
    playPassAnimation,
    stopPassAnimation,
    toggleAnimationPause,
    setAnimationProgress,
    setAnimationSpeed,
    flyToSkyView,
    clearSkyView,
    flyToPosition,
    destroyCesium,
    setOnSatelliteClick,
    setColorScheme,
    getLegend,
    getVisibleCount: () => satelliteRenderer.value?.getVisibleCount() ?? 0,
  };
}
