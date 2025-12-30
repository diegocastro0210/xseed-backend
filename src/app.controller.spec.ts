import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    appController = app.get<AppController>(AppController);
    prismaService = app.get(PrismaService);
  });

  describe('health', () => {
    it('should return healthy status when database is connected', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await appController.getHealth();

      expect(result.status).toBe('healthy');
      expect(result.checks.api).toBe('ok');
      expect(result.checks.database).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });

    it('should return unhealthy status when database is not connected', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await appController.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.api).toBe('ok');
      expect(result.checks.database).toBe('error');
    });
  });
});
