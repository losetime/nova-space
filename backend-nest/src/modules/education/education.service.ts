import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { ArticleCollect } from './entities/article-collect.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class EducationService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAnswer)
    private quizAnswerRepository: Repository<QuizAnswer>,
    @InjectRepository(ArticleCollect)
    private articleCollectRepository: Repository<ArticleCollect>,
  ) {}

  // 获取文章列表
  async getArticles(
    category?: string,
    page = 1,
    limit = 12,
  ): Promise<{ list: Article[]; total: number }> {
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .where('article.isPublished = :isPublished', { isPublished: true })
      .orderBy('article.createdAt', 'DESC');

    if (category && category !== 'all') {
      queryBuilder.andWhere('article.category = :category', { category });
    }

    const [list, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { list, total };
  }

  // 获取文章详情
  async getArticleById(id: number): Promise<Article | null> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (article) {
      // 增加浏览量
      await this.articleRepository.increment({ id }, 'views', 1);
    }
    return article;
  }

  // 创建文章（管理员用）
  async createArticle(dto: CreateArticleDto): Promise<Article> {
    const article = this.articleRepository.create(dto);
    return this.articleRepository.save(article);
  }

  // 获取每日问答
  async getDailyQuiz(userId: string): Promise<Quiz | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查今天是否已经回答过任何题目（每天只能答一题）
    const answeredToday = await this.quizAnswerRepository
      .createQueryBuilder('answer')
      .where('answer.userId = :userId', { userId })
      .andWhere('answer.createdAt >= :today', { today })
      .getOne();

    // 如果今天已答过，直接返回 null
    if (answeredToday) {
      return null;
    }

    // 随机返回一道题目
    return this.quizRepository
      .createQueryBuilder('quiz')
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
  }

  // 提交答案
  async submitAnswer(
    userId: string,
    dto: SubmitAnswerDto,
  ): Promise<{
    isCorrect: boolean;
    correctIndex: number;
    explanation: string;
    pointsEarned: number;
  }> {
    const quiz = await this.quizRepository.findOne({
      where: { id: dto.quizId },
    });

    if (!quiz) {
      throw new Error('题目不存在');
    }

    const isCorrect = dto.selectedIndex === quiz.correctIndex;
    const pointsEarned = isCorrect ? quiz.points : 0;

    // 保存答题记录
    const answer = this.quizAnswerRepository.create({
      userId,
      quizId: dto.quizId,
      selectedIndex: dto.selectedIndex,
      isCorrect,
      pointsEarned,
    });
    await this.quizAnswerRepository.save(answer);

    return {
      isCorrect,
      correctIndex: quiz.correctIndex,
      explanation: quiz.explanation || '',
      pointsEarned,
    };
  }

  // 获取用户答题统计
  async getQuizStats(userId: string): Promise<{
    totalAnswered: number;
    correctCount: number;
    totalPoints: number;
    streak: number;
  }> {
    const answers = await this.quizAnswerRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const totalAnswered = answers.length;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalPoints = answers.reduce((sum, a) => sum + a.pointsEarned, 0);

    // 计算连续答对天数
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < answers.length; i++) {
      const answerDate = new Date(answers[i].createdAt);
      answerDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor(
        (today.getTime() - answerDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === i && answers[i].isCorrect) {
        streak++;
      } else {
        break;
      }
    }

    return { totalAnswered, correctCount, totalPoints, streak };
  }

  // 收藏/取消收藏文章
  async toggleCollect(
    userId: string,
    articleId: number,
  ): Promise<{ isCollected: boolean }> {
    const existing = await this.articleCollectRepository.findOne({
      where: { userId, articleId },
    });

    if (existing) {
      await this.articleCollectRepository.remove(existing);
      return { isCollected: false };
    } else {
      const collect = this.articleCollectRepository.create({
        userId,
        articleId,
      });
      await this.articleCollectRepository.save(collect);
      return { isCollected: true };
    }
  }

  // 检查是否已收藏
  async isCollected(userId: string, articleId: number): Promise<boolean> {
    const count = await this.articleCollectRepository.count({
      where: { userId, articleId },
    });
    return count > 0;
  }

  // 获取用户收藏的文章列表
  async getUserCollects(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: any[]; total: number }> {
    const [collects, total] = await this.articleCollectRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['article'],
    });

    const data = collects.map((collect) => ({
      id: collect.id,
      articleId: collect.articleId,
      title: collect.article?.title,
      summary: collect.article?.summary,
      cover: collect.article?.cover,
      category: collect.article?.category,
      collectedAt: collect.createdAt,
    }));

    return { data, total };
  }
}
