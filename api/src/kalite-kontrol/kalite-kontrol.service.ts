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

  /**
   * 11-Fasondan Giriş kaynağı bir irsaliye kalemini KK toplamıyla eşitler.
   * netAgirlik/netMetre/adet = Σ(bağlı KK kalemleri); BRÜT alanlarına dokunulmaz
   * (beklenen brüt olarak okunur). Bir alana hiç KK değeri girilmemişse (toplam
   * null) o alan boş bırakılır, elle girilen değer silinmez. Hiç KK kalemi
   * kalmadıysa üç alan da 0'a çekilir. Fişin irsaliyeId bağlantısını kurar.
   */
  private async kaynakIrsaliyeKaleminiGuncelle(
    tx: Prisma.TransactionClient,
    irsaliyeKalemId: number,
  ): Promise<number | null> {
    const kaynak = await tx.irsaliyeKalem.findUnique({
      where: { id: irsaliyeKalemId },
      select: { id: true, irsaliyeId: true },
    })
    if (!kaynak) return null
    const toplam = await tx.kaliteKontrolKalem.aggregate({
      where: { irsaliyeKalemId },
      _count: { _all: true },
      _sum: { netAgirlik: true, netMetre: true, adet: true },
    })
    const data: any = {}
    if (toplam._count._all === 0) {
      data.netAgirlik = 0
      data.netMetre = 0
      data.adet = 0
    } else {
      if (toplam._sum.netAgirlik != null) data.netAgirlik = toplam._sum.netAgirlik
      if (toplam._sum.netMetre != null) data.netMetre = toplam._sum.netMetre
      if (toplam._sum.adet != null) data.adet = toplam._sum.adet
    }
    if (Object.keys(data).length > 0) {
      await tx.irsaliyeKalem.update({ where: { id: irsaliyeKalemId }, data })
    }
    return kaynak.irsaliyeId
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
        const guncellenecekIrsaliyeKalemIds = new Set<number>()
        for (const k of kalemler) {
          const { hatalar: hataArr, id: _id, malzeme, fis: _fis, ...kalemData } = k as any
          const kalem = await tx.kaliteKontrolKalem.create({
            data: { ...kalemData, fisId: fis.id } as any,
          })
          if (kalemData.irsaliyeKalemId != null) {
            guncellenecekIrsaliyeKalemIds.add(Number(kalemData.irsaliyeKalemId))
            if (kalemData.topNo == null) {
              topNoBekleyen.push({ id: kalem.id, irsaliyeKalemId: kalemData.irsaliyeKalemId })
            }
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
        // Fiş seviyesinde irsaliyeId bağlanır (miktar güncellemesi sadece Transfer ile yapılır)
        for (const irsaliyeKalemId of guncellenecekIrsaliyeKalemIds) {
          const kaynak = await tx.irsaliyeKalem.findUnique({ where: { id: Number(irsaliyeKalemId) }, select: { irsaliyeId: true } })
          if (kaynak?.irsaliyeId != null) {
            await tx.kaliteKontrol.update({
              where: { id: fis.id },
              data: { irsaliyeId: kaynak.irsaliyeId },
            })
            break
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
    const oncesi = await this.findOne(id)
    const data: any = { ...dto }
    if (dto.fisTarihi) data.fisTarihi = new Date(dto.fisTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    const kalemler = data.kalemler
    delete data.kalemler

    // Eski bağlantıları topla (silinip/güncellenecek kalemler için yeniden hesap gerekir).
    const eskiBaglantilar = new Set<number>(
      (oncesi.kalemler ?? [])
        .map((k: any) => k.irsaliyeKalemId)
        .filter((x: any) => x != null)
        .map(Number),
    )

    return this.prisma.$transaction(async (tx) => {
      await tx.kaliteKontrol.update({ where: { id }, data })
      const yeniBaglantilar = new Set<number>()
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
          if (kalemData.irsaliyeKalemId != null) {
            yeniBaglantilar.add(Number(kalemData.irsaliyeKalemId))
            if (kalemData.topNo == null) {
              topNoBekleyen.push({ id: kalemId, irsaliyeKalemId: kalemData.irsaliyeKalemId })
            }
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
      // Fiş seviyesinde irsaliyeId bağlanır (miktar güncellemesi sadece Transfer ile yapılır)
      const tumBaglantilar = new Set<number>([...eskiBaglantilar, ...yeniBaglantilar])
      for (const irsaliyeKalemId of tumBaglantilar) {
        const kaynak = await tx.irsaliyeKalem.findUnique({ where: { id: Number(irsaliyeKalemId) }, select: { irsaliyeId: true } })
        if (kaynak?.irsaliyeId != null) {
          await tx.kaliteKontrol.update({ where: { id }, data: { irsaliyeId: kaynak.irsaliyeId } })
          break
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
    const oncesi = await this.findOne(id)
    const baglantiIds = new Set<number>(
      (oncesi.kalemler ?? [])
        .map((k: any) => k.irsaliyeKalemId)
        .filter((x: any) => x != null)
        .map(Number),
    )

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
      const fis = await tx.kaliteKontrol.delete({ where: { id } })
      // Miktar güncellemesi sadece Transfer ile yapılır; silme sonrası otomatik güncelleme yok.
      return fis
    })
  }

  /**
   * Seçili KK barkod satırlarını "aktarıldı" olarak işaretler ve bağlı oldukları
   * 11-Fasondan Giriş (kaynak) kaleminin miktarlarını kümülatif olarak günceller.
   * Kümülatif: seçilen top + daha önce aktarılmış topların tamamı toplanır. Böylece
   * 2 top aktarıldıktan sonra 1 top daha aktarılınca kaynak 2'ye düşmez, 3 olur.
   * Fire yeniden hesaplanır.
   */
  async transferIrsaliyeler(kalemIds: number[]) {
    const ids = [...new Set((kalemIds ?? []).map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0))]
    if (ids.length === 0) return { islem: false, gercellenen: [] }

    return this.prisma.$transaction(async (tx) => {
      const kayitlar = await tx.kaliteKontrolKalem.findMany({
        where: { id: { in: ids }, irsaliyeKalemId: { not: null } },
        select: { id: true, irsaliyeKalemId: true },
      })
      const kaynakIds = [...new Set(
        kayitlar
          .map((k) => Number(k.irsaliyeKalemId))
          .filter((n) => Number.isFinite(n) && n > 0),
      )]
      if (kaynakIds.length === 0) return { islem: false, gercellenen: [] }

      // Seçili topları aktarıldı işaretle. Daha önce aktarılmış satırlar tekrar
      // seçilse bile kümülatif toplama dahil kalır.
      await tx.kaliteKontrolKalem.updateMany({
        where: { id: { in: kayitlar.map((k) => k.id) } },
        data: { aktarildi: true, aktarimTarihi: new Date() },
      })

      const gercellenen: {
        irsaliyeKalemId: number
        irsaliyeId: number | null
        kayitSayisi: number
        topSayisi: number
      }[] = []

      for (const irsaliyeKalemId of kaynakIds) {
        const toplam = await tx.kaliteKontrolKalem.aggregate({
          where: { irsaliyeKalemId, aktarildi: true },
          _count: { _all: true },
          _sum: { netAgirlik: true, netMetre: true, adet: true },
        })
        const kaynak = await tx.irsaliyeKalem.findUnique({
          where: { id: irsaliyeKalemId },
          select: {
            id: true,
            irsaliyeId: true,
            olcuBirimi: true,
            brutAgirlik: true,
            brutMetre: true,
          },
        })
        if (!kaynak) continue

        const data: any = {
          kkBarkodVar: true,
          topSayisi: toplam._count._all,
        }
        if (toplam._sum.netAgirlik != null) data.netAgirlik = toplam._sum.netAgirlik
        if (toplam._sum.netMetre != null) data.netMetre = toplam._sum.netMetre
        if (toplam._sum.adet != null) data.adet = toplam._sum.adet

        // Fire = brüt − net (kaynağın ölçü birimine göre).
        const birim = String(kaynak.olcuBirimi ?? '').toLowerCase()
        if (birim === 'brutkg' || birim === 'kg') {
          data.fire = kaynak.brutAgirlik != null && data.netAgirlik != null && Number(data.netAgirlik) !== 0
            ? new Prisma.Decimal(kaynak.brutAgirlik).minus(new Prisma.Decimal(data.netAgirlik))
            : null
        } else if (birim === 'brutmt' || birim === 'mt') {
          data.fire = kaynak.brutMetre != null && data.netMetre != null && Number(data.netMetre) !== 0
            ? new Prisma.Decimal(kaynak.brutMetre).minus(new Prisma.Decimal(data.netMetre))
            : null
        } else {
          data.fire = null
        }

        await tx.irsaliyeKalem.update({ where: { id: irsaliyeKalemId }, data })
        gercellenen.push({
          irsaliyeKalemId,
          irsaliyeId: kaynak.irsaliyeId,
          kayitSayisi: toplam._count._all,
          topSayisi: toplam._count._all,
        })
      }

      return { islem: gercellenen.length > 0, gercellenen }
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
      include: {
        kalemler: {
          include: {
            irsaliyeKalem: {
              select: { id: true, irsaliyeId: true },
            },
          },
        },
      },
    })
    if (!fis) throw new NotFoundException('Fiş bulunamadı')
    if (fis.irsaliyeId) throw new Error('Bu fiş zaten stoğa alınmış')

    const kalemler = fis.kalemler.filter((k) => k.malzemeId)
    if (kalemler.length === 0) throw new Error('Stoğa alınabilecek kalem bulunamadı (malzemeId gerekli)')

    // 11-Fasondan Giriş kalemine bağlıysa: ayrı tip-10 üretim fişi OLUŞTURULMAMAKTAR.
    // 11 fişi zaten GİRİŞ tipi + tamamlandı=true ile stoğa düşer. KK fis 11'e bağlanır.
    const firsaliyeKalem = kalemler.find((k) => k.irsaliyeKalemId != null)
    if (firsaliyeKalem?.irsaliyeKalem) {
      const irsaliyeId = firsaliyeKalem.irsaliyeKalem.irsaliyeId
      if (!irsaliyeId) throw new Error('11-Fişi bulunamadı')

      return this.prisma.$transaction(async (tx) => {
        await tx.kaliteKontrol.update({
          where: { id },
          data: { irsaliyeId },
        })

        // Miktar güncellemesi sadece Transfer ile yapılır; stogaAl'da otomatik güncelleme yok.

        return tx.irsaliye.findUnique({
          where: { id: irsaliyeId },
          include: { kalemler: { include: { malzeme: true } } },
        })
      })
    }

    // Diğer KK fişleri (iş emrine bağlı): mevcut tip-10 üretim fişi akışı.
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
