# ESA DISCOS API 集成计划

## 背景

卫星元数据需要扩展字段（质量、尺寸、任务等），N2YO API 无法提供完整数据。已成功申请到 ESA DISCOS API 访问权限。

**关键约束**：用户要求"不要频繁访问"，必须实现缓存机制。

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

### 1. 添加环境变量配置

**文件**: `backend-nest/.env`
```
ESA_DISCOS_API_TOKEN=your_api_token_here
```

**文件**: `backend-nest/.env.example`
```
# ESA DISCOS API (用于获取卫星质量、尺寸等详细信息)
# 申请地址: https://discosweb.esoc.esa.int
ESA_DISCOS_API_TOKEN=your_esa_discos_api_token_here
```

**文件**: `backend-nest/src/config/app.config.ts`
```typescript
esaDiscos: {
  apiToken: process.env.ESA_DISCOS_API_TOKEN || '',
  baseUrl: 'https://discosweb.esoc.esa.int/api',
},
```

---

### 2. 创建 ESA DISCOS 服务

**文件**: `backend-nest/src/modules/satellite/services/esa-discos.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SatelliteMetadata } from '../interfaces/satellite.interface';

interface DiscosSatelliteInfo {
  satno: number;
  name: string;
  objectClass?: string;
  mass?: number;
  shape?: string;
  width?: number;
  height?: number;
  depth?: number;
  span?: number;
  mission?: string;
  cosparId?: string;
  firstEpoch?: string;
}

interface CacheEntry {
  data: DiscosSatelliteInfo | null;
  expiry: number;
}

@Injectable()
export class EsaDiscosService {
  private readonly logger = new Logger(EsaDiscosService.name);
  private readonly apiToken: string;
  private readonly baseUrl = 'https://discosweb.esoc.esa.int/api';

  // 内存缓存：24 小时有效
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly configService: ConfigService) {
    this.apiToken = this.configService.get<string>('app.esaDiscos.apiToken') || '';
  }

  /**
   * 检查 API 是否已配置
   */
  isConfigured(): boolean {
    return !!this.apiToken;
  }

  /**
   * 从缓存获取或从 API 获取卫星信息
   */
  async getSatelliteInfo(noradId: string): Promise<DiscosSatelliteInfo | null> {
    // 检查缓存
    const cached = this.cache.get(noradId);
    if (cached && cached.expiry > Date.now()) {
      this.logger.debug(`缓存命中: ${noradId}`);
      return cached.data;
    }

    // 从 API 获取
    const data = await this.fetchFromApi(noradId);

    // 存入缓存
    this.cache.set(noradId, {
      data,
      expiry: Date.now() + this.cacheTTL,
    });

    return data;
  }

  /**
   * 从 ESA DISCOS API 获取卫星信息
   */
  private async fetchFromApi(noradId: string): Promise<DiscosSatelliteInfo | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const url = `${this.baseUrl}/objects?filter=satno=${noradId}`;
      this.logger.debug(`请求 ESA DISCOS API: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/vnd.api+json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`ESA DISCOS API 请求失败: HTTP ${response.status}`);
        return null;
      }

      const json = await response.json();

      if (!json.data || json.data.length === 0) {
        this.logger.debug(`ESA DISCOS 未找到卫星: ${noradId}`);
        return null;
      }

      const attrs = json.data[0].attributes;

      return {
        satno: attrs.satno,
        name: attrs.name,
        objectClass: attrs.objectClass,
        mass: attrs.mass,
        shape: attrs.shape,
        width: attrs.width,
        height: attrs.height,
        depth: attrs.depth,
        span: attrs.span,
        mission: attrs.mission,
        cosparId: attrs.cosparId,
        firstEpoch: attrs.firstEpoch,
      };
    } catch (error) {
      this.logger.error(`ESA DISCOS API 请求失败 (${noradId}): ${error.message}`);
      return null;
    }
  }

  /**
   * 扩展卫星元数据
   */
  async enrichSatelliteMetadata(metadata: SatelliteMetadata): Promise<SatelliteMetadata> {
    const info = await this.getSatelliteInfo(metadata.noradId);

    if (!info) {
      return metadata;
    }

    // 合并数据（不覆盖已有数据）
    return {
      ...metadata,
      // 新增字段
      cosparId: metadata.cosparId || info.cosparId,
      objectClass: metadata.objectClass || info.objectClass,
      launchMass: metadata.launchMass ?? info.mass,
      shape: metadata.shape || info.shape,
      dimensions: metadata.dimensions || this.formatDimensions(info),
      span: metadata.span ?? info.span,
      firstEpoch: metadata.firstEpoch || info.firstEpoch,
    };
  }

  /**
   * 格式化尺寸显示
   */
  private formatDimensions(info: DiscosSatelliteInfo): string | undefined {
    if (!info.width && !info.height && !info.depth) {
      return undefined;
    }
    const parts = [];
    if (info.width) parts.push(`${info.width}m`);
    if (info.height) parts.push(`${info.height}m`);
    if (info.depth) parts.push(`${info.depth}m`);
    return parts.join(' × ');
  }
}
```

---

### 3. 更新 SatelliteMetadata 接口

**文件**: `backend-nest/src/modules/satellite/interfaces/satellite.interface.ts`

添加新字段：

```typescript
export interface SatelliteMetadata {
  // ... 现有字段 ...

