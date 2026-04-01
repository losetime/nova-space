import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IntelligenceCategory {
  LAUNCH = 'launch', // 发射任务
  SATELLITE = 'satellite', // 卫星运行
  INDUSTRY = 'industry', // 行业动态
  RESEARCH = 'research', // 科研成果
  ENVIRONMENT = 'environment', // 空间环境
}

export enum IntelligenceLevel {
  FREE = 'free', // 免费用户可见
  ADVANCED = 'advanced', // 进阶会员可见
  PROFESSIONAL = 'professional', // 专业会员可见
}

@Entity('intelligences')
export class Intelligence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  cover: string;

  @Column({
    type: 'enum',
    enum: IntelligenceCategory,
    default: IntelligenceCategory.LAUNCH,
  })
  category: IntelligenceCategory;

  @Column({
    type: 'enum',
    enum: IntelligenceLevel,
    default: IntelligenceLevel.FREE,
  })
  level: IntelligenceLevel;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  collects: number;

  @Column()
  source: string;

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ type: 'text', nullable: true })
  tags: string; // JSON array

  @Column({ type: 'text', nullable: true })
  analysis: string; // 深度解读

  @Column({ type: 'text', nullable: true })
  trend: string; // 趋势预判

  @Column({ nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
