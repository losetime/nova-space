# ESA DISCOS API 集成计划

## 背景

卫星元数据需要扩展字段（质量、尺寸、任务等），当前数据源无法提供完整数据。已成功申请到 ESA DISCOS API 访问权限。

**关键约束**：用户要求"不要频繁访问"，必须实现持久化存储。

---

## 数据源分析

### 三大数据源对比

| 功能/数据 | CelesTrak | Space-Track | ESA DISCOS |
|----------|-----------|-------------|------------|
| **TLE 数据** | ✅ 免费、无需认证 | ✅ 需登录 | ❌ |
| **卫星目录 (SATCAT)** | ✅ 免费JSON API | ✅ 需登录 | ✅ |
| **质量** | ❌ | ❌ | ✅ |
| **尺寸 (宽/高/深)** | ❌ | ❌ | ✅ |
| **形状** | ❌ | ❌ | ✅ |
| **最大跨度** | ❌ | ❌ | ✅ |
| **COSPAR ID** | ✅ | ✅ | ✅ |
| **发射日期/发射场** | ✅ | ✅ | ✅ |
| **RCS (雷达截面)** | ✅ | ✅ | ❌ |
| **运营商详情** | ❌ | ❌ | ✅ |
| **访问方式** | 免费、无需认证 | 免费注册、需登录 | 免费申请、Bearer Token |

### 决策结论

| 数据源 | 决策 | 理由 |
|-------|------|------|
| **CelesTrak** | 保留（主要） | TLE 数据唯一来源，元数据完整，免费无认证 |
| **Space-Track** | 移除 | 与 CelesTrak 高度重叠，无独有字段 |
| **ESA DISCOS** | 新增 | 质量、尺寸等独有数据 |

### TLE 数据说明

TLE (Two-Line Element) 是轨道根数格式，包含卫星轨道计算所需的所有参数：

```
ISS (ZARYA)
1 25544U 98067A   25083.50000000  .00010000  00000-0  18000-3 0  9993
2 25544  51.6416 200.0000 0005000 100.0000 260.0000 15.50000000437009
```

**主要字段**：
- 历元时间 (epoch) - 数据时间点
- 轨道倾角 (inclination) - 轨道面与赤道面夹角
- 升交点赤经 (RAAN) - 轨道面与参考方向夹角
- 偏心率 (eccentricity) - 轨道椭圆程度
- 近地点幅角 (argOfPerigee) - 近地点位置
- 平均运动 (meanMotion) - 每天绕地球圈数

**实时位置计算链路**：
```
TLE 数据 → satellite.js → ECI 坐标 → 地理坐标 (经纬度、高度)
```

系统完全通过 TLE 本地计算卫星位置，不调用第三方实时位置 API。

---

## 存储方案

### 数据库选择

| 数据类型 | 存储方式 | 更新频率 |
|---------|---------|---------|
| TLE 数据 | PostgreSQL | 每日刷新 |
| 基础元数据 | PostgreSQL | 从 CelesTrak SATCAT 获取 |
| 扩展元数据 | PostgreSQL | 从 ESA DISCOS 按需获取，长期存储 |
| 热数据 (satrec) | 内存 | 服务启动时加载 |

### 为什么不用 Redis？

| 因素 | 分析 |
|-----|------|
| 数据量 | ~10000 颗卫星，内存完全可以承载 |
| 并发量 | 单实例足够，暂无分布式需求 |
| 复杂度 | 引入 Redis 增加运维成本 |
| TLE 更新频率 | 每日一次，数据库定时任务即可 |

**结论**：当前规模不需要 Redis，PostgreSQL + 内存缓存足够。后续如有高并发需求再考虑。

### ORM 迁移评估 (TypeORM → Drizzle)

| 项目 | 评估 |
|-----|------|
| 迁移工作量 | 8-13 天 |
| 风险 | 中等 (20 个服务文件需重写) |
| 当前收益 | 有限 (TypeORM 够用) |
| **决策** | 暂不迁移，本次集成继续使用 TypeORM |

---

## ESA DISCOS 数据存储策略

### 采用懒加载策略

| 策略 | 选择 | 理由 |
|-----|------|------|
| 批量预加载 | ❌ 不采用 | 一次性 ~10000 次请求，可能触发速率限制 |
| 懒加载 | ✅ 采用 | 按需获取，符合"不要频繁访问"要求 |

