import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';

@Entity('education_quiz_answers')
export class QuizAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  quizId: number;

  @ManyToOne(() => Quiz)
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  selectedIndex: number; // 用户选择的答案索引

  @Column()
  isCorrect: boolean;

  @Column({ default: 0 })
  pointsEarned: number;

  @CreateDateColumn()
  createdAt: Date;
}
