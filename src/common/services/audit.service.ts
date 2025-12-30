import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  action: string;
  email: string;
  userId?: string | null;
  ipAddress: string;
  userAgent?: string | null;
  success: boolean;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
}

export type AuditAction =
  | 'REGISTER'
  | 'SIGNUP'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'VERIFY_EMAIL'
  | 'RESEND_VERIFICATION'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          email: entry.email,
          userId: entry.userId ?? null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent ?? null,
          success: entry.success,
          failureReason: entry.failureReason ?? null,
          metadata: entry.metadata
            ? (entry.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
    } catch (error) {
      // Log but don't throw - audit logging should never break main flow
      this.logger.error('Failed to write audit log', error);
    }
  }

  async getRecentLoginAttempts(
    email: string,
    sinceMinutes: number = 15,
  ): Promise<number> {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000);

    return this.prisma.auditLog.count({
      where: {
        email,
        action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] },
        createdAt: { gte: since },
      },
    });
  }

  async getFailedLoginAttempts(
    email: string,
    sinceMinutes: number = 15,
  ): Promise<number> {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000);

    return this.prisma.auditLog.count({
      where: {
        email,
        action: 'LOGIN_FAILED',
        createdAt: { gte: since },
      },
    });
  }
}
