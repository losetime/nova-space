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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreatePushSubscriptionDto,
  UpdatePushSubscriptionDto,
} from './dto/subscription.dto';
import type { PushSubscription } from '../../db/schema';

interface RequestWithUser {
  user: { id: string };
}

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly subscriptionService: PushSubscriptionService) {}

  @Get('subscription')
  async getSubscription(
    @Request() req: RequestWithUser,
  ): Promise<PushSubscription | null> {
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
  async pauseSubscription(
    @Request() req: RequestWithUser,
  ): Promise<PushSubscription> {
    return this.subscriptionService.pause(req.user.id);
  }

  @Post('subscription/resume')
  async resumeSubscription(
    @Request() req: RequestWithUser,
  ): Promise<PushSubscription> {
    return this.subscriptionService.resume(req.user.id);
  }

  @Delete('subscription')
  async cancelSubscription(
    @Request() req: RequestWithUser,
  ): Promise<{ success: boolean }> {
    await this.subscriptionService.cancel(req.user.id);
    return { success: true };
  }
}