### 实现逻辑

```
用户访问 /satellites/:noradId/metadata
        ↓
查询数据库 satellite_metadata 表
        ↓
    有扩展数据？ ─── 是 ──→ 直接返回
        │
        否
        ↓
调用 ESA DISCOS API
        ↓
存入数据库 (长期有效)
        ↓
返回扩展后的元数据
```

### 数据特点

- ESA DISCOS 数据是卫星的"静态属性"（质量、尺寸等）
- 长期不变，一次获取永久有效
- 后续访问直接从数据库读取，不再调用 API

---

## ESA DISCOS API 信息

- **Endpoint**: `https://discosweb.esoc.esa.int/api/objects`
- **认证**: Bearer Token
- **查询**: `?filter=satno={noradId}`

---

## API 响应结构 (JSON:API 格式)

### 示例响应 (ISS - NORAD 25544)

```json
{
  "data": [{
    "type": "object",
    "id": "44371",
    "attributes": {
      "cosparId": "1998-067A",
      "satno": 25544,
      "name": "International Space Station",
      "objectClass": "Payload",
      "mass": 450000.0,
      "shape": "Irr",
      "width": 72.8,
      "height": 20.0,
      "depth": 108.5,
      "span": 108.5,
      "firstEpoch": "1998-12-07",
      "mission": "Civil Spaceship",
      "predDecayDate": "2026-05-12"
    },
    "relationships": {
      "launch": { ... },
      "operators": { ... },
      "states": { ... },
      "tags": { ... },
      "constellations": { ... }
    }
  }]
}
```

### attributes 主要字段

| 字段 | 示例值 | 说明 |
|------|--------|------|
| cosparId | "1998-067A" | COSPAR 编号 |
| satno | 25544 | NORAD 编号 |
| name | "International Space Station" | 卫星名称 |
| objectClass | "Payload" | 对象类型 (Payload/Debris 等) |
| mass | 450000.0 | 发射质量 (kg) |
| shape | "Irr" | 形状代码 |
| width/height/depth | 72.8/20.0/108.5 | 尺寸 (米) |
| span | 108.5 | 最大跨度 (米) |
| firstEpoch | "1998-12-07" | 首次轨道历元 |
| mission | "Civil Spaceship" | 任务类型 |
| predDecayDate | "2026-05-12" | 预测再入日期 |

### relationships (需额外请求)

- **launch**: 发射信息 (火箭、发射场、日期)
- **operators**: 运营商信息
- **states**: 轨道状态历史
- **tags**: 标签
- **constellations**: 所属星座

---

## 字段映射

| ESA DISCOS 字段 | SatelliteMetadata 字段 | 说明 |
|----------------|----------------------|------|
| satno | noradId | NORAD 编号 |
| name | name | 卫星名称 |
| mass | launchMass | 发射质量 (kg) |
| shape | shape | 形状代码 |
| width/height/depth | dimensions | 尺寸 (组合展示) |
| span | span | 最大跨度 (米) |
| mission | mission | 任务类型 |
| cosparId | cosparId | COSPAR 编号 |
| objectClass | objectClass | 对象类型 |
| firstEpoch | firstEpoch | 首次轨道历元 |

---

## 实现步骤

### Phase 1: 数据库实体设计

#### 1.1 创建 SatelliteTle 实体

**文件**: `src/modules/satellite/entities/satellite-tle.entity.ts`

```typescript
@Entity('satellite_tle')
export class SatelliteTle {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  noradId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  line1: string;

  @Column({ type: 'text' })
  line2: string;

  @Column({ type: 'timestamp', nullable: true })
  epoch: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

#### 1.2 创建 SatelliteMetadata 实体

**文件**: `src/modules/satellite/entities/satellite-metadata.entity.ts`

```typescript
@Entity('satellite_metadata')
export class SatelliteMetadata {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  noradId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  objectId: string;       // COSPAR ID (2023-001A)

  @Column({ type: 'varchar', length: 50, nullable: true })
  objectType: string;     // PAYLOAD/ROCKET BODY/DEBRIS

  @Column({ type: 'varchar', length: 10, nullable: true })
  status: string;         // +/D/P/N/A

  @Column({ type: 'varchar', length: 50, nullable: true })
  countryCode: string;

