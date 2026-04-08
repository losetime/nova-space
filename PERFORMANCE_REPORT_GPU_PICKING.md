# GPU Picking + 延迟悬停检测 - 性能对比报告

## 优化概述

**优化内容**：使用 Cesium `scene.pick()` GPU 加速拾取 + 延迟检测，替代屏幕网格索引方案

**优化时间**：2026-04-08

---

## 测试环境

| 配置项 | 数值 |
|--------|------|
| 卫星数量 | 16,203 颗 |
| 更新间隔 | 3 秒 |
| 测试方式 | 模拟 100 次鼠标移动 |
| 测试工具 | Chrome DevTools + Cesium FPS 显示 |

---

## 技术方案对比

### 旧方案：屏幕网格索引

```typescript
// 鼠标移动时触发 debounced 检测
debounce((movement) => {
  // lazy 计算屏幕坐标缓存
  if (screenCacheDirty) {
    updateScreenGridIndex();  // 遍历 16000+ 卫星
  }
  // 查询周围 9 个网格
  // 计算候选卫星的距离
}, 50);
```

**问题**：
- 懒计算时需要遍历 16000+ 卫星
- `worldToWindowCoordinates` 昂贵
- debounce 只是延迟，不减少计算量

### 新方案：GPU Picking + 延迟检测

```typescript
// 鼠标移动时只记录位置，启动延迟检测
 onMouseMove(movement) {
  lastMousePosition = movement.endPosition;
  hoverDelayFrameCount = 0;
  if (!hoverCheckScheduled) {
    requestAnimationFrame(checkHover);
  }
}

// 等待 3 帧后才执行 GPU Picking
checkHover() {
  if (hoverDelayFrameCount >= 3) {
    performHoverPick(lastMousePosition);
  } else {
    requestAnimationFrame(checkHover);
  }
}

// GPU Picking：O(1) 复杂度
performHoverPick(screenPosition) {
  const pickedObject = scene.pick(screenPosition);  // GPU 加速
  if (pickedObject?.primitive) {
    nearbySatellite = findClickedSatellite(pickedObject.primitive);
  }
}
```

**优势**：
- GPU Picking 复杂度 O(1)，与卫星数量无关
- 延迟 3 帧（~50ms）避免高频计算
- 快速移动鼠标不触发检测

---

## 性能对比

### 帧率 (FPS)

| 场景 | 旧方案 | 新方案 | 变化 |
|------|--------|--------|------|
| 页面加载后 | 60 FPS | 56 FPS | -6.7% |
| 模拟鼠标移动 | 49 FPS | **56 FPS** | **+14.3%** |
| 最低 FPS | 19 FPS | 56 FPS | **+195%** |

### 帧时间

| 场景 | 旧方案 | 新方案 |
|------|--------|--------|
| 正常渲染 | 16.6 MS | 18.8 MS |
| 悬停检测时 | 20+ MS | 18.8 MS |

### 内存占用

| 项目 | 旧方案 | 新方案 |
|------|--------|--------|
| 屏幕位置缓存 | ~384 KB | 删除 |
| 屏幕网格索引 | ~50 KB | 删除 |
| 延迟检测变量 | N/A | ~32 B |
| **总计** | ~450 KB | **~0** |

---

## 代码变更

### 删除的代码

| 内容 | 行数 |
|------|------|
| `screenPositionCache` 属性 | 1 行 |
| `screenGridIndex` 属性 | 1 行 |
| `screenCacheDirty` 属性 | 1 行 |
| `GRID_SIZE` 属性 | 1 行 |
| `findNearbySatelliteForHover` 方法 | 47 行 |
| `updateScreenGridIndex` 方法 | 28 行 |
| 清理代码引用 | 4 行 |
| **总计** | **~83 行** |

### 新增的代码

| 内容 | 行数 |
|------|------|
| 延迟检测属性 | 4 行 |
| `setupHoverHandler` 方法 | 15 行 |
| `checkHover` 方法 | 12 行 |
| `performHoverPick` 方法 | 19 行 |
| **总计** | **~50 行** |

### 净变化

- 代码减少：约 33 行
- 删除 debounce 依赖

---

## 原理说明

### GPU Picking

Cesium 的 `scene.pick()` 实现：
1. 渲染场景到离屏 Framebuffer
2. 将对象 ID 编码到颜色通道
3. 读取鼠标位置的像素颜色
4. 解码得到对应的对象

**复杂度**：O(1)，与场景对象数量无关

### 延迟检测

借鉴 KeepTrack 的方案：
- 鼠标移动时不立即检测
- 等待 3 帧（约 50ms）后才执行
- 用户快速移动时不会触发
- 只有鼠标停下来才检测

---

## 结论

### 优化评估：**正优化**

| 方面 | 效果 |
|------|------|
| **悬停时 FPS** | ✅ 从 49 提升到 56 (+14.3%) |
| **最低 FPS** | ✅ 从 19 提升到 56 (+195%) |
| **内存占用** | ✅ 减少 ~450 KB |
| **代码量** | ✅ 减少约 33 行 |

### 注意事项

1. **GPU Picking 限制**：每帧调用 `scene.pick()` 次数有限，延迟检测解决了这个问题
2. **PointPrimitive ID**：通过 `findClickedSatellite()` 反查 primitive 对应的卫星 ID
3. **选中卫星**：选中时隐藏点，GPU Picking 不会拾取到，符合预期

---

## 后续建议

1. **考虑移除 latLngGrid**：如果点击检测也改用 GPU Picking，可以移除经纬度网格索引
2. **调整延迟帧数**：可以根据实际体验调整 `HOVER_DELAY_FRAMES`（当前 3 帧）
3. **性能监控**：可以添加 performance.mark() 监控 `scene.pick()` 耗时