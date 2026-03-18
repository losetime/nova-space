# 全球卫星数据获取指南

## 概述

本文档介绍如何获取全球卫星轨道数据，包括卫星、火箭残骸和太空碎片。主要数据源为 CelesTrak（免费）和 Space-Track（官方）。

---

## 1. 数据分类

### 按对象类型

| 类型 | 英文 | 数量 | 说明 |
|------|------|------|------|
| 有效载荷 | PAYLOAD | ~9,000 | 活跃卫星 |
| 火箭残骸 | ROCKET BODY | ~2,000 | 火箭上面级等 |
| 太空碎片 | DEBRIS | ~50,000+ | 碎片、失效卫星部件等 |
| **总计** | - | **~64,000+** | 所有在轨物体 |

### 按轨道类型

| 轨道类型 | 缩写 | 高度范围 | 典型应用 |
|----------|------|----------|----------|
| 低地球轨道 | LEO | 160-2000 km | 星链、国际空间站 |
| 中地球轨道 | MEO | 2000-35786 km | GPS、北斗 |
| 地球同步轨道 | GEO | 35786 km | 通信卫星 |
| 高椭圆轨道 | HEO | 椭圆轨道 | 科研卫星 |

---

## 2. CelesTrak 数据源（推荐）

### 2.1 简介

CelesTrak 由 T.S. Kelso 维护，免费提供 NORAD 卫星目录的 TLE/GP 数据，无需注册。

**官网**: https://celestrak.org/

### 2.2 API 端点

**基础 URL**: `https://celestrak.org/NORAD/elements/gp.php`

#### 获取完整目录

```
# 获取所有在轨物体（卫星+火箭+碎片，约64000颗）
https://celestrak.org/NORAD/elements/gp.php?FORMAT=tle

# 获取活跃卫星（约9000颗）
https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle
```

#### 按对象类型筛选

```
# 有效载荷（卫星）
https://celestrak.org/NORAD/elements/gp.php?OBJECT_TYPE=payload&FORMAT=tle

# 火箭残骸
https://celestrak.org/NORAD/elements/gp.php?OBJECT_TYPE=rocket%20body&FORMAT=tle

# 太空碎片
https://celestrak.org/NORAD/elements/gp.php?OBJECT_TYPE=debris&FORMAT=tle
```

#### 按卫星分组筛选

| GROUP 参数 | 说明 | 数量 |
|------------|------|------|
| `active` | 所有活跃卫星 | ~9,000 |
| `starlink` | Starlink 卫星 | ~6,000+ |
| `oneweb` | OneWeb 卫星 | ~600+ |
| `stations` | 空间站（ISS、天宫等） | ~10 |
| `gps-ops` | GPS 运营卫星 | ~30 |
| `glo-ops` | GLONASS 卫星 | ~24 |
| `galileo` | Galileo 卫星 | ~28 |
| `beidou` | 北斗卫星 | ~30+ |
| `geo` | 地球同步轨道卫星 | ~500+ |
| `resource` | 资源卫星 | ~200+ |
| `weather` | 气象卫星 | ~100+ |
| `science` | 科学卫星 | ~200+ |
| `noaa` | NOAA 卫星 | ~20 |

#### 按轨道类型筛选

| GROUP 参数 | 说明 |
|------------|------|
| `leo` | 低地球轨道卫星 |
| `meo` | 中地球轨道卫星 |
| `heo` | 高椭圆轨道卫星 |

### 2.3 返回格式

#### TLE 格式（默认）

```
ISS (ZARYA)
1 25544U 98067A   25076.50000000  .00000000  00000-0  00000+0 0  0000
2 25544  51.6400 200.0000 0001000 100.0000 200.0000 15.50000000123456
```

#### JSON 格式

```
https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json
```

#### XML 格式

```
https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=xml
```

#### CSV 格式

```
https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=csv
```

---

## 3. 卫星元数据

### 3.1 卫星目录（satcat）

CelesTrak 提供完整的卫星目录元数据：

```
# JSON 格式
https://celestrak.org/satcat.php?FORMAT=json

# TXT 格式
https://celestrak.org/satcat.txt
```

