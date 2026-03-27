import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MilestoneService } from './milestone.service';
import { CreateMilestoneDto, UpdateMilestoneDto, QueryMilestoneDto } from './dto/milestone.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('milestones')
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  // 公开接口 - 获取里程碑列表
  @Get()
  async findAll(@Query() query: QueryMilestoneDto) {
    return this.milestoneService.findAll(query);
  }

  // 公开接口 - 按年代获取时间线
  @Get('timeline')
  async getTimeline() {
    return this.milestoneService.getTimelineByDecade();
  }

  // 公开接口 - 获取重要里程碑
  @Get('featured')
  async getFeatured(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.milestoneService.getFeatured(limit);
  }

  // 公开接口 - 获取分类统计
  @Get('categories')
  async getCategories() {
    return this.milestoneService.getCategories();
  }

  // 公开接口 - 获取里程碑详情
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.milestoneService.findOne(id);
  }

  // 管理员接口 - 创建里程碑
  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'super_admin')
  async create(@Body() dto: CreateMilestoneDto) {
    return this.milestoneService.create(dto);
  }

  // 管理员接口 - 更新里程碑
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'super_admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMilestoneDto) {
    return this.milestoneService.update(id, dto);
  }

  // 管理员接口 - 删除里程碑
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'super_admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.milestoneService.remove(id);
  }
}
