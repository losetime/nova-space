import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PushSubscriptionService } from './push-subscription.service';
import { PushSchedulerService } from './push-scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePushSubscriptionDto, UpdatePushSubscriptionDto } from './dto/subscription.dto';
import { PushSubscription } from '../../common/entities/push-subscription.entity';

interface RequestWithUser {
  user: { id: string };
}

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(
    private readonly subscriptionService: PushSubscriptionService,
    private readonly schedulerService: PushSchedulerService,
  ) {}

  @Get('subscription')
  async getSubscription(@Request() req: RequestWithUser): Promise<PushSubscription | null> {
    return this.subscriptionService.findByUserId(req.user.id);
  }

  @Post('subscription')
  async createSubscription(
    @Request() req: RequestWithUser,
    @Body() dto: CreatePushSubscriptionDto,
  ): Promise<PushSubscription> {
    return this.subscriptionService.create(req.user.id, dto);
  }

  @Put('subscription')
  async updateSubscription(
    @Request() req: RequestWithUser,
    @Body() dto: UpdatePushSubscriptionDto,
  ): Promise<PushSubscription> {
    return this.subscriptionService.update(req.user.id, dto);
  }

  @Post('subscription/pause')
  async pauseSubscription(@Request() req: RequestWithUser): Promise<PushSubscription> {
    return this.subscriptionService.pause(req.user.id);
  }

  @Post('subscription/resume')
  async resumeSubscription(@Request() req: RequestWithUser): Promise<PushSubscription> {
    return this.subscriptionService.resume(req.user.id);
  }

  @Delete('subscription')
  async cancelSubscription(@Request() req: RequestWithUser): Promise<{ success: boolean }> {
    await this.subscriptionService.cancel(req.user.id);
    return { success: true };
  }

  @Post('test')
  async testPush(@Request() req: RequestWithUser): Promise<{ success: boolean; message: string }> {
    const subscription = await this.subscriptionService.findByUserId(req.user.id);
    if (!subscription) {
      return { success: false, message: '请先订阅推送服务' };
    }

    const sent = await this.schedulerService.triggerManualPush(req.user.id);
    if (sent) {
      return { success: true, message: '测试推送已发送，请检查邮箱' };
    }
    return { success: false, message: '推送发送失败，请稍后重试' };
  }
}