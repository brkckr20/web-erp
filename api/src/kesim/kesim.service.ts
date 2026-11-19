import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateKesimDto, UpdateKesimDto } from './dto/create-kesim.dto'

@Injectable()
export class KesimService {
  constructor(private prisma: PrismaService) {}

  findAll(siparisNo?: string) {
    return this.prisma.kesim.findMany({
      where: siparisNo ? { siparisNo } : undefined,
      orderBy: [{ tarih: 'desc' }, { id: 'desc' }],
    })
  }

  async findOne(id: number) {
    const kesim = await this.prisma.kesim.findUnique({ where: { id } })
    if (!kesim) throw new NotFoundException('Kesim kaydı bulunamadı')
    return kesim
  }

  create(dto: CreateKesimDto) {
    if (!dto?.siparisNo || !dto?.modelKod || !dto?.renkAd || !dto?.beden) {
      throw new BadRequestException('Sipariş, model, renk ve beden zorunludur')
    }
    return this.prisma.kesim.create({ data: this.toData(dto) })
  }

  async topluOlustur(kayitlar: CreateKesimDto[]) {
    const gecerli = (kayitlar ?? []).filter((k) => k?.siparisNo && k?.modelKod && k?.renkAd && k?.beden)
    if (gecerli.length === 0) throw new BadRequestException('Kesim kaydı girilmelidir')
    return this.prisma.$transaction(gecerli.map((k) => this.prisma.kesim.create({ data: this.toData(k) })))
  }

  async update(id: number, dto: UpdateKesimDto) {
    await this.findOne(id)
    return this.prisma.kesim.update({ where: { id }, data: this.toData(dto) })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.kesim.delete({ where: { id } })
  }

  private toData(dto: CreateKesimDto) {
    return {
      siparisNo: dto.siparisNo,
      modelKod: dto.modelKod,
      modelAd: dto.modelAd ?? null,
      renkAd: dto.renkAd,
      beden: dto.beden,
      planlananMiktar: Math.trunc(Number(dto.planlananMiktar) || 0),
      kesilenMiktar: Math.trunc(Number(dto.kesilenMiktar) || 0),
      fireMiktar: Number(dto.fireMiktar) || 0,
      kumasAd: dto.kumasAd ?? null,
      kumasRenk: dto.kumasRenk ?? null,
      gerekliMiktar: Number(dto.gerekliMiktar) || 0,
      brutMiktar: Number(dto.brutMiktar) || 0,
      kumasMiktar: Number(dto.kumasMiktar) || 0,
      birimTuketim: Number(dto.birimTuketim) || 0,
      beklenenAdet: Math.trunc(Number(dto.beklenenAdet) || 0),
      kalanMT: Number(dto.kalanMT) || 0,
      fireOrani: Number(dto.fireOrani) || 0,
      iadeTalep: !!dto.iadeTalep,
      tarih: dto.tarih ? new Date(dto.tarih) : new Date(),
      durum: dto.durum || 'KESILDI',
      kaynakFisId: dto.kaynakFisId ?? null,
      kaynakFisNo: dto.kaynakFisNo ?? null,
      kaynakKalemId: dto.kaynakKalemId ?? null,
      manuelFire: !!dto.manuelFire,
      olusturanKullanici: dto.olusturanKullanici ?? null,
    }
  }
}
