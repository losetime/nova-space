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
import type { RequestWithUser } from '../../common/interfaces';

@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Get()
  async findAll(
    @Query() query: QueryIntelligenceDto,
    @Request() req: RequestWithUser,
  ) {
    const userLevel = req.user?.level || 'basic';
    return this.intelligenceService.findAll(query, userLevel);
  }

  @Get('hot')
  async getHotList() {
    return this.intelligenceService.getHotList(5);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Request() req: RequestWithUser) {
    const userId = req.user?.id;
    return this.intelligenceService.findOne(id, userId);
  }

  @Get(':id/collected')
  @UseGuards(JwtAuthGuard)
  async isCollected(@Request() req: RequestWithUser, @Param('id') id: number) {
    const isCollected = await this.intelligenceService.isCollected(
      req.user.id,
      id,
    );
    return { isCollected };
  }

  @Post(':id/collect')
  @UseGuards(JwtAuthGuard)
  async collect(@Param('id') id: number, @Request() req: RequestWithUser) {
    return this.intelligenceService.collect(req.user.id, id);
  }

  @Get('user/collects')
  @UseGuards(JwtAuthGuard)
  async getUserCollects(@Request() req: RequestWithUser) {
    return this.intelligenceService.getUserCollects(req.user.id);
  }

  @Post()
  async create(@Body() dto: CreateIntelligenceDto) {
    return this.intelligenceService.create(dto);
  }
}
