import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Request() req: any,
  ) {
    // 如果用户已登录，自动关联用户ID
    if (req.user?.id) {
      createFeedbackDto.userId = req.user.id;
    }
    const feedback = await this.feedbackService.create(createFeedbackDto);
    return feedback;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.feedbackService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.feedbackService.updateStatus(id, status);
  }
}
