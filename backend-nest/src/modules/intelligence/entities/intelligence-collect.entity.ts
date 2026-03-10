import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Intelligence } from './intelligence.entity';

@Entity('intelligence_collects')
export class IntelligenceCollect {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  intelligenceId: number;

  @ManyToOne(() => Intelligence)
  @JoinColumn({ name: 'intelligenceId' })
  intelligence: Intelligence;

  @CreateDateColumn()
  createdAt: Date;
}