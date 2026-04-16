import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { ConsumePointsDto, AdminGrantPointsDto } from './dto';
import type { RequestWithUser } from '../../common/interfaces';

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('stats')
  async getStats(@Request() req: RequestWithUser) {
    const stats = await this.pointsService.getPointsStats(req.user.id);
    return { code: 0, data: stats };
  }

  @Get('history')
  async getHistory(
    @Request() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.pointsService.getPointsHistory(
      req.user.id,
      +page,
      +limit,
    );
    return { code: 0, data: result };
  }

  @Post('daily-checkin')
  async dailyCheckin(@Request() req: RequestWithUser) {
    const record = await this.pointsService.dailyLoginReward(req.user.id);
    if (!record) {
      return { code: 400, message: '今日已签到' };
    }
    return {
      code: 0,
      data: record,
      message: `签到成功，获得 ${record.points} 积分`,
    };
  }

  @Post('exchange-membership')
  async exchangeMembership(
    @Request() req: RequestWithUser,
    @Body('planCode') planCode: string,
  ) {
    const result = await this.pointsService.exchangeMembership(
      req.user.id,
      planCode,
    );
    return {
      code: 0,
      data: result,
      message: `积分兑换成功，已获得${result.newLevel}会员`,
    };
  }

  @Post('consume')
  async consume(
    @Request() req: RequestWithUser,
    @Body() dto: ConsumePointsDto,
  ) {
    const record = await this.pointsService.consumePoints(req.user.id, dto);
    return {
      code: 0,
      data: record,
      message: '积分消费成功',
    };
  }

  @Post('admin/grant')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async adminGrant(@Body() dto: AdminGrantPointsDto) {
    const record = await this.pointsService.adminGrant(dto);
    return {
      code: 0,
      data: record,
      message: '积分发放成功',
    };
  }
}