### 3.2 元数据字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `OBJECT_NAME` | 卫星名称 | "STARLINK-1234" |
| `OBJECT_ID` | 国际编号 | "2023-001A" |
| `NORAD_CAT_ID` | NORAD 目录编号 | "12345" |
| `OBJECT_TYPE` | 对象类型 | PAYLOAD/ROCKET BODY/DEBRIS |
| `OPS_STATUS_CODE` | 运营状态 | +/D/P/B/S/G/X |
| `OWNER` | 所有者/国家 | "US"、"CHINA" |
| `LAUNCH_DATE` | 发射日期 | "2023-01-01" |
| `LAUNCH_SITE` | 发射地点 | "AFETR" |
| `DECAY_DATE` | 衰减日期 | null（在轨） |
| `PERIOD` | 轨道周期（分钟） | 95.0 |
| `INCLINATION` | 轨道倾角（度） | 53.0 |
| `APOGEE` | 远地点高度（km） | 550 |
| `PERIGEE` | 近地点高度（km） | 540 |
| `RCS` | 雷达截面积 | "LARGE" |

### 3.3 按条件筛选

```
# 查询特定卫星
https://celestrak.org/satcat.php?NORAD_CAT_ID=25544&FORMAT=json

# 按国家筛选
https://celestrak.org/satcat.php?COUNTRY=US&FORMAT=json

# 按对象类型筛选
https://celestrak.org/satcat.php?OBJECT_TYPE=PAYLOAD&FORMAT=json
```

---

## 4. Space-Track 数据源（官方）

### 4.1 简介

Space-Track 由美国太空军第18太空防御中队运营，是官方权威数据源。

**官网**: https://www.space-track.org/

### 4.2 注册与认证

1. 访问 https://www.space-track.org/ 注册账号
2. 同意使用条款
3. 获取用户名和密码用于 API 认证

### 4.3 API 使用

#### 认证登录

```typescript
async function login(username: string, password: string): Promise<string> {
  const response = await fetch('https://www.space-track.org/authlogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `identity=${username}&password=${password}`,
  });

  // 获取 cookie 用于后续请求
  const cookie = response.headers.get('set-cookie');
  return cookie;
}
```

#### 获取 TLE 数据

```
# 所有 GP 数据（TLE 格式）
https://www.space-track.org/basicspacedata/query/class/gp/format/tle

# JSON 格式
https://www.space-track.org/basicspacedata/query/class/gp/format/json
```

#### 查询条件

```
# 按 NORAD ID 查询
https://www.space-track.org/basicspacedata/query/class/gp/NORAD_CAT_ID/25544/format/json

# 按时间范围查询
https://www.space-track.org/basicspacedata/query/class/gp/EPOCH/%3E2025-01-01/format/json
```

### 4.4 API 限制

- **频率限制**: 每分钟最多 30 次请求
- **数据延迟**: 约 6-12 小时
- **使用条款**: 仅限非商业用途，需遵守协议

---

## 5. TLE 数据格式

### 5.1 格式说明

TLE（Two-Line Element Set）由三行组成：

```
第0行: 卫星名称
第1行: 轨道参数行1
第2行: 轨道参数行2
```

### 5.2 第1行字段

```
1 NNNNNU 23NNNNN   25076.50000000  .00000000  00000-0  00000+0 0  0000
  ││││││ │││││││   │││││││││││││  ││││││││  ││││││  ││││││ │  │
  ││││││ │││││││   │││││││││││││  ││││││││  ││││││  ││││││ │  └─ 校验和
  ││││││ │││││││   │││││││││││││  ││││││││  ││││││  ││││││ └─── 星历类型
  ││││││ │││││││   │││││││││││││  ││││││││  ││││││  └──────── 一阶阻力系数
  ││││││ │││││││   │││││││││││││  ││││││││  └──────────── 二阶阻力系数
  ││││││ │││││││   │││││││││││││  └──────────────────── 平均运动一阶导数
  ││││││ │││││││   └──────────────────────────────────── 历元日期（年.天）
  ││││││ └────────────────────────────────────────────── 国际编号
  │││││└──────────────────────────────────────────────── 分类（U=解密）
  ││││└───────────────────────────────────────────────── 发射年份末两位
  │││└────────────────────────────────────────────────── 发射年份
  ││└─────────────────────────────────────────────────── 国家代码
  │└──────────────────────────────────────────────────── NORAD 编号
  └───────────────────────────────────────────────────── 行号
```

