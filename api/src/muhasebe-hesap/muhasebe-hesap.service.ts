import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMuhasebeHesapDto } from './dto/create-muhasebe-hesap.dto'
import { UpdateMuhasebeHesapDto } from './dto/update-muhasebe-hesap.dto'

export interface MuhasebeHesapTransferSatir {
  [key: string]: string | number | boolean | null | undefined
}

export interface MuhasebeHesapTransferSonuc {
  toplam: number
  eklenen: number
  atlanan: { kod: string; neden: string }[]
}

const HESAP_TIPLERI = ['PARASAL', 'PARASAL_OLMAYAN_BORC', 'PARASAL_OLMAYAN_ALACAK']
const HESAP_TURLERI = ['BORC_ALACAK', 'BORC', 'ALACAK']

@Injectable()
export class MuhasebeHesapService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.muhasebeHesap.findMany({ orderBy: { kod: 'asc' } })
  }

  async findOne(id: number) {
    const kayit = await this.prisma.muhasebeHesap.findUnique({ where: { id } })
    if (!kayit) throw new NotFoundException('Muhasebe hesabı bulunamadı')
    return kayit
  }

  async create(dto: CreateMuhasebeHesapDto) {
    const kod = dto.kod?.trim()
    const ad = dto.ad?.trim()
    if (!kod) throw new BadRequestException('Kod zorunludur')
    if (!ad) throw new BadRequestException('Ad zorunludur')
    const hesapTipi = this.normalizeHesapTipi(dto.hesapTipi)
    const hesapTuru = this.normalizeHesapTuru(dto.hesapTuru)
    try {
      return await this.prisma.muhasebeHesap.create({
        data: {
          kod,
          ad,
          erisimKodu: this.metin(dto.erisimKodu),
          ozelKod: this.metin(dto.ozelKod),
          aciklama: this.metin(dto.aciklama),
          hesapTipi,
          hesapTuru,
        },
      })
    } catch (e) {
      this.kodHatasiniCevir(e)
      throw e
    }
  }

  async update(id: number, dto: UpdateMuhasebeHesapDto) {
    await this.findOne(id)
    const data: any = {}
    if (dto.kod !== undefined) {
      const kod = dto.kod.trim()
      if (!kod) throw new BadRequestException('Kod zorunludur')
      data.kod = kod
    }
    if (dto.ad !== undefined) {
      const ad = dto.ad.trim()
      if (!ad) throw new BadRequestException('Ad zorunludur')
      data.ad = ad
    }
    if (dto.erisimKodu !== undefined) data.erisimKodu = this.metin(dto.erisimKodu)
    if (dto.ozelKod !== undefined) data.ozelKod = this.metin(dto.ozelKod)
    if (dto.aciklama !== undefined) data.aciklama = this.metin(dto.aciklama)
    if (dto.hesapTipi !== undefined) data.hesapTipi = this.normalizeHesapTipi(dto.hesapTipi)
    if (dto.hesapTuru !== undefined) data.hesapTuru = this.normalizeHesapTuru(dto.hesapTuru)
    try {
      return await this.prisma.muhasebeHesap.update({ where: { id }, data })
    } catch (e) {
      this.kodHatasiniCevir(e)
      throw e
    }
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.muhasebeHesap.delete({ where: { id } })
  }

  async importHesaplar(satirlar: MuhasebeHesapTransferSatir[]): Promise<MuhasebeHesapTransferSonuc> {
    const atlanan: { kod: string; neden: string }[] = []
    const gecerli: { kod: string; ad: string }[] = []
    const gorulen = new Set<string>()

    for (const satir of satirlar) {
      const kod = this.metin(satir.kod as string | null | undefined)
      const ad = this.metin(satir.ad as string | null | undefined)
      if (!kod) { atlanan.push({ kod: '(boş)', neden: 'Kod boş' }); continue }
      if (!ad) { atlanan.push({ kod, neden: 'Ad boş' }); continue }
      if (gorulen.has(kod)) { atlanan.push({ kod, neden: 'Excel içinde tekrar eden kod' }); continue }
      gorulen.add(kod)
      gecerli.push({ kod, ad })
    }

    if (gecerli.length === 0) return { toplam: satirlar.length, eklenen: 0, atlanan }

    const mevcut = await this.prisma.muhasebeHesap.findMany({
      where: { kod: { in: gecerli.map((v) => v.kod) } },
      select: { kod: true },
    })
    const mevcutKodlar = new Set(mevcut.map((r) => r.kod))
    const eklenecek = gecerli.filter((v) => {
      if (mevcutKodlar.has(v.kod)) { atlanan.push({ kod: v.kod, neden: 'Sistemde zaten kayıtlı' }); return false }
      return true
    })

    let eklenen = 0
    if (eklenecek.length > 0) {
      try {
        const sonuc = await this.prisma.muhasebeHesap.createMany({
          data: eklenecek.map((v) => ({ kod: v.kod, ad: v.ad, hesapTipi: 'PARASAL', hesapTuru: 'BORC_ALACAK' })),
        })
        eklenen = sonuc.count
      } catch {
        atlanan.push({ kod: '-', neden: 'Veritabanı hatası, hiçbir satır eklenemedi' })
      }
    }
    return { toplam: satirlar.length, eklenen, atlanan }
  }

  private metin(v?: string | null) {
    const s = (v ?? '').trim()
    return s ? s : null
  }

  private normalizeHesapTipi(v?: string | null) {
    const s = (v ?? 'PARASAL').trim().toUpperCase()
    if (!HESAP_TIPLERI.includes(s)) throw new BadRequestException('Geçersiz hesap tipi')
    return s
  }

  private normalizeHesapTuru(v?: string | null) {
    const s = (v ?? 'BORC_ALACAK').trim().toUpperCase()
    if (!HESAP_TURLERI.includes(s)) throw new BadRequestException('Geçersiz hesap türü')
    return s
  }

  private kodHatasiniCevir(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new BadRequestException('Bu kod zaten kullanılıyor')
    }
  }
}
