import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { Article } from './entities/article.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { ArticleCollect } from './entities/article-collect.entity';
import { ArticleLike } from './entities/article-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      Quiz,
      QuizAnswer,
      ArticleCollect,
      ArticleLike,
    ]),
  ],
  controllers: [EducationController],
  providers: [EducationService],
})
export class EducationModule {}
