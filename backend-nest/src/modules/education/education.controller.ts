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
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

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
    const limitNum = parseInt(limit || '10', 10);
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
}