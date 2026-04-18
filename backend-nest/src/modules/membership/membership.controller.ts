import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

@Controller('membership')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  /**
   * 获取当前用户的会员权限列表
   * GET /api/membership/permissions
   */
  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  async getPermissions(@Req() req: RequestWithUser) {
    const permissions = await this.membershipService.getUserPermissions(
      req.user.id,
    );
    return {
      code: 0,
      data: permissions,
      message: 'success',
    };
  }
}
