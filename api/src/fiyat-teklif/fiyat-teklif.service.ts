import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFiyatTeklifDto, FiyatTeklifKalemDto, UpdateFiyatTeklifDto } from './dto/create-fiyat-teklif.dto'

// Liste/detay asla `dosya` (Bytes) kolonunu seçmez: JSON yanıtına girmemeli.
const DOSYA_SELECT = {
  id: true,
  fiyatTeklifId: true,
  dosyaAdi: true,
  mimetype: true,
  boyut: true,
  createdAt: true,
}

const KALEM_INCLUDE = { kalemler: { orderBy: { sira: 'asc' as const } }, dosyalar: { select: DOSYA_SELECT } }

@Injectable()
export class FiyatTeklifService {
  constructor(private prisma: PrismaService) {}

  findAll(cariKod?: string) {
    return this.prisma.fiyatTeklif.findMany({
      where: cariKod ? { cariKod } : undefined,
      include: KALEM_INCLUDE,
      orderBy: [{ tarih: 'desc' }, { id: 'desc' }],
    })
  }

  async findOne(id: number) {
    const teklif = await this.prisma.fiyatTeklif.findUnique({ where: { id }, include: KALEM_INCLUDE })
    if (!teklif) throw new NotFoundException('Fiyat teklifi bulunamadı')
    return teklif
  }

  async nextNo() {
    const yil = new Date().getFullYear()
    const prefix = `SFT-${yil}-`
    const son = await this.prisma.fiyatTeklif.findFirst({
      where: { teklifNo: { startsWith: prefix } },
      orderBy: { teklifNo: 'desc' },
      select: { teklifNo: true },
    })
    const sira = son ? Number(son.teklifNo.slice(prefix.length)) + 1 : 1
    return { teklifNo: prefix + String(sira).padStart(4, '0') }
  }

  async create(dto: CreateFiyatTeklifDto) {
    if (!dto?.cariKod) throw new BadRequestException('Cari seçilmelidir')
    const kalemler = this.gecerliKalemler(dto.kalemler)
    if (kalemler.length === 0) throw new BadRequestException('En az bir malzeme kalemi girilmelidir')
    const { teklifNo } = await this.nextNo()

    return this.prisma.fiyatTeklif.create({
      data: {
        teklifNo,
        tarih: dto.tarih ? new Date(dto.tarih) : new Date(),
        gecerlilikTarihi: dto.gecerlilikTarihi ? new Date(dto.gecerlilikTarihi) : null,
        cariKod: dto.cariKod,
        cariAd: dto.cariAd ?? null,
        aciklama: dto.aciklama ?? null,
        olusturanKullanici: dto.olusturanKullanici ?? null,
        kalemler: { create: kalemler.map((k, i) => this.kalemData(k, i)) },
      },
      include: KALEM_INCLUDE,
    })
  }

  async update(id: number, dto: UpdateFiyatTeklifDto) {
    await this.findOne(id)
    if (!dto?.cariKod) throw new BadRequestException('Cari seçilmelidir')
    const kalemler = this.gecerliKalemler(dto.kalemler)

    return this.prisma.fiyatTeklif.update({
      where: { id },
      data: {
        tarih: dto.tarih ? new Date(dto.tarih) : undefined,
        gecerlilikTarihi: dto.gecerlilikTarihi ? new Date(dto.gecerlilikTarihi) : null,
        cariKod: dto.cariKod,
        cariAd: dto.cariAd ?? null,
        aciklama: dto.aciklama ?? null,
        kalemler: {
          deleteMany: {},
          create: kalemler.map((k, i) => this.kalemData(k, i)),
        },
      },
      include: KALEM_INCLUDE,
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    await this.prisma.fiyatTeklifDosya.deleteMany({ where: { fiyatTeklifId: id } })
    await this.prisma.fiyatTeklifKalem.deleteMany({ where: { fiyatTeklifId: id } })
    return this.prisma.fiyatTeklif.delete({ where: { id } })
  }

  async uploadDosya(file: Express.Multer.File, fiyatTeklifId: number) {
    if (!file) throw new BadRequestException('Dosya yüklenmedi')
    await this.findOne(fiyatTeklifId)
    return this.prisma.fiyatTeklifDosya.create({
      data: {
        fiyatTeklifId,
        dosyaAdi: file.originalname,
        mimetype: file.mimetype,
        boyut: file.size,
        dosya: file.buffer,
      },
      select: DOSYA_SELECT,
    })
  }

  async getDosya(id: number) {
    const row = await this.prisma.fiyatTeklifDosya.findUnique({
      where: { id },
      select: { dosya: true, dosyaAdi: true, mimetype: true },
    })
    if (!row || !row.dosya) throw new NotFoundException('Dosya bulunamadı')
    return row
  }

  async removeDosya(id: number) {
    return this.prisma.fiyatTeklifDosya.delete({ where: { id } })
  }

  private gecerliKalemler(kalemler?: FiyatTeklifKalemDto[]) {
    return (kalemler ?? []).filter((k) => k?.malzemeKod && Number(k.miktar) > 0)
  }

  private kalemData(k: FiyatTeklifKalemDto, sira: number) {
    return {
      malzemeKod: k.malzemeKod,
      malzemeAd: k.malzemeAd ?? null,
      miktar: Number(k.miktar) || 0,
      birim: k.birim || 'ADET',
      birimFiyat: Number(k.birimFiyat) || 0,
      dovizCinsi: k.dovizCinsi || 'TL',
      dovizKuru: k.dovizKuru == null ? null : Number(k.dovizKuru),
      aciklama: k.aciklama ?? null,
      sira,
    }
  }
}
