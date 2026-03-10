import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto } from '../user/dto';
import type { RequestWithUser } from '../../common/interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { user, token } = await this.authService.register(registerDto);
    const { password, ...userWithoutPassword } = user as any;
    return {
      code: 0,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: '注册成功',
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { user, token } = await this.authService.login(loginDto);
    const { password, ...userWithoutPassword } = user as any;
    return {
      code: 0,
      data: {
        user: userWithoutPassword,
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
    const { password, ...result } = user as any;
    return {
      code: 0,
      data: result,
    };
  }
}