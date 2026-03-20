import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Intelligence, IntelligenceCategory, IntelligenceLevel } from './entities/intelligence.entity';
import { IntelligenceCollect } from './entities/intelligence-collect.entity';
import { CreateIntelligenceDto } from './dto/create-intelligence.dto';
import { QueryIntelligenceDto } from './dto/query-intelligence.dto';

// 种子数据
const seedIntelligences: Partial<Intelligence>[] = [
  {
    title: 'SpaceX 星舰第五次试飞即将进行，将尝试新的回收方案',
    summary: 'SpaceX 计划于本周进行星舰的第五次轨道试飞任务，本次试飞将首次尝试使用发射塔臂捕捉回收超重型助推器...',
    content: `# SpaceX 星舰第五次试飞即将进行

SpaceX 计划于本周进行星舰的第五次轨道试飞任务，本次试飞将首次尝试使用发射塔臂捕捉回收超重型助推器。

## 任务背景

星舰是 SpaceX 正在开发的下一代完全可重复使用运载火箭，由超重型助推器和星舰飞船两部分组成。此次试飞将验证多项关键技术。

## 回收方案创新

本次试飞最大的亮点是首次尝试使用发射塔臂（Mechazilla）捕捉回收超重型助推器。这种方案可以大大减少着陆所需的燃料，提高运载效率。

## 技术挑战

- 精确控制助推器的返回轨迹
- 发射塔臂的实时响应能力
- 极端天气条件下的操作限制`,
    category: IntelligenceCategory.LAUNCH,
    level: IntelligenceLevel.FREE,
    source: 'SpaceX 官方',
    sourceUrl: 'https://www.spacex.com',
    tags: JSON.stringify(['SpaceX', '星舰', '回收技术']),
    analysis: '此次试飞如果成功，将标志着可重复使用火箭技术的重大突破，有望大幅降低太空发射成本。',
    trend: '预计未来6个月内，星舰将进入常态化试飞阶段，2026年有望实现首次商业发射。',
    publishedAt: new Date('2026-03-04'),
  },
  {
    title: '中国空间站完成新一轮科学实验，涉及微重力材料研究',
    summary: '神舟十八号乘组在轨期间完成了多项科学实验，包括微重力环境下的材料科学、生命科学等领域的研究...',
    content: `# 中国空间站完成新一轮科学实验

神舟十八号乘组在轨期间完成了多项科学实验，包括微重力环境下的材料科学、生命科学等领域的研究。

## 实验内容

### 材料科学实验
- 金属合金凝固实验
- 半导体晶体生长
- 新型材料制备

### 生命科学实验
- 细胞培养实验
- 植物生长实验
- 微生物研究

## 研究意义

这些实验将为未来的深空探测和太空资源利用提供重要的科学数据支撑。`,
    category: IntelligenceCategory.SATELLITE,
    level: IntelligenceLevel.FREE,
    source: '中国航天科技集团',
    sourceUrl: 'http://www.spacechina.com',
    tags: JSON.stringify(['中国空间站', '科学实验', '微重力']),
    analysis: '中国空间站已成为重要的太空实验室，多项实验成果具有国际领先水平。',
    trend: '预计2026年将开展更多国际合作实验项目。',
    publishedAt: new Date('2026-03-03'),
  },
  {
    title: '全球商业航天市场规模突破 5000 亿美元，卫星互联网成主要增长点',
    summary: '根据最新行业报告显示，2025 年全球商业航天市场规模达到 5120 亿美元，同比增长 18%。其中卫星互联网和太空旅游成为主要增长驱动力...',
    content: `# 全球商业航天市场规模突破 5000 亿美元

根据最新行业报告显示，2025 年全球商业航天市场规模达到 5120 亿美元，同比增长 18%。

## 市场结构分析

### 卫星互联网
- Starlink 用户突破 300 万
- OneWeb 完成全球覆盖
- 中国星链加速部署

### 太空旅游
- SpaceX Inspiration4 系列任务
- 维珍银河商业运营
- 蓝色起源新谢泼德飞行

## 区域分布

北美市场占比 45%，欧洲 25%，亚太地区快速增长至 20%。`,
    category: IntelligenceCategory.INDUSTRY,
    level: IntelligenceLevel.ADVANCED,
    source: '航天产业研究院',
    tags: JSON.stringify(['商业航天', '市场规模', '卫星互联网']),
    analysis: '卫星互联网已成为商业航天最大的增长引擎，预计未来5年将保持20%以上的年增长率。',
    trend: '2026年全球卫星互联网用户有望突破5000万，市场规模将超过1000亿美元。',
    publishedAt: new Date('2026-03-02'),
  },
  {
    title: '韦伯望远镜发现迄今最遥远星系，距今 135 亿年',
    summary: 'NASA 詹姆斯·韦伯太空望远镜团队宣布发现了一个新的遥远星系候选体，其红移值达到 14.3，是迄今观测到的最遥远天体...',
    content: `# 韦伯望远镜发现迄今最遥远星系

NASA 詹姆斯·韦伯太空望远镜团队宣布发现了一个新的遥远星系候选体，其红移值达到 14.3，是迄今观测到的最遥远天体。

## 发现详情

该星系被命名为 JADES-GS-z14.3，存在于宇宙大爆炸后仅 2.9 亿年。

## 科学意义

这一发现将帮助科学家理解：
- 宇宙早期的星系形成过程
- 第一代恒星的形成机制
- 宇宙再电离时期

## 观测技术

韦伯望远镜的红外成像和光谱分析能力是此次发现的关键。`,
    category: IntelligenceCategory.RESEARCH,
    level: IntelligenceLevel.FREE,
    source: 'NASA',
    sourceUrl: 'https://www.nasa.gov',
    tags: JSON.stringify(['韦伯望远镜', '星系', '宇宙学']),
    analysis: '这一发现挑战了现有的星系形成理论，表明早期宇宙中星系的形成速度比预期更快。',
    trend: '随着韦伯望远镜持续观测，预计将发现更多早期宇宙天体。',
    publishedAt: new Date('2026-03-01'),
  },
  {
    title: '欧洲阿里安 6 号火箭首次商业发射任务确定',
    summary: '欧洲航天局宣布阿里安 6 号运载火箭将于下月执行首次商业发射任务，标志着欧洲重新获得独立进入太空的能力...',
    content: `# 欧洲阿里安 6 号火箭首次商业发射任务确定

欧洲航天局宣布阿里安 6 号运载火箭将于下月执行首次商业发射任务，标志着欧洲重新获得独立进入太空的能力。

## 火箭参数

- 高度：63 米
- 直径：5.4 米
- 低轨运载能力：21 吨
- 地球同步转移轨道：11.5 吨

## 商业前景

阿里安 6 号将主要服务于欧洲政府和商业卫星发射市场，与 SpaceX Falcon 9 竞争。

## 成本优势

相比阿里安 5 号，新火箭的发射成本降低了 40%。`,
    category: IntelligenceCategory.LAUNCH,
    level: IntelligenceLevel.ADVANCED,
    source: '欧洲航天局',
    sourceUrl: 'https://www.esa.int',
    tags: JSON.stringify(['阿里安6号', '欧洲航天', '商业发射']),
    analysis: '阿里安 6 号的成功将帮助欧洲保持在全球商业发射市场的竞争力。',
    trend: '预计2026年将执行6-8次发射任务，逐步建立市场信心。',
    publishedAt: new Date('2026-02-28'),
  },
  {
    title: '太阳活动进入高峰期，多国发布空间天气预警',
    summary: '随着第 25 个太阳活动周进入峰值阶段，近期太阳耀斑和日冕物质抛射活动频繁，多国航天机构发布空间天气预警...',
    content: `# 太阳活动进入高峰期

随着第 25 个太阳活动周进入峰值阶段，近期太阳耀斑和日冕物质抛射活动频繁，多国航天机构发布空间天气预警。

## 当前状况

- 太阳黑子数达到 150 以上
- X 级耀斑频发
- 多次日冕物质抛射

## 影响范围

### 卫星运行
- 表面充电风险增加
- 单粒子效应概率上升
- 轨道大气阻力变化

### 地面设施
- 电网波动风险
- 通信干扰
- GPS 精度下降

## 防护建议

建议卫星运营商加强监测，必要时进入安全模式。`,
    category: IntelligenceCategory.ENVIRONMENT,
    level: IntelligenceLevel.FREE,
    source: '国家空间天气监测预警中心',
    tags: JSON.stringify(['太阳活动', '空间天气', '预警']),
    analysis: '当前太阳活动强度超过预期，可能对在轨卫星和地面设施造成影响。',
    trend: '太阳活动高峰预计将持续到2025年底，之后逐渐减弱。',
    publishedAt: new Date('2026-02-27'),
  },
  {
    title: '日本 H3 火箭成功完成第二次试飞',
    summary: '日本宇宙航空研究开发机构（JAXA）宣布 H3 运载火箭成功完成第二次试飞，将一颗试验卫星送入预定轨道...',
    content: `# 日本 H3 火箭成功完成第二次试飞

日本宇宙航空研究开发机构（JAXA）宣布 H3 运载火箭成功完成第二次试飞，将一颗试验卫星送入预定轨道。

## 火箭特点

- 全部采用日本国产技术
- 低成本设计，发射费用约 5000 万美元
- 可重复使用潜力

## 试飞结果

火箭飞行正常，载荷分离成功，各项参数符合预期。

## 商业前景

H3 将逐步替代 H-IIA，成为日本主力运载火箭，并争取国际商业发射订单。`,
    category: IntelligenceCategory.LAUNCH,
    level: IntelligenceLevel.FREE,
    source: 'JAXA',
    sourceUrl: 'https://www.jaxa.jp',
    tags: JSON.stringify(['H3火箭', '日本航天', '试飞']),
    analysis: 'H3 的成功标志着日本在运载火箭领域取得重要进展，有望在国际市场获得一席之地。',
    trend: '预计2026年将执行首次商业发射任务。',
    publishedAt: new Date('2026-02-26'),
  },
  {
    title: '中国成功发射新一代海洋观测卫星',
    summary: '中国在酒泉卫星发射中心成功发射新一代海洋观测卫星，将大幅提升海洋环境监测能力...',
    content: `# 中国成功发射新一代海洋观测卫星

中国在酒泉卫星发射中心成功发射新一代海洋观测卫星，将大幅提升海洋环境监测能力。

## 卫星参数

- 质量：约 2.5 吨
- 轨道：太阳同步轨道
- 设计寿命：8 年

## 主要功能

- 海洋水色观测
- 海面温度监测
- 海洋动力环境探测
- 海冰监测

## 应用领域

- 渔业资源调查
- 海洋环境监测
- 气候变化研究
- 海洋灾害预警`,
    category: IntelligenceCategory.SATELLITE,
    level: IntelligenceLevel.FREE,
    source: '中国航天科技集团',
    tags: JSON.stringify(['海洋卫星', '中国航天', '遥感']),
    analysis: '新一代海洋卫星将显著提升中国在海洋监测领域的能力，对海洋经济发展具有重要意义。',
    trend: '预计未来将发射多颗同类卫星，形成星座观测能力。',
    publishedAt: new Date('2026-02-25'),
  },
];

