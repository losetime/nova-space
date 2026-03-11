import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../../common/entities/user.entity';

export enum NotificationType {
  INTELLIGENCE = 'intelligence', // 情报通知
  SYSTEM = 'system',             // 系统通知
  ACHIEVEMENT = 'achievement',   // 成就通知
}

@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'uuid', nullable: true })
  relatedId: string; // 关联的情报ID等

  @Column({ nullable: true })
  relatedType: string; // 关联类型：intelligence, article 等

  @CreateDateColumn()
  createdAt: Date;
}