### 5.3 第2行字段

```
2 NNNNN 000.0000 000.0000 0000000 000.0000 000.0000 00.00000000  0000
  │     │        │        │       │        │        │            │
  │     │        │        │       │        │        │            └─ 校验和
  │     │        │        │       │        │        └──────────── 平均运动（圈/天）
  │     │        │        │       │        └───────────────────── 近地点幅角（度）
  │     │        │        │       └────────────────────────────── 升交点赤经（度）
  │     │        │        └────────────────────────────────────── 离心率
  │     │        └─────────────────────────────────────────────── 轨道倾角（度）
  │     └──────────────────────────────────────────────────────── 近地点幅角（度）
  └────────────────────────────────────────────────────────────── NORAD 编号
```

---

## 6. 代码示例

### 6.1 Node.js 获取 TLE 数据

```typescript
import https from 'https';

interface TLEData {
  name: string;
  noradId: string;
  line1: string;
  line2: string;
}

/**
 * 获取所有活跃卫星 TLE
 */
async function fetchActiveSatellites(): Promise<TLEData[]> {
  const url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';
  const data = await fetchData(url);
  return parseTLE(data);
}

/**
 * 获取完整目录（包含碎片）
 */
async function fetchAllObjects(): Promise<TLEData[]> {
  const url = 'https://celestrak.org/NORAD/elements/gp.php?FORMAT=tle';
  const data = await fetchData(url);
  return parseTLE(data);
}

/**
 * 获取指定类型的对象
 */
async function fetchByType(type: 'payload' | 'debris' | 'rocket%20body'): Promise<TLEData[]> {
  const url = `https://celestrak.org/NORAD/elements/gp.php?OBJECT_TYPE=${type}&FORMAT=tle`;
  const data = await fetchData(url);
  return parseTLE(data);
}

/**
 * HTTP 请求
 */
function fetchData(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * 解析 TLE 数据
 */
function parseTLE(tleData: string): TLEData[] {
  const lines = tleData.split('\n').filter(line => line.trim());
  const satellites: TLEData[] = [];

  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      const name = lines[i].trim();
      const line1 = lines[i + 1].trim();
      const line2 = lines[i + 2].trim();

      // 提取 NORAD ID（第1行第3-7位）
      const noradIdMatch = line1.match(/^1 (\d{5})/);

      if (noradIdMatch) {
        satellites.push({
          name,
          noradId: noradIdMatch[1],
          line1,
          line2,
        });
      }
    }
  }

  return satellites;
}

// 使用示例
async function main() {
  // 获取活跃卫星
  const active = await fetchActiveSatellites();
  console.log(`活跃卫星: ${active.length} 颗`);

  // 获取完整目录
  const all = await fetchAllObjects();
  console.log(`完整目录: ${all.length} 个物体`);

  // 获取碎片
  const debris = await fetchByType('debris');
  console.log(`太空碎片: ${debris.length} 个`);
}
```

### 6.2 获取卫星元数据

```typescript
interface SatelliteMetadata {
  noradId: string;
  name: string;
  objectId: string;
  objectType: 'PAYLOAD' | 'ROCKET BODY' | 'DEBRIS' | 'UNKNOWN';
  countryCode: string;
  launchDate: string;
  launchSite: string;
  period: number;
  inclination: number;
  apogee: number;
  perigee: number;
}

async function fetchMetadata(): Promise<Map<string, SatelliteMetadata>> {
  const url = 'https://celestrak.org/satcat.php?FORMAT=json';
  const data = await fetchData(url);
  const items = JSON.parse(data);

  const metadataMap = new Map<string, SatelliteMetadata>();

  for (const item of items) {
    metadataMap.set(String(item.NORAD_CAT_ID), {
      noradId: String(item.NORAD_CAT_ID),
      name: item.OBJECT_NAME,
      objectId: item.OBJECT_ID,
      objectType: item.OBJECT_TYPE,
      countryCode: item.COUNTRY,
      launchDate: item.LAUNCH_DATE,
      launchSite: item.LAUNCH_SITE,
      period: item.PERIOD,
      inclination: item.INCLINATION,
      apogee: item.APOGEE,
      perigee: item.PERIGEE,
    });
  }

  return metadataMap;
}
```

### 6.3 使用 satellite.js 计算位置

```typescript
import * as satellite from 'satellite.js';

