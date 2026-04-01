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
import { IntelligenceService } from './intelligence.service';
import { CreateIntelligenceDto } from './dto/create-intelligence.dto';
import { QueryIntelligenceDto } from './dto/query-intelligence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  // 获取情报列表
  @Get()
  async findAll(@Query() query: QueryIntelligenceDto, @Request() req: any) {
    const userLevel = req.user?.level || 'basic';
    return this.intelligenceService.findAll(query, userLevel);
  }

  // 获取热门排行
  @Get('hot')
  async getHotList() {
    return this.intelligenceService.getHotList(5);
  }

  // 获取情报详情
  @Get(':id')
  async findOne(@Param('id') id: number, @Request() req: any) {
    const userId = req.user?.id;
    return this.intelligenceService.findOne(id, userId);
  }

  // 收藏/取消收藏情报
  @Post(':id/collect')
  @UseGuards(JwtAuthGuard)
  async collect(
    @Param('id') id: number,
    @Request() req: { user: { id: string } },
  ) {
    return this.intelligenceService.collect(req.user.id, id);
  }

  // 获取用户收藏列表
  @Get('user/collects')
  @UseGuards(JwtAuthGuard)
  async getUserCollects(@Request() req: { user: { id: string } }) {
    return this.intelligenceService.getUserCollects(req.user.id);
  }

  // 创建情报（管理功能）
  @Post()
  async create(@Body() dto: CreateIntelligenceDto) {
    return this.intelligenceService.create(dto);
  }
}
