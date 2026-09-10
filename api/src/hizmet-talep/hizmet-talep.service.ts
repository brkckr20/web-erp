import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateHizmetTalepDto,
  UpdateHizmetTalepDto,
  CreateHizmetTalepNotDto,
  CreateHizmetTalepDosyaDto,
} from './dto/create-hizmet-talep.dto'

@Injectable()
export class HizmetTalepService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.hizmetTalep.findMany({
      orderBy: { olusturmaTarihi: 'desc' },
      include: { notlar: true, dosyalar: true },
    })
  }

  async findOne(id: number) {
    const talep = await this.prisma.hizmetTalep.findUnique({
      where: { id },
      include: { notlar: { orderBy: { olusturmaTarihi: 'desc' } }, dosyalar: true },
    })
    if (!talep) throw new NotFoundException('Hizmet talep bulunamadı')
    return talep
  }

  async create(dto: CreateHizmetTalepDto) {
    return this.prisma.hizmetTalep.create({
      data: {
        baslik: dto.baslik,
        aciklama: dto.aciklama,
        durum: dto.durum ?? 'Açık',
        oncelik: dto.oncelik ?? 'Normal',
        tarih: dto.tarih ? new Date(dto.tarih) : new Date(),
        kullanici: dto.kullanici,
        gorusmeKisi: dto.gorusmeKisi,
      },
      include: { notlar: true, dosyalar: true },
    })
  }

  async update(id: number, dto: UpdateHizmetTalepDto) {
    await this.findOne(id)
    return this.prisma.hizmetTalep.update({
      where: { id },
      data: {
        baslik: dto.baslik,
        aciklama: dto.aciklama,
        durum: dto.durum,
        oncelik: dto.oncelik,
        tarih: dto.tarih ? new Date(dto.tarih) : undefined,
        kullanici: dto.kullanici,
        gorusmeKisi: dto.gorusmeKisi,
        guncellemeTarihi: new Date(),
      },
      include: { notlar: true, dosyalar: true },
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    await this.prisma.hizmetTalepDosya.deleteMany({ where: { hizmetTalepId: id } })
    await this.prisma.hizmetTalepNot.deleteMany({ where: { hizmetTalepId: id } })
    return this.prisma.hizmetTalep.delete({ where: { id } })
  }

  async addNot(dto: CreateHizmetTalepNotDto) {
    await this.findOne(dto.hizmetTalepId)
    return this.prisma.hizmetTalepNot.create({
      data: {
        hizmetTalepId: dto.hizmetTalepId,
        icerik: dto.icerik,
        gorusmeTarihi: dto.gorusmeTarihi ? new Date(dto.gorusmeTarihi) : null,
        iletisimKisi: dto.iletisimKisi,
      },
    })
  }

  async removeNot(id: number) {
    await this.prisma.hizmetTalepDosya.deleteMany({ where: { hizmetTalepNotId: id } })
    return this.prisma.hizmetTalepNot.delete({ where: { id } })
  }

  async addDosya(dto: CreateHizmetTalepDosyaDto) {
    return this.prisma.hizmetTalepDosya.create({
      data: {
        hizmetTalepId: dto.hizmetTalepId,
        hizmetTalepNotId: dto.hizmetTalepNotId ?? null,
        dosyaAdi: dto.dosyaAdi,
        dosyaYolu: dto.dosyaYolu,
      },
    })
  }

  async removeDosya(id: number) {
    return this.prisma.hizmetTalepDosya.delete({ where: { id } })
  }
}
