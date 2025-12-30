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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register new user (Admin only)',
    description: 'Create a new user with any role. Requires admin authentication.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        user: {
          id: 'clxyz123456',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'RECRUITER',
          clientId: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: '3f271f36-eb2e-4723-9649-1f17519b8480',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or CLIENT role without clientId' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Admin access required' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
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

  @ApiOperation({
    summary: 'Public signup',
    description: 'Self-registration for CLIENT users. Requires email verification before login. Rate limited to 5 requests per minute.',
  })
  @ApiBody({ type: PublicSignupDto })
  @ApiResponse({
    status: 201,
    description: 'Account created, verification email sent',
    schema: {
      example: {
        message: 'Account created successfully. Please check your email to verify your account.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or terms not accepted' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Public()
  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async publicSignup(
    @Body() signupDto: PublicSignupDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.authService.publicSignup(signupDto, ipAddress, userAgent);
  }

  @ApiOperation({
    summary: 'Verify email',
    description: 'Verify user email address using the token sent via email. Token expires in 24 hours.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      example: {
        message: 'Email verified successfully. You can now log in.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyDto.token);
  }

  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Resend email verification link. Rate limited to 3 requests per 5 minutes.',
  })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent (if account exists)',
    schema: {
      example: {
        message: 'If your email exists, a verification link has been sent.',
      },
    },
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Public()
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendDto.email);
  }

  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate user and receive JWT tokens. Account locks after 5 failed attempts for 15 minutes.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        user: {
          id: 'clxyz123456',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CLIENT',
          clientId: null,
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: '3f271f36-eb2e-4723-9649-1f17519b8480',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials, account locked, or email not verified' })
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

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'New access token generated',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @ApiOperation({
    summary: 'Logout',
    description: 'Invalidate all refresh tokens for the current user.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({
    summary: 'Get current user',
    description: 'Get the currently authenticated user profile.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    schema: {
      example: {
        id: 'clxyz123456',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
        clientId: 'clclient123',
        emailVerified: true,
        client: {
          id: 'clclient123',
          name: 'Acme Corp',
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
