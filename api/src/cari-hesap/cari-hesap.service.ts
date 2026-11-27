import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCariHesapDto } from './dto/create-cari-hesap.dto'
import { UpdateCariHesapDto } from './dto/update-cari-hesap.dto'
import { CreateCariHesapAdresDto } from './dto/create-cari-hesap-adres.dto'
import { UpdateCariHesapAdresDto } from './dto/update-cari-hesap-adres.dto'

@Injectable()
export class CariHesapService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page?: number, limit?: number, prefix?: string) {
    const pageNum = Math.max(Number(page) || 1, 1)
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 50)
    const skip = (pageNum - 1) * limitNum

    const prefixFilter = prefix
      ? prefix.split(',').map((p) => ({ kod: { startsWith: p.trim() } }))
      : undefined

    return this.prisma.cariHesap.findMany({
      where: {
        ...(prefixFilter ? { OR: prefixFilter } : {}),
        ...(search
          ? {
              AND: [
                {
                  OR: [
                    { kod: { contains: search } },
                    { ad: { contains: search } },
                  ],
                },
              ],
            }
          : {}),
      },
      skip,
      take: limitNum,
      orderBy: { kod: 'asc' }
    })
  }

  async findOne(id: number) {
    const cari = await this.prisma.cariHesap.findUnique({ where: { id } })
    if (!cari) throw new NotFoundException('Cari hesap bulunamadı')
    return cari
  }

  async findByKod(kod: string) {
    const cari = await this.prisma.cariHesap.findUnique({ where: { kod } })
    if (!cari) throw new NotFoundException('Cari hesap bulunamadı')
    return cari
  }

  create(dto: CreateCariHesapDto) {
    return this.prisma.cariHesap.create({ data: dto })
  }

  async update(id: number, dto: UpdateCariHesapDto) {
    await this.findOne(id)
    return this.prisma.cariHesap.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.cariHesap.delete({ where: { id } })
  }

  // ---------- Cari ekstre ----------

  /**
   * Cari ekstre, muhasebe fişi satırlarındaki cariHesapId üzerinden okunur.
   * Böylece faturadan ve cari hesap fişinden doğan tüm hareketler tek kaynaktan gelir.
   * Bakiye = borç - alacak (borç pozitif).
   */
  async ekstre(id: number, baslangic?: string, bitis?: string) {
    const cari = await this.findOne(id)
    const bas = this.gunBaslangici(baslangic)
    const bit = this.gunBitisi(bitis)

    const tarihAraligi: Prisma.DateTimeFilter = {}
    if (bas) tarihAraligi.gte = bas
    if (bit) tarihAraligi.lte = bit

    const where: Prisma.MuhasebeFisSatirWhereInput = {
      cariHesapId: id,
      ...(bas || bit ? { fis: { fisTarihi: tarihAraligi } } : {}),
    }

    const [devir, kayitlar] = await Promise.all([
      bas
        ? this.prisma.muhasebeFisSatir.aggregate({
            where: { cariHesapId: id, fis: { fisTarihi: { lt: bas } } },
            _sum: { borc: true, alacak: true },
          })
        : null,
      this.prisma.muhasebeFisSatir.findMany({
        where,
        include: {
          fis: {
            select: {
              id: true,
              fisTipi: true,
              fisNo: true,
              fisTarihi: true,
              belgeNo: true,
              aciklama: true,
              kaynakTuru: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      }),
    ])

    kayitlar.sort((a, b) => {
      const ta = a.fis.fisTarihi.getTime()
      const tb = b.fis.fisTarihi.getTime()
      if (ta !== tb) return ta - tb
      if (a.fis.fisNo !== b.fis.fisNo) return a.fis.fisNo - b.fis.fisNo
      return a.id - b.id
    })

    const devirBorc = this.para(devir?._sum.borc)
    const devirAlacak = this.para(devir?._sum.alacak)
    let bakiyeKurus = Math.round(devirBorc * 100) - Math.round(devirAlacak * 100)

    const satirlar = kayitlar.map((s) => {
      const borc = this.para(s.borc)
      const alacak = this.para(s.alacak)
      bakiyeKurus += Math.round(borc * 100) - Math.round(alacak * 100)
      return {
        id: s.id,
        tarih: s.fis.fisTarihi,
        fisTipi: s.fis.fisTipi,
        fisNo: s.fis.fisNo,
        belgeNo: s.belgeNo ?? s.fis.belgeNo,
        aciklama: s.aciklama ?? s.fis.aciklama,
        hesapKodu: s.hesapKodu,
        hesapAdi: s.hesapAdi,
        doviz: s.doviz,
        dovizKuru: s.dovizKuru == null ? null : Number(s.dovizKuru),
        dovizTutari: s.dovizTutari == null ? null : this.para(s.dovizTutari),
        borc,
        alacak,
        bakiye: bakiyeKurus / 100,
        kaynakTuru: s.fis.kaynakTuru,
      }
    })

    return {
      cari: { id: cari.id, kod: cari.kod, ad: cari.ad },
      baslangic: bas ? bas.toISOString() : null,
      bitis: bit ? bit.toISOString() : null,
      devir: {
        borc: devirBorc,
        alacak: devirAlacak,
        bakiye: this.para(devirBorc - devirAlacak),
      },
      satirlar,
      toplam: {
        borc: this.para(satirlar.reduce((a, s) => a + s.borc, 0)),
        alacak: this.para(satirlar.reduce((a, s) => a + s.alacak, 0)),
      },
      bakiye: bakiyeKurus / 100,
    }
  }

  private para(v: unknown) {
    const n = Number(v ?? 0)
    return Math.round((isNaN(n) ? 0 : n) * 100) / 100
  }

  private gunBaslangici(v?: string) {
    const d = this.tarihOku(v)
    if (d) d.setHours(0, 0, 0, 0)
    return d
  }

  private gunBitisi(v?: string) {
    const d = this.tarihOku(v)
    if (d) d.setHours(23, 59, 59, 999)
    return d
  }

  /** YYYY-MM-DD biçimini yerel saatte okur (UTC kaymasını önler). */
  private tarihOku(v?: string) {
    if (!v) return null
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
    const d = m
      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      : new Date(v)
    return isNaN(d.getTime()) ? null : d
  }

  // ---------- Adresler (cari_hesap_adres) ----------

  async adresleriGetir(cariHesapId: number) {
    await this.findOne(cariHesapId)
    return this.prisma.cariHesapAdres.findMany({
      where: { cariHesapId },
      orderBy: { kod: 'asc' },
    })
  }

  // Kod otomatik: carinin mevcut max sayısal kodu + 1, 3 haneli (001, 002, ...).
  private async sonrakiAdresKodu(cariHesapId: number): Promise<string> {
    const mevcut = await this.prisma.cariHesapAdres.findMany({
      where: { cariHesapId },
      select: { kod: true },
    })
    let max = 0
    for (const a of mevcut) {
      const n = parseInt(a.kod, 10)
      if (!isNaN(n) && n > max) max = n
    }
    return String(max + 1).padStart(3, '0')
  }

  async adresEkle(cariHesapId: number, dto: CreateCariHesapAdresDto) {
    await this.findOne(cariHesapId)
    const kod = await this.sonrakiAdresKodu(cariHesapId)
    return this.prisma.$transaction(async (tx) => {
      const sayi = await tx.cariHesapAdres.count({ where: { cariHesapId } })
      // Carinin ilk adresi otomatik varsayılan olur.
      const varsayilan = sayi === 0 ? true : (dto.varsayilan ?? false)
      if (varsayilan) {
        await tx.cariHesapAdres.updateMany({ where: { cariHesapId }, data: { varsayilan: false } })
      }
      return tx.cariHesapAdres.create({ data: { ...dto, kod, varsayilan, cariHesapId } })
    })
  }

  async adresGuncelle(adresId: number, dto: UpdateCariHesapAdresDto) {
    const mevcut = await this.prisma.cariHesapAdres.findUnique({ where: { id: adresId } })
    if (!mevcut) throw new NotFoundException('Adres bulunamadı')
    return this.prisma.$transaction(async (tx) => {
      if (dto.varsayilan) {
        await tx.cariHesapAdres.updateMany({
          where: { cariHesapId: mevcut.cariHesapId, id: { not: adresId } },
          data: { varsayilan: false },
        })
      }
      return tx.cariHesapAdres.update({ where: { id: adresId }, data: dto })
    })
  }

  async adresSil(adresId: number) {
    const mevcut = await this.prisma.cariHesapAdres.findUnique({ where: { id: adresId } })
    if (!mevcut) throw new NotFoundException('Adres bulunamadı')
    return this.prisma.$transaction(async (tx) => {
      await tx.cariHesapAdres.delete({ where: { id: adresId } })
      // Varsayılan silindiyse en küçük kodlu adresi varsayılan yap.
      if (mevcut.varsayilan) {
        const ilk = await tx.cariHesapAdres.findFirst({
          where: { cariHesapId: mevcut.cariHesapId },
          orderBy: { kod: 'asc' },
        })
        if (ilk) await tx.cariHesapAdres.update({ where: { id: ilk.id }, data: { varsayilan: true } })
      }
      return { silindi: true }
    })
  }
}
