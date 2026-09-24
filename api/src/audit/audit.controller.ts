import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AuditService } from './audit.service'

@UseGuards(JwtAuthGuard)
@Controller('audit-log')
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  list(
    @Query('tablo') tablo?: string,
    @Query('kullaniciId') kullaniciId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.audit.list({
      tablo,
      kullaniciId: kullaniciId ? Number(kullaniciId) : undefined,
      from,
      to,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    })
  }

  @Delete()
  temizle(@Query('gun') gun?: string) {
    const g = Math.max(1, Number(gun) || 90)
    return this.audit.temizle(g)
  }
}
