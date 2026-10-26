import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { IrsaliyeService } from '../irsaliye/irsaliye.service'
import { CreateKaliteKontrolDto, UpdateKaliteKontrolDto } from './dto/create-kalite-kontrol.dto'

function padBarkod(n: number, length: number): string {
  return n.toString().padStart(length, '0')
}

@Injectable()
export class KaliteKontrolService {
  constructor(
    private prisma: PrismaService,
    private irsaliyeService: IrsaliyeService,
  ) {}

  async nextBarkod(depoKod: string): Promise<{ barkod: string }> {
    const depo = await this.prisma.depo.findUnique({ where: { kod: depoKod } })
    if (!depo) throw new NotFoundException('Depo bulunamadı')
    const prefix = depo.barkodOnEki ?? ''
    if (!prefix) throw new Error('Bu depoda barkod ön eki tanımlanmamış')

    const last = await this.prisma.kaliteKontrolKalem.findFirst({
      where: { barkod: { startsWith: prefix } },
      orderBy: { barkod: 'desc' },
      select: { barkod: true },
    })

    let next = 1
    if (last?.barkod) {
      const numPart = last.barkod.slice(prefix.length)
      const parsed = parseInt(numPart, 10)
      if (!isNaN(parsed)) next = parsed + 1
    }

    const numLen = Math.max(8, next.toString().length)
    return { barkod: `${prefix}${padBarkod(next, numLen)}` }
  }

  async nextFisNo(): Promise<{ fisNo: string }> {
    const last = await this.prisma.kaliteKontrol.findFirst({
      orderBy: { fisNo: 'desc' },
      select: { fisNo: true },
    })
    let next = 1
    if (last?.fisNo) {
      const parsed = parseInt(last.fisNo, 10)
      if (!isNaN(parsed)) next = parsed + 1
    }
    return { fisNo: next.toString().padStart(8, '0') }
  }

  async findAll() {
    const fisler = await this.prisma.kaliteKontrol.findMany({
      orderBy: { fisNo: 'desc' },
      include: {
        cariHesap: true,
        depo: true,
        kalemler: {
          select: { id: true, barkod: true, topNo: true, irsaliyeKalemId: true, malzemeId: true, netAgirlik: true, netMetre: true, adet: true, irsaliyeKalem: { select: { irsaliye: { select: { cariHesap: { select: { id: true, ad: true } } } } } } },
        },
      },
    })
    // Cari hesap boşsa 11 fişinden al
    return fisler.map(f => {
      let cari = f.cariHesap
      if (!cari && f.kalemler.length > 0) {
        const dk = f.kalemler.find(k => k.irsaliyeKalem?.irsaliye?.cariHesap)
        if (dk?.irsaliyeKalem?.irsaliye?.cariHesap) {
          cari = dk.irsaliyeKalem.irsaliye.cariHesap as any
        }
      }
      return { ...f, cariHesap: cari ?? null }
    })
  }

  /**
   * 11 (Fasondan Giriş) kalemine bağlı kalite kontrol kalemleri ("Barkod Detayları").
   * Bir irsaliye kalemi → N top (barkod) → N KK kalemi; hata bilgileri özetlenir.
   */
  async irsaliyeKalemDetay(irsaliyeKalemId: number) {
    const kalemler = await this.prisma.kaliteKontrolKalem.findMany({
      where: { irsaliyeKalemId },
      orderBy: { id: 'asc' },
      include: {
        malzeme: { select: { kod: true, ad: true } },
        hatalar: { select: { hataKodu: true, hataAdi: true, miktar: true } },
        fis: {
          select: { id: true, fisNo: true, fisTarihi: true, kayitYapan: true, kayitTarihi: true },
        },
      },
    })
    return kalemler.map((k) => ({
      id: k.id,
      barkod: k.barkod,
      topNo: k.topNo,
      fisId: k.fisId,
      fisNo: k.fis.fisNo,
      fisTarihi: k.fis.fisTarihi,
      kayitYapan: k.fis.kayitYapan,
      kayitTarihi: k.fis.kayitTarihi,
      malzemeKod: k.malzeme?.kod ?? null,
      malzemeAd: k.malzeme?.ad ?? null,
      netAgirlik: k.netAgirlik,
      netMetre: k.netMetre,
      adet: k.adet,
      hatalar: k.hatalar,
    }))
  }

