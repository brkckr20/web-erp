import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDovizDto } from './dto/create-doviz.dto'
import { UpdateDovizDto } from './dto/update-doviz.dto'

@Injectable()
export class DovizService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.doviz.findMany({ orderBy: { sira: 'asc' } })
  }

  async findOne(kod: string) {
    const doviz = await this.prisma.doviz.findUnique({ where: { kod } })
    if (!doviz) throw new NotFoundException('Döviz bulunamadı')
    return doviz
  }

  create(dto: CreateDovizDto) {
    return this.prisma.doviz.create({ data: dto })
  }

  async update(kod: string, dto: UpdateDovizDto) {
    await this.findOne(kod)
    return this.prisma.doviz.update({ where: { kod }, data: dto })
  }

  async remove(kod: string) {
    await this.findOne(kod)
    return this.prisma.doviz.delete({ where: { kod } })
  }

  async findLatestKurlar() {
    const dovizler = await this.prisma.doviz.findMany({
      where: { kullanimda: true },
      orderBy: { sira: 'asc' },
    })

    const results: { dovizKodu: string; dovizAd: string; alisKuru: number | null; satisKuru: number | null; efektifAlis: number | null; efektifSatis: number | null; tarih: Date | null }[] = []
    for (const d of dovizler) {
      const sonKur = await this.prisma.dovizKuru.findFirst({
        where: { dovizKodu: d.kod },
        orderBy: { tarih: 'desc' },
      })
      results.push({
        dovizKodu: d.kod,
        dovizAd: d.ad,
        alisKuru: sonKur ? Number(sonKur.alisKuru) : null,
        satisKuru: sonKur ? Number(sonKur.satisKuru) : null,
        efektifAlis: sonKur?.efektifAlis != null ? Number(sonKur.efektifAlis) : null,
        efektifSatis: sonKur?.efektifSatis != null ? Number(sonKur.efektifSatis) : null,
        tarih: sonKur?.tarih ?? null,
      })
    }
    return results
  }

  async findByTarih(tarih: string) {
    const dovizler = await this.prisma.doviz.findMany({
      where: { kullanimda: true },
      orderBy: { sira: 'asc' },
    })

    const basla = new Date(`${tarih}T00:00:00`)
    const bitis = new Date(`${tarih}T23:59:59.999`)
    const kurlar = await this.prisma.dovizKuru.findMany({
      where: { tarih: { gte: basla, lte: bitis } },
    })
    const kurMap = new Map(kurlar.map((k) => [k.dovizKodu, k]))

    return dovizler.map((d) => {
      const k = kurMap.get(d.kod)
      return {
        dovizKodu: d.kod,
        dovizAd: d.ad,
        alisKuru: k ? Number(k.alisKuru) : null,
        satisKuru: k ? Number(k.satisKuru) : null,
        efektifAlis: k?.efektifAlis != null ? Number(k.efektifAlis) : null,
        efektifSatis: k?.efektifSatis != null ? Number(k.efektifSatis) : null,
        tarih: k?.tarih ?? null,
      }
    })
  }
}
