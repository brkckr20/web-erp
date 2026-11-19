import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateKumasTalepDto, UpdateKumasTalepDto } from './dto/create-kumas-talep.dto'

@Injectable()
export class KumasTalepService {
  constructor(private prisma: PrismaService) {}

  async findAll(siparisNo?: string) {
    return this.prisma.kumasTalep.findMany({
      where: siparisNo ? { siparisNo } : undefined,
      include: { kalemler: { orderBy: { sira: 'asc' } } },
      orderBy: { tarih: 'desc' },
    })
  }

  async findOne(id: number) {
    const talep = await this.prisma.kumasTalep.findUnique({
      where: { id },
      include: { kalemler: { orderBy: { sira: 'asc' } } },
    })
    if (!talep) throw new NotFoundException('Kumaş talebi bulunamadı')
    return talep
  }

  async nextNo() {
    const yil = new Date().getFullYear()
    const prefix = `KT-${yil}-`
    const son = await this.prisma.kumasTalep.findFirst({
      where: { talepNo: { startsWith: prefix } },
      orderBy: { talepNo: 'desc' },
      select: { talepNo: true },
    })
    const sira = son ? Number(son.talepNo.slice(prefix.length)) + 1 : 1
    return { talepNo: prefix + String(sira).padStart(4, '0') }
  }

  async create(dto: CreateKumasTalepDto) {
    if (!dto?.siparisNo) throw new BadRequestException('Sipariş seçilmelidir')
    const kalemler = (dto.kalemler ?? []).filter((k) => k?.kumasKod && Number(k.miktar) > 0)
    if (kalemler.length === 0) throw new BadRequestException('En az bir kumaş kalemi girilmelidir')
    const { talepNo } = await this.nextNo()

    return this.prisma.kumasTalep.create({
      data: {
        talepNo,
        siparisId: dto.siparisId ?? null,
        siparisNo: dto.siparisNo,
        tarih: dto.tarih ? new Date(dto.tarih) : new Date(),
        talepEden: dto.talepEden ?? null,
        aciklama: dto.aciklama ?? null,
        olusturanKullanici: dto.olusturanKullanici ?? null,
        kalemler: {
          create: kalemler.map((k, i) => ({
            kumasKod: k.kumasKod,
            kumasAd: k.kumasAd ?? null,
            renk: k.renk ?? null,
            miktar: Number(k.miktar) || 0,
            birim: k.birim || 'MT',
            aciklama: k.aciklama ?? null,
            sira: i,
          })),
        },
      },
      include: { kalemler: { orderBy: { sira: 'asc' } } },
    })
  }

  async update(id: number, dto: UpdateKumasTalepDto) {
    await this.findOne(id)
    const kalemler = (dto.kalemler ?? []).filter((k) => k?.kumasKod && Number(k.miktar) > 0)

    return this.prisma.kumasTalep.update({
      where: { id },
      data: {
        siparisId: dto.siparisId ?? null,
        siparisNo: dto.siparisNo,
        tarih: dto.tarih ? new Date(dto.tarih) : undefined,
        talepEden: dto.talepEden ?? null,
        aciklama: dto.aciklama ?? null,
        kalemler: {
          deleteMany: {},
          create: kalemler.map((k, i) => ({
            kumasKod: k.kumasKod,
            kumasAd: k.kumasAd ?? null,
            renk: k.renk ?? null,
            miktar: Number(k.miktar) || 0,
            birim: k.birim || 'MT',
            aciklama: k.aciklama ?? null,
            sira: i,
          })),
        },
      },
      include: { kalemler: { orderBy: { sira: 'asc' } } },
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.kumasTalep.delete({ where: { id } })
  }
}
