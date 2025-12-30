import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  PublicSignupDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto';
import { Public, CurrentUser, Roles } from '../../common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Admin-only endpoint to create users with any role
  @Roles(Role.ADMIN)
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @CurrentUser('id') adminId: string,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.authService.register(registerDto, adminId, ipAddress, userAgent);
  }

  // Public signup - CLIENT role only, stricter rate limiting
  @Public()
  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async publicSignup(
    @Body() signupDto: PublicSignupDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.authService.publicSignup(signupDto, ipAddress, userAgent);
  }

  // Verify email with token
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyDto.token);
  }

  // Resend verification email - rate limited
  @Public()
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 per 5 minutes
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendDto.email);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.authService.logout(userId, ipAddress, userAgent);
  }

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
