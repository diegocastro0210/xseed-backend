import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  sendVerificationEmail(email: string, token: string, firstName: string): void {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const nodeEnv = this.configService.get<string>('app.nodeEnv');

    if (nodeEnv !== 'production') {
      // In development, log the verification URL instead of sending email
      this.logger.log(
        `[DEV] Verification email for ${email} (${firstName}): ${verificationUrl}`,
      );
      this.logger.log(`[DEV] Token: ${token}`);
      return;
    }

    // TODO: Implement actual email sending (AWS SES, SendGrid, etc.)
    // For now, just log in production too until email provider is configured
    this.logger.warn(
      `[PROD] Email sending not configured. Verification URL for ${email}: ${verificationUrl}`,
    );
  }

  sendPasswordResetEmail(
    email: string,
    token: string,
    firstName: string,
  ): void {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const nodeEnv = this.configService.get<string>('app.nodeEnv');

    if (nodeEnv !== 'production') {
      this.logger.log(
        `[DEV] Password reset email for ${email} (${firstName}): ${resetUrl}`,
      );
      return;
    }

    // TODO: Implement actual email sending
    this.logger.warn(
      `[PROD] Email sending not configured. Reset URL for ${email}: ${resetUrl}`,
    );
  }
}
