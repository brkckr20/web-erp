import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface TransferSatir {
  kod?: string
  ad?: string
  tip?: number | string | null
  aciklama?: string | null
  renk?: string | null
  ozelKod?: string | null
  pantoneNo?: string | null
  renkTuru?: string | null
  fiyat?: number | string | null
  dovizCinsi?: string | null
  cariKodu?: string | null
}

export interface TransferAtlanan {
  kod: string
  neden: string
}

export interface TransferSonuc {
  toplam: number
  eklenen: number
  atlanan: TransferAtlanan[]
}

@Injectable()
export class RenkTransferService {
  constructor(private prisma: PrismaService) {}

  private bosla(v: unknown): string | null {
    if (v == null) return null
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') return null
    const s = String(v).trim()
    return s === '' ? null : s
  }

  private sayiCoz(v: unknown): number | null | undefined {
    if (v == null) return undefined
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') return undefined
    const t = String(v).trim().replace(/\s/g, '')
    if (t === '') return undefined
    const hasComma = t.includes(',')
    const hasDot = t.includes('.')
    let n: number
    if (hasComma && hasDot) n = Number(t.replace(/\./g, '').replace(',', '.'))
    else if (hasComma) n = Number(t.replace(',', '.'))
    else n = Number(t)
    return Number.isFinite(n) ? n : undefined
  }

  private normalize(satir: TransferSatir): { veri: Record<string, unknown> | null; neden?: string } {
    const kod = this.bosla(satir.kod)
    const ad = this.bosla(satir.ad)
    if (!kod) return { veri: null, neden: 'Kod boş' }
    if (!ad) return { veri: null, neden: 'Ad boş' }

    const tip = this.sayiCoz(satir.tip)
    if (satir.tip != null && String(satir.tip).trim() !== '' && tip == null) {
      return { veri: null, neden: 'Tip sayı olmalı' }
    }
    const fiyat = this.sayiCoz(satir.fiyat)
    if (satir.fiyat != null && String(satir.fiyat).trim() !== '' && fiyat == null) {
      return { veri: null, neden: 'Fiyat sayı olmalı' }
    }

    const veri: Record<string, unknown> = {
      kod,
      ad,
      aciklama: this.bosla(satir.aciklama),
      renk: this.bosla(satir.renk),
      ozelKod: this.bosla(satir.ozelKod),
      pantoneNo: this.bosla(satir.pantoneNo),
      renkTuru: this.bosla(satir.renkTuru),
      dovizCinsi: this.bosla(satir.dovizCinsi),
      cariKodu: this.bosla(satir.cariKodu),
    }
    if (tip != null) veri.tip = tip
    if (fiyat != null) veri.fiyat = fiyat
    return { veri }
  }

  async importRenkler(satirlar: TransferSatir[]): Promise<TransferSonuc> {
    const atlanan: TransferAtlanan[] = []
    const gecerli: Record<string, unknown>[] = []
    const gorulenKodTip = new Set<string>()

    for (const satir of satirlar) {
      const { veri, neden } = this.normalize(satir)
      const kod = veri?.kod as string
      const tip = (veri?.tip as number) ?? 1
      const kodTipKey = `${kod}__${tip}`
      if (!veri) {
        atlanan.push({ kod: (this.bosla(satir.kod) ?? '') || '(boş)', neden: neden ?? 'Geçersiz satır' })
        continue
      }
      if (gorulenKodTip.has(kodTipKey)) {
        atlanan.push({ kod, neden: 'Excel içinde aynı tipte tekrar eden kod' })
        continue
      }
      gorulenKodTip.add(kodTipKey)
      gecerli.push(veri)
    }

    if (gecerli.length === 0) {
      return { toplam: satirlar.length, eklenen: 0, atlanan }
    }

    const tipKodPairs = gecerli.map((v) => ({ kod: v.kod as string, tip: (v.tip ?? 1) as number }))

    const mevcut = await this.prisma.renk.findMany({
      where: {
        OR: tipKodPairs.map((p) => ({ kod: p.kod, tip: p.tip })),
      },
      select: { kod: true, tip: true },
    })
    const mevcutKodTipSet = new Set(mevcut.map((r) => `${r.kod}__${r.tip}`))

    const cariKodlar = [...new Set(gecerli.map((v) => v.cariKodu as string | null).filter((c): c is string => !!c))]
    let mevcutCariler = new Set<string>()
    if (cariKodlar.length > 0) {
      const cariler = await this.prisma.cariHesap.findMany({
        where: { kod: { in: cariKodlar } },
        select: { kod: true },
      })
      mevcutCariler = new Set(cariler.map((c) => c.kod))
    }

    const eklenecek: Record<string, unknown>[] = []
    for (const veri of gecerli) {
      const kod = veri.kod as string
      const tip = (veri.tip as number) ?? 1
      const cariKodu = veri.cariKodu as string | null
      const kodTipKey = `${kod}__${tip}`
      if (mevcutKodTipSet.has(kodTipKey)) {
        atlanan.push({ kod, neden: 'Sistemde bu tipte zaten kayıtlı' })
        continue
      }
      if (cariKodu && !mevcutCariler.has(cariKodu)) {
        atlanan.push({ kod, neden: `Cari hesap bulunamadı: ${cariKodu}` })
        continue
      }
      eklenecek.push(veri)
    }

    let eklenen = 0
    if (eklenecek.length > 0) {
      try {
        const sonuc = await this.prisma.renk.createMany({ data: eklenecek as never[] })
        eklenen = sonuc.count
      } catch {
        atlanan.push({ kod: '-', neden: 'Veritabanı hatası, hiçbir satır eklenemedi' })
      }
    }

    return { toplam: satirlar.length, eklenen, atlanan }
  }
}