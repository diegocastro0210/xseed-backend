import { Global, Module } from '@nestjs/common';
import { EmailService, AuditService } from './services';

@Global()
@Module({
  providers: [EmailService, AuditService],
  exports: [EmailService, AuditService],
})
export class CommonModule {}
