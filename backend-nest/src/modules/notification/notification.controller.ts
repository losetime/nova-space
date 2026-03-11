import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationQueryDto } from './dto/notification.dto';

interface RequestWithUser {
  user: { id: string };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // 获取通知列表
  @Get()
  async findAll(@Request() req: RequestWithUser, @Query() query: NotificationQueryDto) {
    return this.notificationService.findByUser(req.user.id, query);
  }

  // 获取未读数量
  @Get('unread-count')
  async getUnreadCount(@Request() req: RequestWithUser) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  // 标记单条已读
  @Put(':id/read')
  async markAsRead(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const success = await this.notificationService.markAsRead(req.user.id, id);
    return { success };
  }

  // 标记全部已读
  @Put('read-all')
  async markAllAsRead(@Request() req: RequestWithUser) {
    const count = await this.notificationService.markAllAsRead(req.user.id);
    return { success: true, count };
  }

  // 删除单条通知
  @Delete(':id')
  async delete(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const success = await this.notificationService.delete(req.user.id, id);
    return { success };
  }

  // 清空已读通知
  @Delete('read')
  async clearRead(@Request() req: RequestWithUser) {
    const count = await this.notificationService.clearRead(req.user.id);
    return { success: true, count };
  }
}