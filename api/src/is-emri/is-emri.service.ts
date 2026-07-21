import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIsEmriDto } from './dto/create-is-emri.dto'
import { UpdateIsEmriDto } from './dto/update-is-emri.dto'

@Injectable()
export class IsEmriService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.isEmri.findMany({
      orderBy: { isEmriNo: 'asc' },
      include: { kalemler: { orderBy: { sira: 'asc' } } },
    })

    const kkGrouped = await this.prisma.kaliteKontrolKalem.groupBy({
      by: ['isEmriNo', 'malzemeId'],
      _sum: { netAgirlik: true, netMetre: true },
      where: { isEmriNo: { not: null }, malzemeId: { not: null } },
    })

    const malzemeIds = [...new Set(kkGrouped.map((k) => k.malzemeId).filter(Boolean) as number[])]
    const malzemeler = malzemeIds.length > 0
      ? await this.prisma.malzeme.findMany({ where: { id: { in: malzemeIds } }, select: { id: true, kod: true } })
      : []
    const malzemeMap = new Map(malzemeler.map((m) => [m.id, m.kod]))

    const kkMapKg = new Map<string, number>()
    const kkMapMt = new Map<string, number>()
    for (const k of kkGrouped) {
      const malzemeKod = malzemeMap.get(k.malzemeId!) ?? ''
      if (!malzemeKod) continue
      const key = `${k.isEmriNo}|${malzemeKod}`
      kkMapKg.set(key, Number(k._sum.netAgirlik) || 0)
      kkMapMt.set(key, Number(k._sum.netMetre) || 0)
    }

    for (const isEmri of items) {
      for (const kalem of isEmri.kalemler) {
        const key = `${isEmri.isEmriNo}|${kalem.malzemeKod}`
        ;(kalem as any).kullanilanKg = kkMapKg.get(key) ?? 0
        ;(kalem as any).kullanilanMt = kkMapMt.get(key) ?? 0
      }
    }

    return items
  }

  async findOne(id: number) {
    const entity = await this.prisma.isEmri.findUnique({
      where: { id },
      include: { kalemler: { include: { malzeme: true }, orderBy: { sira: 'asc' } } },
    })
    if (!entity) throw new NotFoundException('İş emri bulunamadı')
    return entity
  }

  async findByKod(kod: string) {
    const entity = await this.prisma.isEmri.findUnique({
      where: { isEmriNo: kod },
      include: { kalemler: { include: { malzeme: true }, orderBy: { sira: 'asc' } } },
    })
    if (!entity) throw new NotFoundException('İş emri bulunamadı')
    return entity
  }

  async create(dto: CreateIsEmriDto) {
    const isEmriNo = await this.generateIsEmriNo()
    if (!isEmriNo) throw new Error('NUMERATOR_FAILED')
    const data: any = { ...dto, isEmriNo }
    delete data.kalemler
    if (dto.baslangicTarihi) data.baslangicTarihi = new Date(dto.baslangicTarihi)
    if (dto.bitisTarihi) data.bitisTarihi = new Date(dto.bitisTarihi)

    return this.prisma.isEmri.create({
      data: {
        ...data,
        kalemler: {
          create: (dto.kalemler ?? []).map((k, i) => ({
            sira: k.sira ?? i,
            siparisNo: k.siparisNo ?? null,
            malzemeId: k.malzemeId ?? null,
            malzemeKod: k.malzemeKod ?? null,
            malzemeAd: k.malzemeAd ?? null,
            kg: k.kg ?? null,
            mt: k.mt ?? null,
            adet: k.adet ?? null,
          })),
        },
      },
      include: { kalemler: { orderBy: { sira: 'asc' } } },
    })
  }

  async update(id: number, dto: UpdateIsEmriDto) {
    await this.findOne(id)
    const data: any = { ...dto }
    delete data.kalemler
    if (dto.baslangicTarihi) data.baslangicTarihi = new Date(dto.baslangicTarihi)
    if (dto.bitisTarihi) data.bitisTarihi = new Date(dto.bitisTarihi)

    // kalemleri baştan yaz
    await this.prisma.isEmriKalem.deleteMany({ where: { isEmriId: id } })

    return this.prisma.isEmri.update({
      where: { id },
      data: {
        ...data,
        kalemler: {
          create: (dto.kalemler ?? []).map((k, i) => ({
            sira: k.sira ?? i,
            siparisNo: k.siparisNo ?? null,
            malzemeId: k.malzemeId ?? null,
            malzemeKod: k.malzemeKod ?? null,
            malzemeAd: k.malzemeAd ?? null,
            kg: k.kg ?? null,
            mt: k.mt ?? null,
            adet: k.adet ?? null,
          })),
        },
      },
      include: { kalemler: { orderBy: { sira: 'asc' } } },
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.isEmri.delete({ where: { id } })
  }

  private async generateIsEmriNo(): Promise<string> {
    const PREFIX = 'IE-'
    const all = await this.prisma.isEmri.findMany({
      where: { isEmriNo: { startsWith: PREFIX } },
      select: { isEmriNo: true },
    })

    let max = 0
    for (const row of all) {
      const numStr = (row.isEmriNo ?? '').replace(PREFIX, '').replace(/\D/g, '')
      const parsed = parseInt(numStr, 10)
      if (!isNaN(parsed) && parsed > max) max = parsed
    }
    return `${PREFIX}${String(max + 1).padStart(8, '0')}`
  }
}
