import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface CariTransferSatir {
  [key: string]: string | number | boolean | null | undefined
}

export interface CariTransferAtlanan {
  kod: string
  neden: string
}

export interface CariTransferSonuc {
  toplam: number
  eklenen: number
  atlanan: CariTransferAtlanan[]
}

const STRING_ALANLAR = [
  'ticariUnvani',
  'erisimKodu',
  'ozelKod',
  'grubu',
  'sektoru',
  'ticariIslemGrubu',
  'cariHesapTipi',
  'cariHesapTuru',
  'personel',
  'satisPersoneli',
  'satisKanali',
  'araciKurum',
  'musteriHesapKodu',
  'saticiHesapKodu',
  'vadeFarkiFaizOrani',
  'vadeOpsiyonu',
  'odemePlani',
  'indirimKodu',
  'fiyatKodu',
  'alisIndirimKodu',
  'satisIndirimKodu',
  'vergiDairesi',
  'vergiNo',
  'dovizCinsi',
  'dovizKurTipi',
]

const BOOL_ALANLAR = ['kullanimda', 'potansiyel', 'bayi', 'faktoring']

@Injectable()
export class CariTransferService {
  constructor(private prisma: PrismaService) {}

  private bosla(v: unknown): string | null {
    if (v == null) return null
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') return null
    const s = String(v).trim()
    return s === '' ? null : s
  }

  private boolCoz(v: unknown): boolean | undefined {
    if (v == null) return undefined
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return v === 1
    if (typeof v !== 'string') return undefined
    const s = v
      .trim()
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/ö/g, 'o')
    if (['1', 'true', 'evet', 'e', 'acik', 'açik', 'x'].includes(s)) return true
    if (['0', 'false', 'hayir', 'h', 'kapali', 'kapalı', 'yok'].includes(s)) return false
    return undefined
  }

  async importCariler(satirlar: CariTransferSatir[]): Promise<CariTransferSonuc> {
    const atlanan: CariTransferAtlanan[] = []
    const gecerli: Record<string, unknown>[] = []
    const gorulen = new Set<string>()

    for (const satir of satirlar) {
      const kod = this.bosla(satir.kod)
      const ad = this.bosla(satir.ad)
      if (!kod) {
        atlanan.push({ kod: '(boş)', neden: 'Kod boş' })
        continue
      }
      if (!ad) {
        atlanan.push({ kod, neden: 'Ad boş' })
        continue
      }
      if (gorulen.has(kod)) {
        atlanan.push({ kod, neden: 'Excel içinde tekrar eden kod' })
        continue
      }
      gorulen.add(kod)

      const veri: Record<string, unknown> = { kod, ad }
      for (const alan of STRING_ALANLAR) {
        const deger = this.bosla(satir[alan])
        if (deger != null) veri[alan] = deger
      }
      for (const alan of BOOL_ALANLAR) {
        const deger = this.boolCoz(satir[alan])
        if (deger != null) veri[alan] = deger
      }
      gecerli.push(veri)
    }

    if (gecerli.length === 0) {
      return { toplam: satirlar.length, eklenen: 0, atlanan }
    }

    const kods = gecerli.map((v) => v.kod as string)
    const mevcut = await this.prisma.cariHesap.findMany({
      where: { kod: { in: kods } },
      select: { kod: true },
    })
    const mevcutKodlar = new Set(mevcut.map((r) => r.kod))

    const eklenecek: Record<string, unknown>[] = []
    for (const veri of gecerli) {
      const kod = veri.kod as string
      if (mevcutKodlar.has(kod)) {
        atlanan.push({ kod, neden: 'Sistemde zaten kayıtlı' })
        continue
      }
      eklenecek.push(veri)
    }

    let eklenen = 0
    if (eklenecek.length > 0) {
      try {
        const sonuc = await this.prisma.cariHesap.createMany({ data: eklenecek as never[] })
        eklenen = sonuc.count
      } catch {
        atlanan.push({ kod: '-', neden: 'Veritabanı hatası, hiçbir satır eklenemedi' })
      }
    }

    return { toplam: satirlar.length, eklenen, atlanan }
  }
}