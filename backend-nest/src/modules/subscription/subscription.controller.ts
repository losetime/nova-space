import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';
import type { RequestWithUser } from '../../common/interfaces';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async getPlans() {
    const result = await this.subscriptionService.getPlans();
    return { code: 0, data: result };
  }

  @Get('status')
  async getMembershipStatus(@Request() req: RequestWithUser) {
    const status = await this.subscriptionService.getMembershipStatus(req.user.id);
    return { code: 0, data: status };
  }

  @Get('current')
  async getCurrentSubscription(@Request() req: RequestWithUser) {
    const subscription = await this.subscriptionService.getCurrentSubscription(
      req.user.id,
    );
    return {
      code: 0,
      data: subscription,
    };
  }

  @Get('history')
  async getHistory(
    @Request() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const result = await this.subscriptionService.getSubscriptionHistory(
      req.user.id,
      +page,
      +limit,
    );
    return { code: 0, data: result };
  }

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() createDto: CreateSubscriptionDto,
  ) {
    const subscription = await this.subscriptionService.create(
      req.user.id,
      createDto,
    );
    return {
      code: 0,
      data: subscription,
      message: '订阅成功',
    };
  }

  @Post('renew')
  async renew(
    @Request() req: RequestWithUser,
    @Body() createDto: CreateSubscriptionDto,
  ) {
    const subscription = await this.subscriptionService.renew(
      req.user.id,
      createDto,
    );
    return {
      code: 0,
      data: subscription,
      message: '续费成功',
    };
  }

  @Put('cancel')
  async cancel(
    @Request() req: RequestWithUser,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    const subscription = await this.subscriptionService.cancel(
      req.user.id,
      updateDto.cancelReason,
    );
    return {
      code: 0,
      data: subscription,
      message: '已取消自动续费',
    };
  }
}