interface Position {
  lat: number;
  lng: number;
  alt: number; // 米
}

function calculatePosition(tle: TLEData, time: Date): Position | null {
  // 解析 TLE
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

  // 计算位置和速度
  const positionAndVelocity = satellite.propagate(satrec, time);
  const positionEci = positionAndVelocity.position;

  if (!positionEci) return null;

  // 计算 GMST
  const gmst = satellite.gstime(time);

  // 转换为地心坐标系
  const positionGd = satellite.eciToGeodetic(positionEci, gmst);

  return {
    lat: satellite.radiansToDegrees(positionGd.latitude),
    lng: satellite.radiansToDegrees(positionGd.longitude),
    alt: positionGd.height * 1000, // km 转 m
  };
}
```

---

## 7. 数据更新策略

### 7.1 更新频率建议

| 数据类型 | 更新频率 | 原因 |
|----------|----------|------|
| TLE 数据 | 每日 | LEO 卫星受大气阻力影响 |
| 卫星元数据 | 每周 | 新发射卫星信息更新 |
| 完整目录 | 每周 | 碎片轨道变化较慢 |

### 7.2 TLE 有效期

- **LEO 卫星**: 大气阻力影响大，建议每日更新
- **MEO 卫星**: 轨道相对稳定，可每周更新
- **GEO 卫星**: 轨道非常稳定，可每月更新
- **高精度应用**: 需要最新 TLE 数据

### 7.3 缓存策略

```typescript
class TLECache {
  private cache: TLEData[] = [];
  private lastUpdate: Date | null = null;
  private maxAge: number = 24 * 60 * 60 * 1000; // 24小时

  async getTLEs(): Promise<TLEData[]> {
    if (this.isCacheValid()) {
      return this.cache;
    }

    this.cache = await fetchAllObjects();
    this.lastUpdate = new Date();
    return this.cache;
  }

  private isCacheValid(): boolean {
    if (!this.lastUpdate || this.cache.length === 0) {
      return false;
    }
    return Date.now() - this.lastUpdate.getTime() < this.maxAge;
  }
}
```

---

## 8. 数据量与性能

### 8.1 数据量参考

| 数据类型 | 数量 | TLE 文件大小 | JSON 文件大小 |
|----------|------|--------------|---------------|
| 活跃卫星 | ~9,000 | ~500 KB | ~2 MB |
| 有效载荷 | ~9,000 | ~500 KB | ~2 MB |
| 火箭残骸 | ~2,000 | ~100 KB | ~500 KB |
| 太空碎片 | ~50,000+ | ~3 MB | ~10 MB |
| **完整目录** | **~64,000+** | **~3.5 MB** | **~12 MB** |

### 8.2 性能优化建议

1. **分批加载**: 大量数据分批处理，避免阻塞主线程
2. **按需加载**: 只加载视野范围内的卫星
3. **WebSocket 过滤**: 只推送可见区域的卫星位置
4. **前端优化**: 使用点渲染、聚合等技术

---

## 9. 参考链接

- [CelesTrak 官网](https://celestrak.org/)
- [CelesTrak 文档](https://celestrak.org/NORAD/documentation/)
- [Space-Track 官网](https://www.space-track.org/)
- [NORAD 卫星目录](https://en.wikipedia.org/wiki/Satellite_Catalog_Number)
- [TLE 格式说明](https://en.wikipedia.org/wiki/Two-line_element_set)
- [satellite.js 库](https://github.com/shashwatak/satellite-js)
- [keeptrack.space GitHub](https://github.com/thkruz/keeptrack.space)

---

## 10. 后端实现（NestJS）

### 10.1 模块架构

```
backend-nest/src/modules/satellite/
├── satellite.module.ts          # 模块定义
├── satellite.controller.ts      # REST API 控制器
├── gateways/
│   └── satellite.gateway.ts     # WebSocket 网关
├── services/
│   ├── space-track.service.ts   # 数据获取服务
│   └── orbit-calculator.service.ts  # 轨道计算服务
└── interfaces/
    └── satellite.interface.ts   # TypeScript 类型定义
