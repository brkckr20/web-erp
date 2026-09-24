import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'
import { AuditInterceptor } from './audit.interceptor'
import { AuditCleanupService } from './audit-cleanup.service'

@Module({
  providers: [AuditService, AuditCleanupService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
