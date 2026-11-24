import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { MuhasebeEntegrasyonTanimiDto } from './dto/upsert-muhasebe-entegrasyon.dto'

@Injectable()
export class MuhasebeEntegrasyonService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.muhasebeEntegrasyonTanimi.findMany({
      include: {
        depo: { select: { id: true, kod: true, ad: true } },
        fasonTipi: { select: { id: true, ad: true } },
        muhasebeHesap: { select: { id: true, kod: true, ad: true } },
      },
      orderBy: [{ hesapTipi: 'asc' }, { sira: 'asc' }, { id: 'asc' }],
    })
  }

  async replaceAll(items: MuhasebeEntegrasyonTanimiDto[]) {
    const data = items.map((i, idx) => this.normalize(i, idx))
    return this.prisma.$transaction(async (tx) => {
      await tx.muhasebeEntegrasyonTanimi.deleteMany({})
      if (data.length) await tx.muhasebeEntegrasyonTanimi.createMany({ data })
      return tx.muhasebeEntegrasyonTanimi.findMany({
        include: {
          depo: { select: { id: true, kod: true, ad: true } },
          fasonTipi: { select: { id: true, ad: true } },
          muhasebeHesap: { select: { id: true, kod: true, ad: true } },
        },
        orderBy: [{ hesapTipi: 'asc' }, { sira: 'asc' }, { id: 'asc' }],
      })
    })
  }

  private normalize(i: MuhasebeEntegrasyonTanimiDto, idx: number) {
    const hesapTipi = (i.hesapTipi ?? '').trim()
    const hesapKodu = (i.hesapKodu ?? '').trim()
    if (!hesapTipi) throw new BadRequestException('Hesap tipi zorunludur')
    if (!hesapKodu) throw new BadRequestException('Hesap kodu zorunludur')
    return {
      hesapTipi,
      faturaTipi: (i.faturaTipi ?? '').trim() || null,
      depoId: i.depoId ?? null,
      fasonTipiId: i.fasonTipiId ?? null,
      kdvOrani: i.kdvOrani == null || i.kdvOrani === ('' as any) ? null : new Prisma.Decimal(Number(i.kdvOrani)),
      muhasebeHesapId: i.muhasebeHesapId ?? null,
      hesapKodu,
      sira: Number(i.sira ?? idx),
      aktif: i.aktif !== false,
    }
  }
}
