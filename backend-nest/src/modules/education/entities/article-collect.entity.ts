import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Article } from './article.entity';

@Entity('education_article_collects')
export class ArticleCollect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  articleId: number;

  @ManyToOne(() => Article)
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @CreateDateColumn()
  createdAt: Date;
}