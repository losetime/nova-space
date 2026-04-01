import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('education_quizzes')
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'json' })
  options: string[]; // ['选项A', '选项B', '选项C', '选项D']

  @Column()
  correctIndex: number; // 正确答案的索引 (0-3)

  @Column({ type: 'text', nullable: true })
  explanation: string; // 答案解析

  @Column({
    type: 'enum',
    enum: ['basic', 'advanced', 'mission', 'people'],
    default: 'basic',
  })
  category: string;

  @Column({ default: 0 })
  points: number; // 答对获得的积分

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