@Injectable()
export class IntelligenceService implements OnModuleInit {
  constructor(
    @InjectRepository(Intelligence)
    private intelligenceRepository: Repository<Intelligence>,
    @InjectRepository(IntelligenceCollect)
    private collectRepository: Repository<IntelligenceCollect>,
  ) {}

  async onModuleInit() {
    // 初始化种子数据
    const count = await this.intelligenceRepository.count();
    if (count === 0) {
      await this.intelligenceRepository.save(seedIntelligences);
      console.log('Intelligence seed data initialized');
    }
  }

  // 获取情报列表
  async findAll(query: QueryIntelligenceDto, userLevel?: string) {
    const { category, page = 1, pageSize = 12 } = query;
    
    const qb = this.intelligenceRepository.createQueryBuilder('intel');
    
    if (category) {
      qb.andWhere('intel.category = :category', { category });
    }

    // 根据用户等级过滤可见情报
    if (userLevel === 'professional') {
      // 专业会员可见所有
    } else if (userLevel === 'advanced') {
      qb.andWhere('intel.level IN (:...levels)', { 
        levels: [IntelligenceLevel.FREE, IntelligenceLevel.ADVANCED] 
      });
    } else {
      qb.andWhere('intel.level = :level', { level: IntelligenceLevel.FREE });
    }

    qb.orderBy('intel.publishedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return {
      list: list.map(item => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
        isLocked: userLevel === 'basic' && item.level !== IntelligenceLevel.FREE,
      })),
      total,
      page,
      pageSize,
    };
  }

  // 获取情报详情
  async findOne(id: number, userId?: string) {
    const intelligence = await this.intelligenceRepository.findOne({
      where: { id },
    });

    if (!intelligence) {
      return null;
    }

    // 增加浏览量
    await this.intelligenceRepository.increment({ id }, 'views', 1);

    // 检查是否已收藏
    let isCollected = false;
    if (userId) {
      const collect = await this.collectRepository.findOne({
        where: { userId, intelligenceId: id },
      });
      isCollected = !!collect;
    }

    return {
      ...intelligence,
      tags: intelligence.tags ? JSON.parse(intelligence.tags) : [],
      isCollected,
    };
  }

  // 获取热门排行
  async getHotList(limit: number = 5) {
    const list = await this.intelligenceRepository.find({
      order: { views: 'DESC' },
      take: limit,
    });

    return list.map(item => ({
      id: item.id,
      title: item.title,
      views: item.views,
    }));
  }

  // 收藏情报
  async collect(userId: string, intelligenceId: number) {
    const existing = await this.collectRepository.findOne({
      where: { userId, intelligenceId },
    });

    if (existing) {
      // 取消收藏
      await this.collectRepository.remove(existing);
      await this.intelligenceRepository.decrement(
        { id: intelligenceId },
        'collects',
        1,
      );
      return { collected: false };
    } else {
      // 添加收藏
      const collect = this.collectRepository.create({
        userId,
        intelligenceId,
      });
      await this.collectRepository.save(collect);
      await this.intelligenceRepository.increment(
        { id: intelligenceId },
        'collects',
        1,
      );
      return { collected: true };
    }
  }

  // 获取用户收藏列表
  async getUserCollects(userId: string) {
    const collects = await this.collectRepository.find({
      where: { userId },
      relations: ['intelligence'],
      order: { createdAt: 'DESC' },
    });

    return collects.map(c => ({
      ...c.intelligence,
      tags: c.intelligence.tags ? JSON.parse(c.intelligence.tags) : [],
      collectedAt: c.createdAt,
    }));
  }

  // 创建情报（管理功能）
  async create(dto: CreateIntelligenceDto) {
    const intelligence = this.intelligenceRepository.create(dto);
    return this.intelligenceRepository.save(intelligence);
  }
}