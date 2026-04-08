# 悬停检测优化 - 性能对比报告

## 优化概述

**优化内容**：使用屏幕网格索引 + lazy 计算优化卫星悬停检测

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

## 问题分析

### 优化前问题

`findNearbySatelliteForHover` 每次调用都遍历 16000+ 卫星，调用昂贵的 `worldToWindowCoordinates`：

```typescript
// 优化前：每次悬停都遍历所有卫星
for (const [noradId, satInfo] of this.satellitePositions.entries()) {
  const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(
    this.viewer.scene,
    satInfo.position  // 昂贵的坐标转换
  );
  // 计算距离...
}
```

**问题**：
- 每次鼠标移动都触发 16000+ 次坐标转换
- debounce(50ms) 只限制频率，但单次执行仍很慢

---

## 优化方案

### 屏幕网格索引 + Lazy 计算

```typescript
// 新增数据结构
private screenPositionCache: Map<string, { x: number; y: number }> = new Map();
private screenGridIndex: Map<string, Set<string>> = new Map();
private screenCacheDirty = true;  // lazy 计算标志
private readonly GRID_SIZE = 50;  // 50x50 像素网格

// 悬停检测：只查询鼠标所在网格及周围 9 个网格
private findNearbySatelliteForHover(screenPosition) {
  // lazy 计算：只在需要时才更新缓存
  if (this.screenCacheDirty) {
    this.updateScreenGridIndex();
    this.screenCacheDirty = false;
  }

  // 只查询 9 个网格内的卫星（约 100-500 颗）
  const candidates = 查询周围网格;
  for (const noradId of candidates) {
    // 直接使用缓存坐标，无需重新计算
    const cachedPos = this.screenPositionCache.get(noradId);
    // 计算距离...
  }
}
```

### 关键优化点

1. **屏幕网格索引**：将屏幕划分为 50x50 像素网格，每个网格存储该区域内的卫星 ID
2. **Lazy 计算**：只在悬停时才更新缓存，位置更新时只标记 dirty
3. **候选集缩小**：从 16000+ 缩小到 100-500 颗卫星

---

## 性能对比

### 静态性能

| 指标 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| 页面加载 FPS | 59-60 | 59-60 | 持平 |
| 帧时间 | ~16.6 MS | ~16.6 MS | 持平 |

### 悬停性能（模拟鼠标移动）

| 指标 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| 悬停时 FPS | 49 FPS | **60 FPS** | **+22%** |
| 最低 FPS | 19 FPS | 48 FPS | **+152%** |
| 帧时间 | 20+ MS | 16.6 MS | **-17%** |

---

## 计算复杂度对比

| 操作 | 优化前 | 优化后 |
|------|--------|--------|
| 单次悬停检测 | O(N) 遍历所有卫星 | O(1) 查网格 + O(K) 遍历候选 |
| 坐标转换次数 | 16000+ 次/检测 | 16000 次/缓存更新 |
| 缓存更新时机 | 无缓存 | 位置更新时（lazy） |

**说明**：N=16000，K=100-500（网格内候选数）

---

## 内存使用

| 项目 | 大小估算 |
|------|----------|
| screenPositionCache | ~16000 × 24B ≈ 384 KB |
| screenGridIndex | ~500 网格 × 100 条目 ≈ 50 KB |
| **总计** | ~450 KB |

内存开销可接受。

---

## 结论

### 优化效果：**正优化**

- 悬停时 FPS 提升 22%（49 → 60）
- 最低 FPS 提升 152%（19 → 48）
- 内存增加约 450 KB（可接受）
- 用户感知流畅度显著提升

### 注意事项

1. **相机移动影响**：用户移动相机后，屏幕坐标缓存可能不精确，但下次悬停时会自动更新
2. **卫星移动影响**：卫星位置每 3 秒更新，缓存会标记 dirty，下次悬停时重新计算

---

## 附录：修改文件

| 文件 | 变更内容 |
|------|----------|
| `useCesium.ts` | 新增屏幕网格索引，优化悬停检测，启用 FPS 显示 |