```

### 10.2 核心服务

#### SpaceTrackService - 数据获取服务

**职责**：从 CelesTrak/Space-Track 获取卫星 TLE 数据和元数据

**数据源配置**：

```typescript
// 支持的卫星分组
const SATELLITE_GROUPS = {
  active: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
  starlink: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
  stations: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
  gps: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle',
  beidou: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=tle',
  glonass: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=glo-ops&FORMAT=tle',
  galileo: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=tle',
  weather: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
  science: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle',
};
```

**数据加载策略**：

1. **启动时加载**：
   - 优先从本地缓存加载 TLE 数据（`cache/satellites_tle_cache.json`）
   - 本地缓存不存在则从网络获取

2. **元数据获取**：
   - 优先从本地缓存加载（`cache/satellite_metadata_cache.json`）
   - 若配置了 Space-Track 凭据，优先从 Space-Track API 获取（数据更完整）
   - 失败时回退到 CelesTrak GPZ 数据

**配置项**（`app.config.ts`）：

```typescript
satellite: {
  maxSatellites: 10000,     // 最大卫星数量
  dataGroup: 'active',      // 数据分组
  broadcastInterval: 5000,  // WebSocket 广播间隔（毫秒）
}

app: {
  spaceTrack: {
    username: 'your-username',
    password: 'your-password',
  }
}
```

**核心方法**：

| 方法 | 说明 |
|------|------|
| `loadSatellites()` | 加载卫星 TLE 数据 |
| `refreshSatellites()` | 刷新数据（从网络重新获取） |
| `getCachedTLEs()` | 获取缓存的 TLE 数据 |
| `getSatelliteMetadata(noradId)` | 获取单个卫星元数据 |
| `getAllMetadata()` | 获取所有卫星元数据 |

#### OrbitCalculatorService - 轨道计算服务

**职责**：使用 satellite.js 计算卫星位置、轨道和过境预测

**核心功能**：

1. **实时位置计算**：
   ```typescript
   calculateAllSatellitesPosition(): SatellitePosition[]
   ```
   - 计算所有卫星当前时刻的位置（经纬度、高度）

2. **轨道计算**：
   ```typescript
   calculateSatelliteOrbit(
     noradId: string,
     steps: number,           // 轨道点数（10-500）
     startTime: Date,         // 开始时间
     durationMinutes: number, // 持续时间（分钟，最大1440）
   ): OrbitPoint[]
   ```
   - 返回一系列轨道点，包含位置、时间戳、速度向量

3. **轨道预测**：
   ```typescript
   predictOrbit(
     noradId: string,
     startTime: Date,
     durationMinutes: number,
     steps: number,
   ): OrbitPrediction
   ```
   - 返回完整预测结果，包含轨道周期、开始/结束时间

4. **单点位置预测**：
   ```typescript
   predictPosition(noradId: string, time: Date): PositionPrediction
   ```
   - 返回指定时间点的位置、速度、轨道参数（周期、倾角、离心率）

5. **过境预测**：
   ```typescript
   predictPasses(
     noradId: string,
     observer: ObserverPosition,  // 观察者位置（经纬度、海拔）
     days: number,                // 预测天数（1-30）
     minElevation: number,        // 最小高度角（度）
   ): PassPrediction
   ```
   - 返回指定时间段内的过境事件列表

### 10.3 REST API 端点

#### 卫星列表与搜索

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/satellites` | GET | 获取所有卫星当前位置 |
| `/api/satellites/search` | GET | 搜索卫星（参数：name, limit） |
| `/api/satellites/stats` | GET | 获取统计信息 |
| `/api/satellites/countries` | GET | 获取国家列表（含卫星数量） |
| `/api/satellites/metadata/all` | GET | 获取所有卫星元数据 |

