import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIadeTalepDto, UpdateIadeTalepDto } from './dto/create-iade-talep.dto'

@Injectable()
export class IadeTalepService {
  constructor(private prisma: PrismaService) {}

  async findAll(durum?: string) {
    const where: any = {}
    if (durum) {
      const durumlar = durum.split(',').map((d) => d.trim())
      where.durum = { in: durumlar }
    }
    return this.prisma.iadeTalep.findMany({
      where,
      orderBy: { olusturmaTarihi: 'desc' },
    })
  }

  async findOne(id: number) {
    const talep = await this.prisma.iadeTalep.findUnique({ where: { id } })
    if (!talep) throw new NotFoundException('İade talebi bulunamadı')
    return talep
  }

  async create(dto: CreateIadeTalepDto) {
    return this.prisma.iadeTalep.create({
      data: {
        siparisNo: dto.siparisNo,
        modelKod: dto.modelKod,
        modelAd: dto.modelAd ?? null,
        renkAd: dto.renkAd,
        beden: dto.beden,
        kumasAd: dto.kumasAd ?? null,
        kumasRenk: dto.kumasRenk ?? null,
        kalanMT: dto.kalanMT,
        aciklama: dto.aciklama ?? null,
      },
    })
  }

  async update(id: number, dto: UpdateIadeTalepDto) {
    await this.findOne(id)
    return this.prisma.iadeTalep.update({
      where: { id },
      data: {
        siparisNo: dto.siparisNo,
        modelKod: dto.modelKod,
        modelAd: dto.modelAd ?? null,
        renkAd: dto.renkAd,
        beden: dto.beden,
        kumasAd: dto.kumasAd ?? null,
        kumasRenk: dto.kumasRenk ?? null,
        kalanMT: dto.kalanMT,
        aciklama: dto.aciklama ?? null,
      },
    })
  }

  async remove(id: number) {
    const talep = await this.findOne(id)
    if (talep.durum === 'IRSALIYE_OLUSTURULDU') {
      throw new BadRequestException('İrsaliye oluşturulmuş talep silinemez')
    }
    return this.prisma.iadeTalep.delete({ where: { id } })
  }

  async iptal(id: number) {
    await this.findOne(id)
    return this.prisma.iadeTalep.update({
      where: { id },
      data: { durum: 'IPTAL' },
    })
  }

  async irsaliyeOlustur(id: number) {
    const talep = await this.findOne(id)
    if (talep.durum !== 'BEKLEMEDE') {
      throw new BadRequestException('Sadece beklemedeki talepler işlenebilir')
    }

    // 40 - Üretimden İade irsaliyesi oluştur
    const lastIrsaliye = await this.prisma.irsaliye.findFirst({
      where: { irsaliyeTipi: '40' },
      orderBy: { irsaliyeNo: 'desc' },
      select: { irsaliyeNo: true },
    })

    let nextNo = 1
    if (lastIrsaliye?.irsaliyeNo) {
      const parsed = parseInt(lastIrsaliye.irsaliyeNo, 10)
      if (!isNaN(parsed)) nextNo = parsed + 1
    }
    const irsaliyeNo = nextNo.toString().padStart(8, '0')

    const irsaliye = await this.prisma.$transaction(async (tx) => {
      const irs = await tx.irsaliye.create({
        data: {
          irsaliyeNo,
          irsaliyeTipi: '40',
          irsaliyeTarihi: new Date(),
          aciklama: `İade Talebi - ${talep.siparisNo} / ${talep.modelKod} / ${talep.renkAd} / ${talep.beden}`,
          tamamlandi: false,
          onaylandi: false,
        },
      })

      // Kalem olarak iade edilen kumaşı ekle (hizmet kalemi olarak)
      if (talep.kumasAd && talep.kalanMT > 0) {
        await tx.irsaliyeKalem.create({
          data: {
            irsaliyeId: irs.id,
            tip: 'HIZMET',
            aciklama: `${talep.kumasAd} - ${talep.kumasRenk || ''} iade (${talep.kalanMT} MT)`,
            miktar: talep.kalanMT,
            olcuBirimi: 'MT',
          },
        })
      }

      // Talebin durumunu güncelle
      await tx.iadeTalep.update({
        where: { id },
        data: {
          durum: 'IRSALIYE_OLUSTURULDU',
          islenmeTarihi: new Date(),
          irsaliyeId: irs.id,
        },
      })

      return tx.irsaliye.findUnique({
        where: { id: irs.id },
        include: { kalemler: true },
      })
    })

    return irsaliye
  }
}
