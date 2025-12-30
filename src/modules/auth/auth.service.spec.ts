import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { AuditService } from '../../common/services/audit.service';

jest.mock('bcrypt');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-token'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let emailService: jest.Mocked<EmailService>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    role: 'CLIENT' as const,
    clientId: null,
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    failedLoginAttempts: 0,
    lockoutUntil: null,
    termsAcceptedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.refreshExpiresIn': '7d',
        'app.frontendUrl': 'http://localhost:3000',
        'app.nodeEnv': 'test',
      };
      return config[key];
    }),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    emailService = module.get(EmailService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publicSignup', () => {
    const signupDto = {
      email: 'newuser@example.com',
      password: 'StrongPass1!',
      firstName: 'New',
      lastName: 'User',
      acceptTerms: true,
    };

    it('should create a new unverified user and send verification email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: signupDto.email,
        emailVerified: false,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.publicSignup(
        signupDto,
        '127.0.0.1',
        'test-agent',
      );

      expect(result.message).toContain('Account created successfully');
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: signupDto.email,
            role: 'CLIENT',
            emailVerified: false,
          }),
        }),
      );
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SIGNUP',
          success: true,
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.publicSignup(signupDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(ConflictException);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SIGNUP',
          success: false,
          failureReason: 'EMAIL_EXISTS',
        }),
      );
    });

    it('should throw BadRequestException if terms not accepted', async () => {
      const dtoWithoutTerms = { ...signupDto, acceptTerms: false };

      await expect(
        service.publicSignup(dtoWithoutTerms, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(BadRequestException);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SIGNUP',
          success: false,
          failureReason: 'TERMS_NOT_ACCEPTED',
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const userWithToken = {
        ...mockUser,
        emailVerified: false,
        emailVerificationToken: 'valid-token',
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithToken);
      mockPrismaService.user.update.mockResolvedValue({
        ...userWithToken,
        emailVerified: true,
      });

      const result = await service.verifyEmail('valid-token');

      expect(result.message).toContain('Email verified successfully');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emailVerified: true,
            emailVerificationToken: null,
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        emailVerificationToken: 'expired-token',
        emailVerificationExpires: new Date(Date.now() - 1000), // expired
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithExpiredToken);

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email for unverified user', async () => {
      const unverifiedUser = {
        ...mockUser,
        emailVerified: false,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
      mockPrismaService.user.update.mockResolvedValue(unverifiedUser);

      const result = await service.resendVerificationEmail('test@example.com');

      expect(result.message).toContain('verification link has been sent');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should return success message even if user not found (prevent enumeration)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.resendVerificationEmail(
        'nonexistent@example.com',
      );

      expect(result.message).toContain('If your email exists');
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should inform if email is already verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.resendVerificationEmail('test@example.com');

      expect(result.message).toContain('already verified');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'TestPass1!',
    };

    it('should login successfully with valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto, '127.0.0.1', 'test-agent');

      expect(result.user.email).toBe(mockUser.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          success: true,
        }),
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login(loginDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_FAILED',
          failureReason: 'USER_NOT_FOUND',
        }),
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login(loginDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_FAILED',
          failureReason: 'INVALID_PASSWORD',
        }),
      );
    });

    it('should throw UnauthorizedException for locked account', async () => {
      const lockedUser = {
        ...mockUser,
        lockoutUntil: new Date(Date.now() + 15 * 60 * 1000), // locked for 15 more minutes
      };
      mockPrismaService.user.findUnique.mockResolvedValue(lockedUser);

      await expect(
        service.login(loginDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_FAILED',
          failureReason: 'ACCOUNT_LOCKED',
        }),
      );
    });

    it('should throw UnauthorizedException for unverified CLIENT user', async () => {
      const unverifiedUser = {
        ...mockUser,
        emailVerified: false,
        role: 'CLIENT' as const,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
      mockPrismaService.user.update.mockResolvedValue(unverifiedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login(loginDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_FAILED',
          failureReason: 'EMAIL_NOT_VERIFIED',
        }),
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      const userWith4Failures = {
        ...mockUser,
        failedLoginAttempts: 4,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWith4Failures);
      mockPrismaService.user.update.mockResolvedValue(userWith4Failures);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login(loginDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(/Account locked/);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 5,
            lockoutUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('should reset failed attempts on successful login', async () => {
      const userWithFailures = {
        ...mockUser,
        failedLoginAttempts: 3,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithFailures);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login(loginDto, '127.0.0.1', 'test-agent');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 0,
            lockoutUntil: null,
          }),
        }),
      );
    });
  });

  describe('register (admin)', () => {
    const registerDto = {
      email: 'newadmin@example.com',
      password: 'StrongPass1!',
      firstName: 'New',
      lastName: 'Admin',
      role: 'ADMIN' as const,
    };

    it('should create user when called by admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        role: 'ADMIN',
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(
        registerDto,
        'admin-user-id',
        '127.0.0.1',
        'test-agent',
      );

      expect(result.user.email).toBe(registerDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emailVerified: true, // Admin-created users are auto-verified
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid clientId', async () => {
      const dtoWithClientId = { ...registerDto, clientId: 'invalid-client-id' };
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(
        service.register(dtoWithClientId, 'admin-user-id', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if CLIENT role without clientId', async () => {
      const clientDto = { ...registerDto, role: 'CLIENT' as const };
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.register(clientDto, 'admin-user-id', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register(registerDto, 'admin-user-id', '127.0.0.1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout(
        'user-123',
        '127.0.0.1',
        'test-agent',
      );

      expect(result.message).toBe('Logged out successfully');
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGOUT',
          success: true,
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new access token for valid refresh token', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'valid-refresh-token',
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(storedToken);

      const result = await service.refreshToken({
        refreshToken: 'valid-refresh-token',
      });

      expect(result.accessToken).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const expiredToken = {
        id: 'token-123',
        token: 'expired-token',
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() - 1000), // expired
        createdAt: new Date(),
      };
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);
      mockPrismaService.refreshToken.delete.mockResolvedValue(expiredToken);

      await expect(
        service.refreshToken({ refreshToken: 'expired-token' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user data', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe('user-123');

      expect(result.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('nonexistent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
