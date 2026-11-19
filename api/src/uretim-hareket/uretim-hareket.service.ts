import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUretimHareketDto, UpdateUretimHareketDto } from './dto/create-uretim-hareket.dto'

@Injectable()
export class UretimHareketService {
  constructor(private prisma: PrismaService) {}

  findAll(siparisNo?: string) {
    return this.prisma.uretimHareket.findMany({
      where: siparisNo ? { siparisNo } : undefined,
      orderBy: [{ tarih: 'desc' }, { id: 'desc' }],
    })
  }

  async findOne(id: number) {
    const hareket = await this.prisma.uretimHareket.findUnique({ where: { id } })
    if (!hareket) throw new NotFoundException('Üretim hareketi bulunamadı')
    return hareket
  }

  create(dto: CreateUretimHareketDto) {
    if (!dto?.siparisNo || !dto?.modelKod || !dto?.islemKod) {
      throw new BadRequestException('Sipariş, model ve işlem zorunludur')
    }
    return this.prisma.uretimHareket.create({ data: this.toData(dto) })
  }

  async topluOlustur(kayitlar: CreateUretimHareketDto[]) {
    const gecerli = (kayitlar ?? []).filter((k) => k?.siparisNo && k?.modelKod && k?.islemKod)
    if (gecerli.length === 0) throw new BadRequestException('Hareket kaydı girilmelidir')
    return this.prisma.$transaction(gecerli.map((k) => this.prisma.uretimHareket.create({ data: this.toData(k) })))
  }

  async update(id: number, dto: UpdateUretimHareketDto) {
    await this.findOne(id)
    return this.prisma.uretimHareket.update({ where: { id }, data: this.toData(dto) })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.uretimHareket.delete({ where: { id } })
  }

  private toData(dto: CreateUretimHareketDto) {
    return {
      siparisNo: dto.siparisNo,
      modelKod: dto.modelKod,
      modelAd: dto.modelAd ?? null,
      renkAd: dto.renkAd || '-',
      beden: dto.beden || '-',
      rotaKod: dto.rotaKod ?? null,
      rotaOperasyonId: dto.rotaOperasyonId ?? null,
      islemKod: dto.islemKod,
      islemAd: dto.islemAd || dto.islemKod,
      yon: dto.yon === 'gelis' ? 'gelis' : 'gidis',
      miktar: Math.trunc(Number(dto.miktar) || 0),
      kalite: dto.kalite || 'Sağlam',
      birimFiyat: dto.birimFiyat == null ? null : Number(dto.birimFiyat),
      dovizCinsi: dto.dovizCinsi || 'TL',
      dovizKuru: dto.dovizKuru == null ? null : Number(dto.dovizKuru),
      cariKod: dto.cariKod ?? null,
      cariAd: dto.cariAd ?? null,
      tarih: dto.tarih ? new Date(dto.tarih) : new Date(),
      aciklama: dto.aciklama ?? null,
      barkod: dto.barkod ?? null,
      kayitYapan: dto.kayitYapan ?? null,
      olusturanKullanici: dto.olusturanKullanici ?? null,
    }
  }
}
