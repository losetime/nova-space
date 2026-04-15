import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto } from '../user/dto';
import type { RequestWithUser } from '../../common/interfaces';
import type { schema } from '../../db';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private omitPassword(user: schema.User): Omit<schema.User, 'password'> {
    const { password: _, ...rest } = user;
    return rest;
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { user, token } = await this.authService.register(registerDto);
    return {
      code: 0,
      data: {
        user: this.omitPassword(user),
        token,
      },
      message: '注册成功',
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { user, token } = await this.authService.login(loginDto);
    return {
      code: 0,
      data: {
        user: this.omitPassword(user),
        token,
      },
      message: '登录成功',
    };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Request() req: RequestWithUser) {
    const token = await this.authService.refreshToken(req.user.id);
    return {
      code: 0,
      data: { token },
      message: 'Token 刷新成功',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.authService.validateUserById(req.user.id);
    if (!user) {
      return {
        code: -1,
        data: null,
        message: '用户不存在',
      };
    }
    return {
      code: 0,
      data: this.omitPassword(user),
    };
  }
}