  async findOne(id: number) {
    const fis = await this.prisma.kaliteKontrol.findUnique({
      where: { id },
      include: {
        cariHesap: true,
        depo: true,
        isEmri: true,
        irsaliye: true,
        kalemler: {
          include: {
            malzeme: true,
            hatalar: true,
            // Satırın geldiği 11 (Fasondan Giriş) fişi — grid'de "11 Fiş No" ve cari hesap için.
            irsaliyeKalem: { select: { irsaliye: { select: { irsaliyeNo: true, cariHesapId: true, cariHesap: { select: { id: true, ad: true } } } } } },
          },
        },
      },
    })
    if (!fis) throw new NotFoundException('Fiş bulunamadı')
    const result: any = { ...fis }
    result.siparisNo = fis.isEmri?.siparisNo ?? null
    // Fiş cari hesap boşsa 11 fişinden al
    if (!result.cariHesapId && result.kalemler && result.kalemler.length > 0) {
      const cari = result.kalemler.find(k => k.irsaliyeKalem?.irsaliye?.cariHesapId)
      if (cari?.irsaliyeKalem?.irsaliye?.cariHesapId) {
        result.cariHesapId = cari.irsaliyeKalem.irsaliye.cariHesapId
        result.cariHesap = cari.irsaliyeKalem.irsaliye.cariHesap ?? null
      }
    }
    return result
  }

  /**
   * Partiye bağlı kaçıncı top? Grup = irsaliye (fiş no) + partiNo + boyahane rengi + malzeme.
   * Silinen top numarayı geri vermez (basılmış etiketle uyum için).
   */
  private async nextTopNo(
    tx: Prisma.TransactionClient,
    irsaliyeKalemId: number,
  ): Promise<number | null> {
    const kaynak = await tx.irsaliyeKalem.findUnique({
      where: { id: irsaliyeKalemId },
      select: { irsaliyeId: true, partiNo: true, boyahaneRenkId: true, malzemeId: true },
    })
    if (!kaynak) return null
    const son = await tx.kaliteKontrolKalem.findFirst({
      where: {
        topNo: { not: null },
        irsaliyeKalem: {
          irsaliyeId: kaynak.irsaliyeId,
          partiNo: kaynak.partiNo,
          boyahaneRenkId: kaynak.boyahaneRenkId,
          malzemeId: kaynak.malzemeId,
        },
      },
      orderBy: { topNo: 'desc' },
      select: { topNo: true },
    })
    return (son?.topNo ?? 0) + 1
  }