#### 单个卫星操作

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/satellites/:noradId` | GET | 获取单个卫星位置 |
| `/api/satellites/:noradId/metadata` | GET | 获取卫星元数据 |
| `/api/satellites/:noradId/orbit` | GET | 获取轨道数据 |
| `/api/satellites/:noradId/predict` | GET | 轨道预测 |
| `/api/satellites/:noradId/position` | GET | 单点位置预测 |
| `/api/satellites/:noradId/passes` | GET | 过境预测 |

#### API 参数详解

**轨道数据** (`/api/satellites/:noradId/orbit`)：
- `steps`: 轨道点数（默认50，最大500）
- `startTime`: 开始时间（ISO格式，默认当前）
- `duration`: 持续时间（分钟，默认150，最大1440）

**过境预测** (`/api/satellites/:noradId/passes`)：
- `lat`: 观察者纬度（必需）
- `lng`: 观察者经度（必需）
- `alt`: 观察者海拔（米，默认0）
- `days`: 预测天数（默认7，最大30）
- `minElevation`: 最小高度角（度，默认10）

### 10.4 WebSocket 实时推送

**端点**：`ws://localhost:3001/ws/satellites`

**消息格式**：
```json
{
  "type": "satellites",
  "data": [
    {
      "noradId": "25544",
      "name": "ISS (ZARYA)",
      "position": {
        "lat": 45.5,
        "lng": -120.3,
        "alt": 420000
      },
      "timestamp": "2025-03-18T10:00:00.000Z"
    }
  ],
  "timestamp": "2025-03-18T10:00:00.000Z"
}
```

**配置**：
- 广播间隔：5000ms（可通过配置修改）
- 连接时立即发送当前卫星位置

### 10.5 TypeScript 类型定义

```typescript
// TLE 数据
interface TLEData {
  name: string;
  noradId: string;
  line1: string;
  line2: string;
}

// 卫星元数据
interface SatelliteMetadata {
  noradId: string;
  name?: string;
  objectId?: string;       // 国际编号
  objectType?: string;     // PAYLOAD/ROCKET BODY/DEBRIS
  countryCode?: string;
  launchDate?: string;
  launchSite?: string;
  decayDate?: string;
  period?: number;         // 轨道周期（分钟）
  inclination?: number;    // 轨道倾角（度）
  apogee?: number;         // 远地点（km）
  perigee?: number;        // 近地点（km）
}

// 卫星位置
interface SatellitePosition {
  noradId: string;
  name: string;
  position: {
    lat: number;
    lng: number;
    alt: number;  // 米
  };
  timestamp?: string;
}

// 轨道点
interface OrbitPoint {
  lat: number;
  lng: number;
  alt: number;  // 米
  timestamp?: string;
  velocity?: { x: number; y: number; z: number; };  // km/s
}

// 轨道预测
interface OrbitPrediction {
  noradId: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  steps: number;
  orbit: OrbitPoint[];
  orbitalPeriod?: number;
}

// 位置预测
interface PositionPrediction {
  noradId: string;
  name: string;
  timestamp: string;
  position: { lat: number; lng: number; alt: number; };
  velocity: { x: number; y: number; z: number; total: number; };
  orbitalInfo?: {
    period: number;
    inclination: number;
    eccentricity: number;
  };
}

// 过境事件
interface PassEvent {
  startTime: string;
  endTime: string;
  maxElevationTime: string;
  maxElevation: number;
  startAzimuth: number;
  endAzimuth: number;
  maxAzimuth: number;
  duration: number;  // 秒
  visible: boolean;  // 是否肉眼可见
}

// 过境预测
interface PassPrediction {
  noradId: string;
  name: string;
  observer: ObserverPosition;
  passes: PassEvent[];
  startDate: string;
  endDate: string;
  totalPasses: number;
}
```

### 10.6 使用示例

#### 获取国际空间站轨道

```bash
# 获取 ISS（NORAD ID: 25544）未来一个轨道周期的轨迹
curl "http://localhost:3001/api/satellites/25544/orbit?steps=100&duration=95"
```

#### 预测卫星过境

```bash
# 预测 ISS 在北京未来7天的过境
curl "http://localhost:3001/api/satellites/25544/passes?lat=39.9&lng=116.4&alt=50&days=7&minElevation=10"
```

#### WebSocket 连接

```javascript
const ws = new WebSocket('ws://localhost:3001/ws/satellites');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`收到 ${data.data.length} 颗卫星的位置数据`);
};
```