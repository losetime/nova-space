# GPU Picking + 延迟悬停检测 - 完整实施方案

## 文件路径
`frontend/src/hooks/useCesium.ts`

---

## 修改 1: 属性声明（约行 83-94）

**删除**：
```typescript
// 屏幕位置缓存（用于悬停检测优化，lazy 计算）
private screenPositionCache: Map<string, { x: number; y: number }> = new Map();
private screenGridIndex: Map<string, Set<string>> = new Map();
private screenCacheDirty = true;
private readonly GRID_SIZE = 50;
```

**替换为**：
```typescript
// 悬停延迟检测
private hoverDelayFrameCount = 0;
private readonly HOVER_DELAY_FRAMES = 3;
private lastMousePosition: Cesium.Cartesian2 | null = null;
private hoverCheckScheduled = false;
```

---

## 修改 2: setupHoverHandler 方法（约行 266-293）

**完整替换为**：
```typescript
// 设置悬停事件处理（GPU Picking + 延迟检测）
private setupHoverHandler() {
  if (this.hoverHandler) {
    this.hoverHandler.destroy();
  }

  this.hoverHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

  this.hoverHandler.setInputAction(
    (movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      this.lastMousePosition = movement.endPosition;
      this.hoverDelayFrameCount = 0;
      
      if (!this.hoverCheckScheduled) {
        this.hoverCheckScheduled = true;
        requestAnimationFrame(this.checkHover);
      }
    },
    Cesium.ScreenSpaceEventType.MOUSE_MOVE
  );
}

// 延迟检测：等待鼠标停下来
private checkHover = () => {
  this.hoverDelayFrameCount++;
  
  if (this.hoverDelayFrameCount >= this.HOVER_DELAY_FRAMES) {
    if (this.lastMousePosition) {
      this.performHoverPick(this.lastMousePosition);
    }
    this.hoverCheckScheduled = false;
  } else {
    requestAnimationFrame(this.checkHover);
  }
};

// GPU Picking 执行
private performHoverPick(screenPosition: Cesium.Cartesian2) {
  const pickedObject = this.viewer.scene.pick(screenPosition);
  let nearbySatellite: string | null = null;

  if (pickedObject?.primitive) {
    nearbySatellite = this.findClickedSatellite(pickedObject.primitive);
  }

  if (nearbySatellite !== this.hoveredNoradId) {
    if (this.hoveredNoradId) {
      this.unhighlightSatellite(this.hoveredNoradId);
    }
    if (nearbySatellite) {
      this.highlightSatellite(nearbySatellite);
      this.hoveredNoradId = nearbySatellite;
    } else {
      this.hoveredNoradId = null;
    }
  }
}
```

---

## 修改 3: 删除整个 findNearbySatelliteForHover 方法（约行 344-390）

删除这个方法，不再需要。

---

## 修改 4: 删除整个 updateScreenGridIndex 方法（约行 392-423）

删除这个方法，不再需要。

---

## 修改 5: updateSatellites 方法中删除缓存标记（约行 510）

找到这行并删除：
```typescript
this.screenCacheDirty = true;  // 删除
```

---

## 修改 6: clearAllSatellites 方法（约行 655-663）

删除这两行：
```typescript
this.screenPositionCache.clear();
this.screenGridIndex.clear();
```

---

## 修改 7: destroy 方法（约行 694-698）

删除这两行：
```typescript
this.screenPositionCache.clear();
this.screenGridIndex.clear();
```

---

## 完整的修改后代码片段

### setupHoverHandler 及新增方法

```typescript
// 设置悬停事件处理（GPU Picking + 延迟检测）
private setupHoverHandler() {
  if (this.hoverHandler) {
    this.hoverHandler.destroy();
  }

  this.hoverHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

  this.hoverHandler.setInputAction(
    (movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      this.lastMousePosition = movement.endPosition;
      this.hoverDelayFrameCount = 0;
      
      if (!this.hoverCheckScheduled) {
        this.hoverCheckScheduled = true;
        requestAnimationFrame(this.checkHover);
      }
    },
    Cesium.ScreenSpaceEventType.MOUSE_MOVE
  );
}

// 延迟检测：等待鼠标停下来
private checkHover = () => {
  this.hoverDelayFrameCount++;
  
  if (this.hoverDelayFrameCount >= this.HOVER_DELAY_FRAMES) {
    if (this.lastMousePosition) {
      this.performHoverPick(this.lastMousePosition);
    }
    this.hoverCheckScheduled = false;
  } else {
    requestAnimationFrame(this.checkHover);
  }
};

// GPU Picking 执行
private performHoverPick(screenPosition: Cesium.Cartesian2) {
  const pickedObject = this.viewer.scene.pick(screenPosition);
  let nearbySatellite: string | null = null;

  if (pickedObject?.primitive) {
    nearbySatellite = this.findClickedSatellite(pickedObject.primitive);
  }

  if (nearbySatellite !== this.hoveredNoradId) {
    if (this.hoveredNoradId) {
      this.unhighlightSatellite(this.hoveredNoradId);
    }
    if (nearbySatellite) {
      this.highlightSatellite(nearbySatellite);
      this.hoveredNoradId = nearbySatellite;
    } else {
      this.hoveredNoradId = null;
    }
  }
}
```

---

## 原理说明

### GPU Picking
- `scene.pick()` 使用 GPU 渲染到离屏缓冲区
- 读取鼠标位置像素，O(1) 复杂度
- 不受卫星数量影响

### 延迟检测
- 鼠标移动时只记录位置，不立即检测
- 等待 3 帧（约 50ms）后才执行
- 快速移动鼠标不会触发检测
- 只有鼠标停下来才执行

---

## 预期性能

| 场景 | 优化前 | 优化后 |
|------|--------|--------|
| 快速移动鼠标 | 每次都计算 | 不计算 |
| 鼠标停下 | O(K) 遍历 | O(1) GPU拾取 |
| 内存占用 | ~450KB 缓存 | 几乎为 0 |