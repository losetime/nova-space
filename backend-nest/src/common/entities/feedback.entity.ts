import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FeedbackType, FeedbackStatus } from '../enums/feedback.enum';
import { User } from './user.entity';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({
    type: 'simple-enum',
    enum: FeedbackType,
    default: FeedbackType.SUGGESTION,
  })
  type: FeedbackType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'simple-enum',
    enum: FeedbackStatus,
    default: FeedbackStatus.PENDING,
  })
  status: FeedbackStatus;

  // 可选：联系方式（匿名用户可填写）
  @Column({ length: 100, nullable: true })
  contact: string;

  // 可选：截图/附件URL
  @Column({ type: 'simple-json', nullable: true })
  attachments: string[];

  // 管理员回复
  @Column({ type: 'text', nullable: true })
  reply: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
