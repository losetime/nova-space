import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

// 种子数据
const seedArticles = [
  {
    title: '轨道类型详解：从低轨到高轨',
    content: '# 轨道类型详解\n\n卫星轨道是卫星绕地球运行的路径。根据轨道高度和特性，主要分为以下几类：\n\n## 低地球轨道 (LEO)\n\n低地球轨道高度在 160-2000 公里之间，是最常见的卫星轨道类型。\n\n**特点：**\n- 距离地球近，信号延迟低\n- 需要较高速度（约 7.8 km/s）维持轨道\n- 大气阻力影响较大，需要定期调整轨道\n\n**应用：**\n- 国际空间站（约 400 公里）\n- Starlink 卫星星座\n- 地球观测卫星',
    summary: '了解低轨、中轨、地球同步轨道等不同类型卫星轨道的特点和应用场景',
    cover: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800',
    category: 'basic',
    type: 'article',
    duration: 10,
    tags: ['轨道', '基础', '卫星'],
    isPublished: true,
  },
  {
    title: '火箭是如何工作的？',
    content: '# 火箭工作原理\n\n火箭是人类探索太空最重要的工具，它的工作原理基于牛顿第三定律：作用力与反作用力。\n\n## 基本原理\n\n火箭发动机通过高速喷射气体产生推力。根据动量守恒定律：\n\n**推力 = 质量流率 × 喷射速度**\n\n## 多级火箭\n\n现代火箭通常采用多级设计：\n\n1. **第一级**：提供起飞推力，在燃料耗尽后分离\n2. **第二级**：继续加速，将载荷送入轨道\n3. **上面级**：精确调整轨道',
    summary: '从牛顿第三定律到多级火箭，深入解析火箭推进原理',
    cover: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=800',
    category: 'basic',
    type: 'video',
    duration: 15,
    tags: ['火箭', '推进', '基础'],
    isPublished: true,
  },
  {
    title: '卫星内部结构剖析',
    content: '# 卫星内部结构\n\n卫星是高度复杂的航天器，由多个子系统组成。\n\n## 主要子系统\n\n### 1. 有效载荷\n卫星的核心功能部件，如：\n- 通信天线\n- 遥感相机\n- 导航设备\n\n### 2. 电源系统\n- **太阳能电池板**：将太阳光转换为电能\n- **蓄电池**：在阴影区供电\n- **电源控制单元**：管理电力分配',
    summary: '探索卫星的各个组成部分及其功能',
    cover: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=800',
    category: 'basic',
    type: 'article',
    duration: 8,
    tags: ['卫星', '结构', '基础'],
    isPublished: true,
  },
  {
    title: '轨道力学基础',
    content: '# 轨道力学基础\n\n轨道力学是研究天体运动规律的学科，是航天工程的理论基础。\n\n## 开普勒定律\n\n### 第一定律（椭圆定律）\n行星绕太阳运动的轨道是椭圆，太阳位于椭圆的一个焦点上。\n\n### 第二定律（面积定律）\n行星与太阳的连线在相等时间内扫过相等的面积。\n\n### 第三定律（周期定律）\n行星公转周期的平方与轨道半长轴的立方成正比。',
    summary: '学习开普勒定律和轨道要素，理解卫星运动规律',
    cover: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
    category: 'advanced',
    type: 'article',
    duration: 20,
    tags: ['轨道力学', '专业', '开普勒'],
    isPublished: true,
  },
  {
    title: '阿波罗登月计划',
    content: '# 阿波罗登月计划\n\n阿波罗计划是人类历史上最伟大的航天工程之一。\n\n## 计划概述\n\n- **时间**：1961-1972 年\n- **目标**：将人类送上月球并安全返回\n- **成果**：6 次成功登月，12 名宇航员踏上月球\n\n## 关键任务\n\n### 阿波罗 11 号\n- 时间：1969 年 7 月\n- 宇航员：阿姆斯特朗、奥尔德林、柯林斯\n- 成就：人类首次登月',
    summary: '回顾人类首次登月的伟大征程',
    cover: 'https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=800',
    category: 'mission',
    type: 'video',
    duration: 25,
    tags: ['登月', '阿波罗', 'NASA'],
    isPublished: true,
  },
  {
    title: '中国载人航天工程',
    content: '# 中国载人航天工程\n\n中国载人航天工程是中国航天史上规模最大的航天工程。\n\n## 发展历程\n\n### 神舟飞船\n- 神舟五号（2003）：杨利伟，中国首位航天员\n- 神舟七号（2008）：首次太空行走\n- 神舟十二号（2021）：首次入驻天宫空间站\n\n### 天宫空间站\n- 天和核心舱（2021 年发射）\n- 问天实验舱（2022 年发射）\n- 梦天实验舱（2022 年发射）',
    summary: '从神舟五号到天宫空间站，中国载人航天的辉煌历程',
    cover: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800',
    category: 'mission',
    type: 'article',
    duration: 18,
    tags: ['中国航天', '载人航天', '空间站'],
    isPublished: true,
  },
  {
    title: '航天先驱：齐奥尔科夫斯基',
    content: '# 齐奥尔科夫斯基\n\n康斯坦丁·齐奥尔科夫斯基（1857-1935），俄国科学家，被誉为"航天之父"。\n\n## 主要贡献\n\n### 火箭方程\n提出了著名的齐奥尔科夫斯基火箭方程：\n\n**Δv = ve × ln(m0/mf)**\n\n这个方程描述了火箭速度增量与推进剂消耗的关系。\n\n### 多级火箭概念\n最早提出多级火箭的构想，为现代火箭设计奠定基础。\n\n## 名言\n\n> "地球是人类的摇篮，但人类不可能永远生活在摇篮里。"',
    summary: '了解航天之父齐奥尔科夫斯基的贡献',
    cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    category: 'people',
    type: 'article',
    duration: 12,
    tags: ['人物', '航天先驱', '火箭'],
    isPublished: true,
  },
];

