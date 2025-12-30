import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { AuditService } from '../../common/services/audit.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  PublicSignupDto,
} from './dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async register(
    registerDto: RegisterDto,
    adminId?: string,
    ipAddress: string = 'unknown',
    userAgent?: string,
  ) {
    // Validate clientId if provided
    if (registerDto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: registerDto.clientId },
      });
      if (!client) {
        throw new BadRequestException('Invalid client ID');
      }
    }

    // Validate that CLIENT role requires clientId
    if (registerDto.role === 'CLIENT' && !registerDto.clientId) {
      throw new BadRequestException(
        'Client ID is required for CLIENT role users',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      await this.auditService.log({
        action: 'REGISTER',
        email: registerDto.email,
        userId: adminId,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'EMAIL_EXISTS',
      });
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role,
        clientId: registerDto.clientId,
        emailVerified: true, // Admin-created users are auto-verified
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        clientId: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      action: 'REGISTER',
      email: user.email,
      userId: user.id,
      ipAddress,
      userAgent,
      success: true,
      metadata: { createdBy: adminId, role: registerDto.role },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async publicSignup(
    signupDto: PublicSignupDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    // Validate terms acceptance
    if (!signupDto.acceptTerms) {
      await this.auditService.log({
        action: 'SIGNUP',
        email: signupDto.email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'TERMS_NOT_ACCEPTED',
      });
      throw new BadRequestException('You must accept the terms of service');
    }

    // Check existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      await this.auditService.log({
        action: 'SIGNUP',
        email: signupDto.email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'EMAIL_EXISTS',
      });
      // Use generic message to prevent user enumeration
      throw new ConflictException('Unable to create account with this email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(signupDto.password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    // Create user with CLIENT role (always)
    const user = await this.prisma.user.create({
      data: {
        email: signupDto.email,
        passwordHash,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        role: 'CLIENT',
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        termsAcceptedAt: new Date(),
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.firstName,
    );

    await this.auditService.log({
      action: 'SIGNUP',
      email: user.email,
      userId: user.id,
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      message:
        'Account created successfully. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.emailVerificationExpires &&
      new Date() > user.emailVerificationExpires
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new one.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    await this.auditService.log({
      action: 'VERIFY_EMAIL',
      email: user.email,
      userId: user.id,
      ipAddress: 'unknown',
      success: true,
    });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent user enumeration
    if (!user) {
      return {
        message: 'If your email exists, a verification link has been sent.',
      };
    }

    if (user.emailVerified) {
      return { message: 'Your email is already verified. You can log in.' };
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.firstName,
    );

    await this.auditService.log({
      action: 'RESEND_VERIFICATION',
      email: user.email,
      userId: user.id,
      ipAddress: 'unknown',
      success: true,
    });

    return {
      message: 'If your email exists, a verification link has been sent.',
    };
  }

  async login(loginDto: LoginDto, ipAddress: string = 'unknown', userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    // Log attempt for non-existent users
    if (!user) {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        email: loginDto.email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'USER_NOT_FOUND',
      });
      // Use same error message to prevent user enumeration
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check lockout
    if (user.lockoutUntil && new Date() < user.lockoutUntil) {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        email: loginDto.email,
        userId: user.id,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'ACCOUNT_LOCKED',
      });
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account is locked. Try again in ${remainingMinutes} minutes.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const updateData: {
        failedLoginAttempts: number;
        lockoutUntil?: Date;
      } = {
        failedLoginAttempts: newFailedAttempts,
      };

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        updateData.lockoutUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      await this.auditService.log({
        action: 'LOGIN_FAILED',
        email: loginDto.email,
        userId: user.id,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'INVALID_PASSWORD',
        metadata: { failedAttempts: newFailedAttempts },
      });

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        throw new UnauthorizedException(
          `Account locked due to too many failed attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // Check email verification for CLIENT role users (from public signup)
    if (!user.emailVerified && user.role === 'CLIENT') {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        email: loginDto.email,
        userId: user.id,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'EMAIL_NOT_VERIFIED',
      });
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    // Success - reset failed attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    await this.auditService.log({
      action: 'LOGIN_SUCCESS',
      email: loginDto.email,
      userId: user.id,
      ipAddress,
      userAgent,
      success: true,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clientId: user.clientId,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      },
      {
        secret: this.configService.get<string>('jwt.secret')!,
        expiresIn: 900, // 15 minutes
      },
    );

    return { accessToken };
  }

  async logout(userId: string, ipAddress: string = 'unknown', userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    if (user) {
      await this.auditService.log({
        action: 'LOGOUT',
        email: user.email,
        userId,
        ipAddress,
        userAgent,
        success: true,
      });
    }

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        clientId: true,
        emailVerified: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret')!,
      expiresIn: 900, // 15 minutes
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
