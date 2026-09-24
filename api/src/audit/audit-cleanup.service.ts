import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name)

  constructor(private prisma: PrismaService) {}

  // Her gece 03:00 — parametredeki gün sayısından eski logları sil (0 = silme)
  @Cron('0 3 * * *')
  async geceTemizligi() {
    try {
      const p = await this.prisma.parametre.findUnique({
        where: { grup_anahtar: { grup: 'genel', anahtar: 'logSaklamaGun' } },
      })
      const gun = p ? Number(p.deger) : 90
      if (!gun || gun <= 0) return
      const sinir = new Date()
      sinir.setDate(sinir.getDate() - gun)
      const res = await this.prisma.auditLog.deleteMany({
        where: { tarih: { lt: sinir } },
      })
      if (res.count > 0) this.logger.log(`Audit temizliği: ${res.count} kayıt silindi (${gun} günden eski)`)
    } catch (e) {
      this.logger.error(`Audit temizliği hatası: ${e}`)
    }
  }
}
