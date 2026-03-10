import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { UpdateUserDto, ChangePasswordDto, AdminUpdateUserDto } from './dto';
import type { RequestWithUser } from '../../common/interfaces';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 获取当前用户信息
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req: RequestWithUser) {
    const user = await this.userService.findByIdWithSubscription(req.user.id);
    if (!user) {
      return { code: 404, message: '用户不存在' };
    }
    const { password, ...result } = user as any;
    return { code: 0, data: result };
  }

  // 更新当前用户信息
  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateCurrentUser(@Request() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(req.user.id, updateUserDto);
    const { password, ...result } = user as any;
    return { code: 0, data: result, message: '更新成功' };
  }

  // 修改密码
  @Put('me/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: RequestWithUser, @Body() changePasswordDto: ChangePasswordDto) {
    await this.userService.changePassword(req.user.id, changePasswordDto);
    return { code: 0, message: '密码修改成功' };
  }

  // 管理员：获取用户列表
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const result = await this.userService.findAll(+page, +limit);
    return { code: 0, data: result };
  }

  // 管理员：更新用户
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async adminUpdate(@Param('id') id: string, @Body() adminUpdateDto: AdminUpdateUserDto) {
    const user = await this.userService.adminUpdate(id, adminUpdateDto);
    const { password, ...result } = user as any;
    return { code: 0, data: result, message: '更新成功' };
  }

  // 管理员：删除用户
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
    return { code: 0, message: '删除成功' };
  }
}