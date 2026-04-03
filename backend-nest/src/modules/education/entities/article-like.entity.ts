import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('article_likes')
export class ArticleLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  articleId: number;

  @CreateDateColumn()
  createdAt: Date;
}
