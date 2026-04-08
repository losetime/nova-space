# GPU Picking + 延迟悬停检测优化计划

## 目标
使用 Cesium 的 `scene.pick()` GPU 加速拾取 + 延迟检测，替代当前的屏幕网格索引方案

## 修改文件
`frontend/src/hooks/useCesium.ts`

---

## 变更详情

### 1. 删除屏幕网格索引相关代码

**删除属性声明（约行 86-91）**：
```typescript
// 删除这些
private screenPositionCache: Map<string, { x: number; y: number }> = new Map();
private screenGridIndex: Map<string, Set<string>> = new Map();
private screenCacheDirty = true;
private readonly GRID_SIZE = 50;
```

**替换为延迟检测属性**：
```typescript
// 悬停延迟检测
private hoverDelayFrameCount = 0;
private readonly HOVER_DELAY_FRAMES = 3;
private lastMousePosition: Cesium.Cartesian2 | null = null;
private hoverCheckScheduled = false;
```

---

### 2. 删除 updateScreenGridIndex 方法（约行 392-423）

整个方法删除，不再需要。

---

### 3. 删除 findNearbySatelliteForHover 方法（约行 344-390）

整个方法删除，用 GPU Picking 替代。

---

### 4. 修改 setupHoverHandler 方法（约行 266-293）

**当前代码**（已注释）：
```typescript
private setupHoverHandler() {
  if (this.hoverHandler) {
    this.hoverHandler.destroy();
  }
  // 悬停功能暂时关闭
  // ...
}
```

**替换为**：
```typescript
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

### 5. 删除 updateSatellites 中的缓存标记（约行 510）

**删除**：
```typescript
this.screenCacheDirty = true;  // 删除这行
```

---

### 6. 修改 clearAllSatellites（约行 655-663）

**删除**：
```typescript
this.screenPositionCache.clear();
this.screenGridIndex.clear();
```

---

### 7. 修改 destroy 方法（约行 694-698）

**删除**：
```typescript
this.screenPositionCache.clear();
this.screenGridIndex.clear();
```

---

## 性能预期

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 悬停检测复杂度 | O(N) 或 O(K) | O(1) |
| 高频鼠标移动 | 每次都计算 | 延迟 3 帧后计算 |
| 内存占用 | 屏幕缓存 ~450KB | 几乎为 0 |

---

## 实施步骤

1. 修改属性声明
2. 删除 `updateScreenGridIndex` 方法
3. 删除 `findNearbySatelliteForHover` 方法
4. 重写 `setupHoverHandler` 方法
5. 添加 `checkHover` 和 `performHoverPick` 方法
6. 清理其他引用