const seedQuizzes = [
  {
    question: '人类第一颗人造卫星是什么时候发射的？',
    options: ['1957 年', '1961 年', '1969 年', '1975 年'],
    correctIndex: 0,
    explanation: '1957 年 10 月 4 日，苏联发射了人类第一颗人造卫星"斯普特尼克 1 号"，标志着太空时代的开始。',
    category: 'basic',
    points: 10,
  },
  {
    question: '国际空间站的轨道高度大约是多少？',
    options: ['200 公里', '400 公里', '1000 公里', '36000 公里'],
    correctIndex: 1,
    explanation: '国际空间站运行在约 400 公里的低地球轨道上，这个高度既能保证较低的发射成本，又能避免过大的大气阻力。',
    category: 'basic',
    points: 10,
  },
  {
    question: '地球同步轨道的高度大约是多少？',
    options: ['400 公里', '2000 公里', '20200 公里', '35786 公里'],
    correctIndex: 3,
    explanation: '地球同步轨道（GEO）高度约为 35786 公里，在这个高度卫星的运行周期与地球自转周期相同，相对地面静止。',
    category: 'advanced',
    points: 15,
  },
  {
    question: '中国第一位进入太空的航天员是谁？',
    options: ['聂海胜', '杨利伟', '翟志刚', '景海鹏'],
    correctIndex: 1,
    explanation: '2003 年 10 月 15 日，杨利伟乘坐神舟五号飞船进入太空，成为中国第一位进入太空的航天员。',
    category: 'mission',
    points: 10,
  },
  {
    question: '火箭发动机的工作原理基于哪条物理定律？',
    options: ['牛顿第一定律', '牛顿第二定律', '牛顿第三定律', '万有引力定律'],
    correctIndex: 2,
    explanation: '火箭发动机通过高速喷射气体产生推力，这是牛顿第三定律（作用力与反作用力）的直接应用。',
    category: 'basic',
    points: 10,
  },
  {
    question: 'GPS 卫星运行在什么类型的轨道？',
    options: ['低地球轨道', '中地球轨道', '地球同步轨道', '太阳同步轨道'],
    correctIndex: 1,
    explanation: 'GPS 卫星运行在中地球轨道（MEO），高度约 20200 公里，这个高度可以保证卫星覆盖范围和定位精度。',
    category: 'advanced',
    points: 15,
  },
  {
    question: '谁被称为"航天之父"？',
    options: ['冯·布劳恩', '齐奥尔科夫斯基', '戈达德', '科罗廖夫'],
    correctIndex: 1,
    explanation: '俄国科学家齐奥尔科夫斯基提出了火箭方程和多级火箭概念，为现代航天奠定了理论基础，被称为"航天之父"。',
    category: 'people',
    points: 10,
  },
  {
    question: 'Starlink 卫星星座运行在什么轨道？',
    options: ['低地球轨道', '中地球轨道', '地球同步轨道', '高椭圆轨道'],
    correctIndex: 0,
    explanation: 'Starlink 卫星运行在约 550 公里的低地球轨道，这个高度可以提供较低的信号延迟，适合互联网通信。',
    category: 'advanced',
    points: 15,
  },
];

@Injectable()
export class EducationService implements OnModuleInit {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAnswer)
    private quizAnswerRepository: Repository<QuizAnswer>,
  ) {}

  // 模块初始化时运行种子数据
  async onModuleInit() {
    await this.seedData();
  }

  // 种子数据
  private async seedData() {
    const existingArticles = await this.articleRepository.count();
    const existingQuizzes = await this.quizRepository.count();

    if (existingArticles === 0) {
      for (const article of seedArticles) {
        await this.articleRepository.save(this.articleRepository.create(article));
      }
      console.log(`Seeded ${seedArticles.length} articles`);
    }

    if (existingQuizzes === 0) {
      for (const quiz of seedQuizzes) {
        await this.quizRepository.save(this.quizRepository.create(quiz));
      }
      console.log(`Seeded ${seedQuizzes.length} quizzes`);
    }
  }

  // 获取文章列表
  async getArticles(
    category?: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: Article[]; total: number }> {
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .where('article.isPublished = :isPublished', { isPublished: true })
      .orderBy('article.createdAt', 'DESC');

    if (category && category !== 'all') {
      queryBuilder.andWhere('article.category = :category', { category });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
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
    // 获取今天已答过的题目 ID
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const answeredToday = await this.quizAnswerRepository
      .createQueryBuilder('answer')
      .where('answer.userId = :userId', { userId })
      .andWhere('answer.createdAt >= :today', { today })
      .getMany();

    const answeredIds = answeredToday.map((a) => a.quizId);

    // 随机获取一道未答过的题目
    const queryBuilder = this.quizRepository
      .createQueryBuilder('quiz')
      .orderBy('RANDOM()')
      .limit(1);

    if (answeredIds.length > 0) {
      queryBuilder.where('quiz.id NOT IN (:...answeredIds)', { answeredIds });
    }

    return queryBuilder.getOne();
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
}