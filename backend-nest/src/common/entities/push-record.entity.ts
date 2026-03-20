import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { PushType, PushRecordStatus } from '../enums/push.enum';
import { User } from './user.entity';

@Entity('push_records')
export class PushRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({
    type: 'simple-enum',
    enum: PushType,
  })
  type: PushType;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  content: string;

  // 关联的内容ID
  @Column({ type: 'simple-array', nullable: true })
  relatedIds: string[];

  @Column()
  sentAt: Date;

  @Column({
    type: 'simple-enum',
    enum: PushRecordStatus,
    default: PushRecordStatus.PENDING,
  })
  status: PushRecordStatus;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}