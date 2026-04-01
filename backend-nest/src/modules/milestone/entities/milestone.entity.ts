import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MilestoneCategory {
  LAUNCH = 'launch', // 发射任务
  RECOVERY = 'recovery', // 回收任务
  ORBIT = 'orbit', // 在轨测试
  MISSION = 'mission', // 深空探测
  OTHER = 'other', // 其他
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string; // 事件标题

  @Column({ type: 'text' })
  description: string; // 事件描述（简短）

  @Column({ type: 'text', nullable: true })
  content: string; // 详情内容（Markdown）

  @Column()
  eventDate: Date; // 历史事件发生日期

  @Column({
    type: 'enum',
    enum: MilestoneCategory,
    default: MilestoneCategory.OTHER,
  })
  category: MilestoneCategory; // 分类

  @Column({ nullable: true })
  cover: string; // 封面图 URL

  @Column({ type: 'jsonb', nullable: true })
  media: MediaItem[]; // 媒体资源 [{type: 'image'|'video', url: string}]

  @Column({ nullable: true })
  relatedSatelliteNoradId: string; // 关联卫星 NORAD ID

  @Column({ default: 1 })
  importance: number; // 重要程度 1-5

  @Column({ nullable: true })
  location: string; // 发射/事件地点

  @Column({ nullable: true })
  organizer: string; // 组织/机构

  @Column({ default: true })
  isPublished: boolean; // 是否发布

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
