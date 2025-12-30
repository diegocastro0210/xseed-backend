import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// Mock uuid to handle ESM module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-token'),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    register: jest.fn(),
    publicSignup: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn(),
  };

  const mockRequest = {
    headers: {
      'user-agent': 'test-user-agent',
    },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'admin@example.com',
      password: 'StrongPass1!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as const,
    };

    it('should call authService.register with correct parameters', async () => {
      const expectedResult = {
        user: { id: 'user-123', email: registerDto.email },
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(
        registerDto,
        'admin-id',
        '127.0.0.1',
        mockRequest,
      );

      expect(result).toBe(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto,
        'admin-id',
        '127.0.0.1',
        'test-user-agent',
      );
    });
  });

  describe('publicSignup', () => {
    const signupDto = {
      email: 'newuser@example.com',
      password: 'StrongPass1!',
      firstName: 'New',
      lastName: 'User',
      acceptTerms: true,
    };

    it('should call authService.publicSignup with correct parameters', async () => {
      const expectedResult = {
        message: 'Account created successfully. Please check your email.',
      };
      mockAuthService.publicSignup.mockResolvedValue(expectedResult);

      const result = await controller.publicSignup(
        signupDto,
        '127.0.0.1',
        mockRequest,
      );

      expect(result).toBe(expectedResult);
      expect(mockAuthService.publicSignup).toHaveBeenCalledWith(
        signupDto,
        '127.0.0.1',
        'test-user-agent',
      );
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with token', async () => {
      const verifyDto = { token: 'verification-token' };
      const expectedResult = { message: 'Email verified successfully.' };
      mockAuthService.verifyEmail.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(verifyDto);

      expect(result).toBe(expectedResult);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(
        'verification-token',
      );
    });
  });

  describe('resendVerification', () => {
    it('should call authService.resendVerificationEmail with email', async () => {
      const resendDto = { email: 'test@example.com' };
      const expectedResult = { message: 'Verification link sent.' };
      mockAuthService.resendVerificationEmail.mockResolvedValue(expectedResult);

      const result = await controller.resendVerification(resendDto);

      expect(result).toBe(expectedResult);
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'TestPass1!',
    };

    it('should call authService.login with correct parameters', async () => {
      const expectedResult = {
        user: { id: 'user-123', email: loginDto.email },
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, '127.0.0.1', mockRequest);

      expect(result).toBe(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto,
        '127.0.0.1',
        'test-user-agent',
      );
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken', async () => {
      const refreshDto = { refreshToken: 'valid-refresh-token' };
      const expectedResult = { accessToken: 'new-access-token' };
      mockAuthService.refreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refreshToken(refreshDto);

      expect(result).toBe(expectedResult);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshDto);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with correct parameters', async () => {
      const expectedResult = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(
        'user-123',
        '127.0.0.1',
        mockRequest,
      );

      expect(result).toBe(expectedResult);
      expect(mockAuthService.logout).toHaveBeenCalledWith(
        'user-123',
        '127.0.0.1',
        'test-user-agent',
      );
    });
  });

  describe('getMe', () => {
    it('should call authService.getMe with userId', async () => {
      const expectedResult = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CLIENT',
      };
      mockAuthService.getMe.mockResolvedValue(expectedResult);

      const result = await controller.getMe('user-123');

      expect(result).toBe(expectedResult);
      expect(mockAuthService.getMe).toHaveBeenCalledWith('user-123');
    });
  });
});