  async create(dto: CreateKaliteKontrolDto) {
    const data: any = { ...dto }
    if (dto.fisTarihi) data.fisTarihi = new Date(dto.fisTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    const kalemler = data.kalemler
    delete data.kalemler

    return this.prisma.$transaction(async (tx) => {
      const fis = await tx.kaliteKontrol.create({ data })
      if (Array.isArray(kalemler) && kalemler.length > 0) {
        const topNoBekleyen: { id: number; irsaliyeKalemId: number }[] = []
        for (const k of kalemler) {
          const { hatalar: hataArr, id: _id, malzeme, fis: _fis, ...kalemData } = k as any
          const kalem = await tx.kaliteKontrolKalem.create({
            data: { ...kalemData, fisId: fis.id } as any,
          })
          if (kalemData.topNo == null && kalemData.irsaliyeKalemId != null) {
            topNoBekleyen.push({ id: kalem.id, irsaliyeKalemId: kalemData.irsaliyeKalemId })
          }
          if (Array.isArray(hataArr) && hataArr.length > 0) {
            for (const h of hataArr) {
              await tx.kaliteKontrolHata.create({
                data: { ...h, kalemId: kalem.id },
              })
            }
          }
        }
        // Tüm satırlar oluştuktan SONRA ata (aynı istekte gelen mevcut numaralarla çakışmasın).
        for (const b of topNoBekleyen) {
          const topNo = await this.nextTopNo(tx, b.irsaliyeKalemId)
          if (topNo != null) {
            await tx.kaliteKontrolKalem.update({ where: { id: b.id }, data: { topNo } })
          }
        }
      }
      const created = await tx.kaliteKontrol.findUnique({
        where: { id: fis.id },
        include: { cariHesap: true, depo: true, isEmri: true, kalemler: { include: { malzeme: true, hatalar: true } } },
      })
      const createdResult: any = { ...created }
      createdResult.siparisNo = created?.isEmri?.siparisNo ?? null
      return createdResult
    })
  }

  async update(id: number, dto: UpdateKaliteKontrolDto) {
    await this.findOne(id)
    const data: any = { ...dto }
    if (dto.fisTarihi) data.fisTarihi = new Date(dto.fisTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    const kalemler = data.kalemler
    delete data.kalemler

    return this.prisma.$transaction(async (tx) => {
      await tx.kaliteKontrol.update({ where: { id }, data })
      if (Array.isArray(kalemler)) {
        const existing = await tx.kaliteKontrolKalem.findMany({
          where: { fisId: id },
          select: { id: true },
        })
        const existingIds = existing.map((k) => k.id)
        const gelenIds = new Set<number>()
        for (const k of kalemler as any[]) {
          if (k.id != null && existingIds.includes(Number(k.id))) gelenIds.add(Number(k.id))
        }
        // Fişte olup gelen olmayan satırları sil.
        const silinecekIds = existingIds.filter((x) => !gelenIds.has(x))
        if (silinecekIds.length > 0) {
          await tx.kaliteKontrolHata.deleteMany({ where: { kalemId: { in: silinecekIds } } })
          await tx.kaliteKontrolKalem.deleteMany({ where: { id: { in: silinecekIds } } })
        }
        const topNoBekleyen: { id: number; irsaliyeKalemId: number }[] = []
        for (const k of kalemler) {
          const { hatalar: hataArr, id: kId, malzeme, fis: _fis, ...kalemData } = k as any
          const hataListe = (Array.isArray(hataArr) ? hataArr : []).map((h: any) => {
            const { id: _hid, kalemId: _kId, fis: _fisH, ...hd } = h ?? {}
            return hd
          })
          let kalemId: number
          if (kId != null && gelenIds.has(Number(kId))) {
            // Mevcut satır: id korunarak güncelle.
            kalemId = Number(kId)
            await tx.kaliteKontrolKalem.update({
              where: { id: kalemId },
              data: kalemData,
            })
            await tx.kaliteKontrolHata.deleteMany({ where: { kalemId } })
          } else {
            const kalem = await tx.kaliteKontrolKalem.create({
              data: { ...kalemData, fisId: id } as any,
            })
            kalemId = kalem.id
          }
          if (kalemData.topNo == null && kalemData.irsaliyeKalemId != null) {
            topNoBekleyen.push({ id: kalemId, irsaliyeKalemId: kalemData.irsaliyeKalemId })
          }
          for (const h of hataListe) {
            await tx.kaliteKontrolHata.create({
              data: { ...h, kalemId },
            })
          }
        }
        for (const b of topNoBekleyen) {
          const topNo = await this.nextTopNo(tx, b.irsaliyeKalemId)
          if (topNo != null) {
            await tx.kaliteKontrolKalem.update({ where: { id: b.id }, data: { topNo } })
          }
        }
      }
      const updated = await tx.kaliteKontrol.findUnique({
        where: { id },
        include: { cariHesap: true, depo: true, isEmri: true, kalemler: { include: { malzeme: true, hatalar: true } } },
      })
      const updatedResult: any = { ...updated }
      updatedResult.siparisNo = updated?.isEmri?.siparisNo ?? null
      return updatedResult
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      const kalemIds = await tx.kaliteKontrolKalem.findMany({
        where: { fisId: id },
        select: { id: true },
      })
      if (kalemIds.length > 0) {
        await tx.kaliteKontrolHata.deleteMany({
          where: { kalemId: { in: kalemIds.map((k) => k.id) } },
        })
      }
      await tx.kaliteKontrolKalem.deleteMany({ where: { fisId: id } })
      return tx.kaliteKontrol.delete({ where: { id } })
    })
  }

  stogaAlinmamisListe() {
    return this.prisma.kaliteKontrol.findMany({
      where: { irsaliyeId: null },
      orderBy: { fisNo: 'desc' },
      include: {
        depo: true,
        kalemler: {
          where: { malzemeId: { not: null } },
          include: { malzeme: { select: { id: true, kod: true, ad: true } } },
        },
      },
    })
  }

  async stogaAl(id: number) {
    const fis = await this.prisma.kaliteKontrol.findUnique({
      where: { id },
      include: { kalemler: true },
    })
    if (!fis) throw new NotFoundException('Fiş bulunamadı')
    if (fis.irsaliyeId) throw new Error('Bu fiş zaten stoğa alınmış')

    const kalemler = fis.kalemler.filter((k) => k.malzemeId)
    if (kalemler.length === 0) throw new Error('Stoğa alınabilecek kalem bulunamadı (malzemeId gerekli)')

    const { irsaliyeNo: nextNo } = await this.irsaliyeService.nextIrsaliyeNo('10')

    return this.prisma.$transaction(async (tx) => {
      const irsaliye = await tx.irsaliye.create({
        data: {
          irsaliyeNo: nextNo,
          irsaliyeTipi: '10',
          irsaliyeTarihi: fis.fisTarihi,
          depoId: fis.depoId,
          cariHesapId: fis.cariHesapId,
          aciklama: `KK Fiş: ${fis.fisNo}${fis.aciklama ? ' - ' + fis.aciklama : ''}`,
          tamamlandi: true,
          kayitYapan: fis.kayitYapan,
          kayitTarihi: new Date(),
        },
      })

      for (const k of kalemler) {
        await tx.irsaliyeKalem.create({
          data: {
            irsaliyeId: irsaliye.id,
            malzemeId: k.malzemeId!,
            netAgirlik: k.netAgirlik,
            netMetre: k.netMetre,
            adet: k.adet,
            aciklama: k.aciklama,
            takipNo: k.barkod,
            uuid: k.barkod ?? undefined,
          },
        })
      }

      await tx.kaliteKontrol.update({
        where: { id },
        data: { irsaliyeId: irsaliye.id },
      })

      return tx.irsaliye.findUnique({
        where: { id: irsaliye.id },
        include: { kalemler: { include: { malzeme: true } } },
      })
    })
  }

  // Hata CRUD
  async getHatalar(kalemId: number) {
    return this.prisma.kaliteKontrolHata.findMany({
      where: { kalemId },
      orderBy: { id: 'asc' },
    })
  }

  async createHata(kalemId: number, dto: { hataKodu: string; hataAdi: string; aciklama?: string }) {
    return this.prisma.kaliteKontrolHata.create({
      data: { ...dto, kalemId },
    })
  }

  async updateHata(id: number, dto: { hataKodu?: string; hataAdi?: string; aciklama?: string }) {
    return this.prisma.kaliteKontrolHata.update({
      where: { id },
      data: dto,
    })
  }

  async removeHata(id: number) {
    return this.prisma.kaliteKontrolHata.delete({ where: { id } })
  }
}