  @Column({ type: 'date', nullable: true })
  launchDate: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  launchSite: string;

  @Column({ type: 'date', nullable: true })
  decayDate: string;

  // 轨道参数
  @Column({ type: 'float', nullable: true })
  period: number;

  @Column({ type: 'float', nullable: true })
  inclination: number;

  @Column({ type: 'float', nullable: true })
  apogee: number;

  @Column({ type: 'float', nullable: true })
  perigee: number;

  @Column({ type: 'float', nullable: true })
  rcs: number;

  // ESA DISCOS 扩展字段
  @Column({ type: 'float', nullable: true })
  launchMass: number;     // 发射质量 (kg)

  @Column({ type: 'varchar', length: 20, nullable: true })
  shape: string;          // 形状代码

  @Column({ type: 'varchar', length: 50, nullable: true })
  dimensions: string;     // 尺寸显示 "72.8m × 20.0m × 108.5m"

  @Column({ type: 'float', nullable: true })
  span: number;           // 最大跨度 (米)

  @Column({ type: 'varchar', length: 100, nullable: true })
  mission: string;        // 任务类型

  @Column({ type: 'varchar', length: 20, nullable: true })
  objectClass: string;    // Payload/Debris (ESA 分类)

  @Column({ type: 'date', nullable: true })
  firstEpoch: string;     // 首次轨道历元

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

### Phase 2: 移除 Space-Track，简化服务

**文件**: `src/modules/satellite/services/space-track.service.ts`

修改内容：
1. 移除 Space-Track 登录和请求逻辑
2. 重命名为 `SatelliteDataService` (可选)
3. 保留 CelesTrak TLE 和 SATCAT 获取逻辑
4. 改为从数据库读取/写入数据
5. 添加定时刷新任务 (每日)

### Phase 3: 创建 ESA DISCOS 服务

**文件**: `src/modules/satellite/services/esa-discos.service.ts`

核心功能：
- 检查数据库是否已有该卫星的扩展元数据
- 无则调用 API 获取，存入数据库
- 有则直接返回数据库数据
- Bearer Token 认证

### Phase 4: 更新控制器和模块

**文件**: `src/modules/satellite/satellite.controller.ts`

- 注入 EsaDiscosService
- `getSatelliteMetadata` 端点整合数据

**文件**: `src/modules/satellite/satellite.module.ts`

- 注册新实体到 TypeORM
- 注册 EsaDiscosService

### Phase 5: 配置更新

**文件**: `src/config/app.config.ts`

移除 `spaceTrack` 配置，添加 `esaDiscos` 配置。

**文件**: `.env.example`

移除 Space-Track 相关，添加 ESA DISCOS token。

---

## 关键文件清单

| 操作 | 文件路径 |
|------|---------|
| 新建 | `src/modules/satellite/entities/satellite-tle.entity.ts` |
| 新建 | `src/modules/satellite/entities/satellite-metadata.entity.ts` |
| 新建 | `src/modules/satellite/services/esa-discos.service.ts` |
| 修改 | `src/modules/satellite/satellite.module.ts` |
| 修改 | `src/modules/satellite/satellite.controller.ts` |
| 修改 | `src/modules/satellite/services/space-track.service.ts` |
| 修改 | `src/modules/satellite/interfaces/satellite.interface.ts` |
| 修改 | `src/config/app.config.ts` |
| 修改 | `.env.example` |

---

## 验证步骤

1. 启动后端服务 `pnpm run start:dev`
2. 检查数据库表自动创建
3. 调用 `/api/satellites/25544/metadata` (ISS)
4. 验证返回数据包含 `launchMass`, `dimensions`, `span` 等字段
5. 再次调用，确认从数据库读取（无新 API 请求）
6. 检查 TLE 定时刷新任务运行正常

---

## 注意事项

1. **API Token 安全**: 不要提交到 Git，`.env` 已在 `.gitignore` 中
2. **API 限流**: ESA DISCOS 有速率限制，按需获取避免超限
3. **降级策略**: ESA DISCOS 未配置或失败时，返回基础元数据
4. **形状代码**: ESA DISCOS 的 shape 字段是代码（如 "Irr" = Irregular），需要映射表转换展示
5. **数据迁移**: 首次启动时从 CelesTrak 加载数据到数据库