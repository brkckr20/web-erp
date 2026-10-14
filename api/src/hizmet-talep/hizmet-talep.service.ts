import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateHizmetTalepDto,
  UpdateHizmetTalepDto,
  CreateHizmetTalepNotDto,
} from './dto/create-hizmet-talep.dto'

// Liste/detay asla `dosya` (Bytes) kolonunu seçmez: JSON yanıtına girmemeli (logo deseni).
const DOSYA_SELECT = {
  id: true,
  hizmetTalepId: true,
  hizmetTalepNotId: true,
  dosyaAdi: true,
  dosyaYolu: true,
  mimetype: true,
  boyut: true,
  olusturmaTarihi: true,
}

@Injectable()
export class HizmetTalepService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.hizmetTalep.findMany({
      orderBy: { olusturmaTarihi: 'desc' },
      include: { notlar: true, dosyalar: { select: DOSYA_SELECT } },
    })
  }

  async findOne(id: number) {
    const talep = await this.prisma.hizmetTalep.findUnique({
      where: { id },
      include: { notlar: { orderBy: { olusturmaTarihi: 'desc' } }, dosyalar: { select: DOSYA_SELECT } },
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
        kapanisTarihi: dto.kapanisTarihi ? new Date(dto.kapanisTarihi) : undefined,
      },
      include: { notlar: true, dosyalar: { select: DOSYA_SELECT } },
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
        kapanisTarihi: dto.kapanisTarihi ? new Date(dto.kapanisTarihi) : undefined,
        guncellemeTarihi: new Date(),
      },
      include: { notlar: true, dosyalar: { select: DOSYA_SELECT } },
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

  async uploadDosya(file: Express.Multer.File, hizmetTalepId: number, hizmetTalepNotId?: number) {
    if (!file) throw new BadRequestException('Dosya yüklenmedi')
    await this.findOne(hizmetTalepId)
    return this.prisma.hizmetTalepDosya.create({
      data: {
        hizmetTalepId,
        hizmetTalepNotId: hizmetTalepNotId ?? null,
        dosyaAdi: file.originalname,
        dosyaYolu: file.originalname,
        dosya: file.buffer,
        mimetype: file.mimetype,
        boyut: file.size,
      },
      select: DOSYA_SELECT,
    })
  }

  async getDosya(id: number) {
    const row = await this.prisma.hizmetTalepDosya.findUnique({
      where: { id },
      select: { dosya: true, dosyaAdi: true, mimetype: true },
    })
    if (!row || !row.dosya) throw new NotFoundException('Dosya bulunamadı')
    return row
  }

  async removeDosya(id: number) {
    return this.prisma.hizmetTalepDosya.delete({ where: { id } })
  }
}
