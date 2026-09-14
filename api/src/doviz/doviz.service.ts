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

    const results: { dovizKodu: string; dovizAd: string; alisKuru: number | null; satisKuru: number | null; tarih: Date | null }[] = []
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
        tarih: sonKur?.tarih ?? null,
      })
    }
    return results
  }
}