  // ESA DISCOS 扩展字段
  cosparId?: string;        // COSPAR 编号
  objectClass?: string;     // 对象类型 (Payload/Debris)
  launchMass?: number;      // 发射质量 (kg)
  shape?: string;           // 形状代码
  dimensions?: string;      // 尺寸 (格式化显示)
  span?: number;            // 最大跨度 (米)
  firstEpoch?: string;      // 首次轨道历元
}
```

---

### 4. 注册服务到模块

**文件**: `backend-nest/src/modules/satellite/satellite.module.ts`

```typescript
import { EsaDiscosService } from './services/esa-discos.service';

@Module({
  // ...
  providers: [
    // ...
    EsaDiscosService,
  ],
  exports: [
    // ...
    EsaDiscosService,
  ],
})
export class SatelliteModule {}
```

---

### 5. 修改控制器集成服务

**文件**: `backend-nest/src/modules/satellite/satellite.controller.ts`

```typescript
import { EsaDiscosService } from './services/esa-discos.service';

@Controller('satellites')
export class SatelliteController {
  constructor(
    // ...
    private readonly esaDiscosService: EsaDiscosService,
  ) {}

  /**
   * 获取卫星元数据
   * GET /api/satellites/:noradId/metadata
   */
  @Get(':noradId/metadata')
  async getSatelliteMetadata(@Param('noradId') noradId: string) {
    this.logger.log(`获取卫星 ${noradId} 的元数据`);

    const metadata = this.spaceTrackService.getSatelliteMetadata(noradId);
    if (!metadata) {
      return {
        code: -1,
        data: null,
        message: '卫星元数据不存在',
      };
    }

    // 尝试从 ESA DISCOS 获取扩展信息
    const enrichedMetadata = await this.esaDiscosService.enrichSatelliteMetadata(metadata);

    return {
      code: 0,
      data: enrichedMetadata,
      message: 'success',
    };
  }
}
```

---

## 缓存策略

为满足用户"不要频繁访问"的要求：

1. **内存缓存**: 请求过的数据缓存在内存，24 小时有效
2. **缓存命中**: 直接返回缓存数据，不发 API 请求
3. **缓存未命中**: 才调用 ESA DISCOS API

---

## 关键文件清单

| 操作 | 文件路径 |
|------|---------|
| 新建 | `src/modules/satellite/services/esa-discos.service.ts` |
| 修改 | `src/modules/satellite/satellite.module.ts` |
| 修改 | `src/modules/satellite/satellite.controller.ts` |
| 修改 | `src/modules/satellite/interfaces/satellite.interface.ts` |
| 修改 | `src/config/app.config.ts` |
| 修改 | `.env` |
| 修改 | `.env.example` |

---

## 验证步骤

1. 启动后端服务 `pnpm run start:dev`
2. 调用 `/api/satellites/25544/metadata` (ISS)
3. 验证返回数据包含 `launchMass`, `dimensions`, `span` 等字段
4. 再次调用同一接口，检查日志确认使用缓存（无新 API 请求）

---

## 注意事项

1. **API Token 安全**: 不要提交到 Git，`.env` 已在 `.gitignore` 中
2. **缓存有效期**: 24 小时，可根据需要调整
3. **错误处理**: API 失败时返回原始元数据，不影响主功能
4. **形状代码**: ESA DISCOS 的 shape 字段是代码（如 "Irr" = Irregular），需要映射表转换展示