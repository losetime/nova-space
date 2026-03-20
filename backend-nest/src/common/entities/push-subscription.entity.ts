import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { PushSubscriptionStatus } from '../enums/push.enum';
import { User } from './user.entity';

@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  email: string;

  // 订阅配置
  @Column({ default: true })
  subscribeSpaceWeather: boolean;

  @Column({ default: false })
  subscribeSatellitePass: boolean;

  // 推送状态
  @Column({ default: true })
  enabled: boolean;

  @Column({
    type: 'simple-enum',
    enum: PushSubscriptionStatus,
    default: PushSubscriptionStatus.ACTIVE,
  })
  status: PushSubscriptionStatus;

  // 上次推送时间
  @Column({ nullable: true })
  lastPushAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}