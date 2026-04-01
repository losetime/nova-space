import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EducationService } from './education.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  // 获取文章列表
  @Get('articles')
  async getArticles(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '12', 10);
    return this.educationService.getArticles(category, pageNum, limitNum);
  }

  // 获取文章详情
  @Get('articles/:id')
  async getArticle(@Param('id') id: string) {
    return this.educationService.getArticleById(parseInt(id, 10));
  }

  // 创建文章（管理员用，暂不加权限控制）
  @Post('articles')
  async createArticle(@Body() dto: CreateArticleDto) {
    return this.educationService.createArticle(dto);
  }

  // 获取每日问答
  @Get('quiz/daily')
  @UseGuards(JwtAuthGuard)
  async getDailyQuiz(@Request() req: { user: { id: string } }) {
    return this.educationService.getDailyQuiz(req.user.id);
  }

  // 提交答案
  @Post('quiz/submit')
  @UseGuards(JwtAuthGuard)
  async submitAnswer(
    @Request() req: { user: { id: string } },
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.educationService.submitAnswer(req.user.id, dto);
  }

  // 获取答题统计
  @Get('quiz/stats')
  @UseGuards(JwtAuthGuard)
  async getQuizStats(@Request() req: { user: { id: string } }) {
    return this.educationService.getQuizStats(req.user.id);
  }

  // 收藏/取消收藏文章
  @Post('articles/:id/collect')
  @UseGuards(JwtAuthGuard)
  async toggleCollect(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.educationService.toggleCollect(req.user.id, parseInt(id, 10));
  }

  // 检查是否已收藏
  @Get('articles/:id/collected')
  @UseGuards(JwtAuthGuard)
  async isCollected(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    const isCollected = await this.educationService.isCollected(
      req.user.id,
      parseInt(id, 10),
    );
    return { isCollected };
  }

  // 获取用户收藏的文章列表
  @Get('articles/user/collects')
  @UseGuards(JwtAuthGuard)
  async getUserCollects(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.educationService.getUserCollects(
      req.user.id,
      parseInt(page || '1', 10),
      parseInt(limit || '10', 10),
    );
  }
}
