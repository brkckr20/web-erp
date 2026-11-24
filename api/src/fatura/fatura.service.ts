import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { stokTipiTamamlandi } from '../irsaliye/irsaliye.service'
import { CreateFaturaDto } from './dto/create-fatura.dto'
import { UpdateFaturaDto } from './dto/create-fatura.dto'

function padNo(n: number): string {
  return n.toString().padStart(8, '0')
}

const FATURA_BORC_TIPLERI = new Set(['120', '121', '138', '126', '192', '8', '125', '123', '122', '124', '133', '139'])
const FATURA_ALACAK_TIPLERI = new Set(['2', '3', '4', '12', '23', '1', '22', '7', '9', '92', '11'])
const FATURA_CARI_HAREKET_ATLA = new Set(['134', '5', '6'])

// İrsaliyeden gelen kalemde miktar tarafı kilitlidir: malzeme + miktar alanları
// her kayıtta kaynak irsaliye kaleminden kopyalanır, istemci değeri yok sayılır.
// Fiyat tarafı (birimFiyat/doviz/kdv/satirTutari) faturaya özeldir, istemciden alınır.
const KALEM_INCLUDE = {
  malzeme: true,
  irsaliyeKalem: true,
  varyant1Renk: true,
  varyant2Renk: true,
  boyahaneRenk: true,
} as const

const FATURA_INCLUDE = {
  cariHesap: true,
  depo: true,
  fasonTipi: true,
  kalemler: { include: KALEM_INCLUDE },
} as const

@Injectable()
export class FaturaService {
  constructor(private prisma: PrismaService) {}

  async nextFaturaNo(faturaTipi: string): Promise<{ faturaNo: string }> {
    const last = await this.prisma.fatura.findFirst({
      where: { faturaTipi },
      orderBy: { faturaNo: 'desc' },
      select: { faturaNo: true },
    })
    let next = 1
    if (last?.faturaNo) {
      const parsed = parseInt(last.faturaNo, 10)
      if (!isNaN(parsed)) next = parsed + 1
    }
    return { faturaNo: padNo(next) }
  }

  findAll(faturaTipi?: string) {
    const where: any = {}
    if (faturaTipi) {
      const tipler = faturaTipi.split(',').map((t) => t.trim())
      where.faturaTipi = { in: tipler }
    }
    return this.prisma.fatura.findMany({
      where,
      orderBy: [{ faturaTipi: 'asc' }, { faturaNo: 'desc' }],
      include: FATURA_INCLUDE,
    })
  }

  async findOne(id: number) {
    const fatura = await this.prisma.fatura.findUnique({
      where: { id },
      include: FATURA_INCLUDE,
    })
    if (!fatura) throw new NotFoundException('Fatura bulunamadı')
    return this.withIrsaliyeler(this.prisma, fatura)
  }

  // İrsaliye kartındaki "Fatura : <no>" rozetinden fatura açmak için (tip+no unique).
  async findByNo(faturaTipi: string, faturaNo: string) {
    const fatura = await this.prisma.fatura.findUnique({
      where: { faturaTipi_faturaNo: { faturaTipi, faturaNo } },
      include: FATURA_INCLUDE,
    })
    if (!fatura) throw new NotFoundException('Fatura bulunamadı')
    return this.withIrsaliyeler(this.prisma, fatura)
  }

  // Fatura kartındaki "Entegrasyon Bilgileri" kutusu için: faturaya bağlı irsaliyeler ve muhasebe fişi.
  private async withIrsaliyeler(client: any, fatura: any) {
    const [irsaliyeler, muhasebeFis] = await Promise.all([
      client.irsaliye.findMany({
        where: { faturaId: fatura.id },
        select: { id: true, irsaliyeTipi: true, irsaliyeNo: true },
        orderBy: { irsaliyeNo: 'asc' },
      }),
      client.muhasebeFis.findFirst({
        where: { kaynakTuru: 'FATURA', kaynakId: fatura.id },
        select: { id: true, fisTipi: true, fisNo: true, fisTarihi: true },
      }),
    ])
    return { ...fatura, irsaliyeler, muhasebeFis }
  }

  // Otomatik irsaliye dahil: tipin son nosundan +1 (8 haneli, irsaliye ile aynı kural).
  private async nextIrsaliyeNo(tx: any, irsaliyeTipi: string): Promise<string> {
    const last = await tx.irsaliye.findFirst({
      where: { irsaliyeTipi, irsaliyeNo: { not: null } },
      orderBy: { irsaliyeNo: 'desc' },
      select: { irsaliyeNo: true },
    })
    let next = 1
    if (last?.irsaliyeNo) {
      const parsed = parseInt(last.irsaliyeNo, 10)
      if (!isNaN(parsed)) next = parsed + 1
    }
    return padNo(next)
  }

  // İrsaliye kalemlerinden snapshot satır üretir (miktar tarafı kaynaktan).
  // FaturaKalem'de olmayan irsaliye-özel alanlar (sipariş bağı, kaynak izi,
  // fire, kumaş bilgileri) ayıklanır; sipariş izi irsaliyeKalemId üzerinden JOIN'lenir.
  private snapshotKalem(kaynak: any, fiyatOverride?: any) {
    const { id: _id, irsaliyeId: _irsaliyeId, irsaliye: _irsaliye, malzeme: _malzeme, varyant1Renk: _v1, varyant2Renk: _v2, boyahaneRenk: _br, faturaKalemleri: _fk, createdAt: _c, updatedAt: _u, fire: _fire, siparisKalemId: _sk, kaynakKalemId: _kk, istenenGram: _ig, istenenEn: _ie, kaliteYapilmayacak: _ky, ebat: _eb, topSayisi: _ts, sanalAgirlik: _sa, sanalMetre: _sm, sanalAdet: _sad, sanalTopSayisi: _sts, kkBarkodVar: _kkb, ...miktar } = kaynak
    return {
      ...miktar,
      irsaliyeKalemId: kaynak.id,
      birimFiyat: fiyatOverride?.birimFiyat ?? kaynak.birimFiyat,
      doviz: fiyatOverride?.doviz ?? kaynak.doviz,
      kdv: fiyatOverride?.kdv ?? kaynak.kdv,
      kdvDahil: fiyatOverride?.kdvDahil ?? kaynak.kdvDahil,
      iskontoOrani: fiyatOverride?.iskontoOrani ?? kaynak.iskontoOrani,
      iskontoTutari: fiyatOverride?.iskontoTutari ?? kaynak.iskontoTutari,
      satirTutari: fiyatOverride?.satirTutari ?? kaynak.satirTutari,
      uuid: randomUUID(),
    }
  }

  async create(dto: CreateFaturaDto) {
    this.dogrulaCariHesap(dto.faturaTipi, dto.cariHesapId)
    const data: any = { ...dto }
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    const kalemler = dto.kalemler ?? []
    const irsaliyeIds = dto.irsaliyeIds ?? []
    delete data.kalemler
    delete data.irsaliyeIds

    return this.prisma.$transaction(async (tx) => {
      const fatura = await tx.fatura.create({ data })

      // 1) Fatura kartından çoklu irsaliye bağlama: kalemler snapshot alınır.
      if (irsaliyeIds.length > 0) {
        const kaynaklar = await tx.irsaliyeKalem.findMany({
          where: { irsaliyeId: { in: irsaliyeIds } },
        })
        // Aynı irsaliye ikinci faturaya bağlanamaz (kısmi fatura askıda).
        const bagli = await tx.faturaKalem.findMany({
          where: { irsaliyeKalemId: { in: kaynaklar.map((k) => k.id) } },
          select: { irsaliyeKalemId: true },
        })
        if (bagli.length > 0)
          throw new BadRequestException('Seçilen irsaliyelerden bazıları zaten faturaya bağlı')
        for (const kaynak of kaynaklar) {
          await tx.faturaKalem.create({ data: { ...this.snapshotKalem(kaynak), faturaId: fatura.id } as any })
        }
        await tx.irsaliye.updateMany({
          where: { id: { in: irsaliyeIds } },
          data: { faturaNo: fatura.faturaNo, faturaTarihi: fatura.faturaTarihi },
        })
      }

      // 2) Kalemler: irsaliye bağlantılı olanlarda miktar tarafı kaynaktan kopyalanır.
      for (const k of kalemler) {
        let kalemData: any = { ...k }
        delete kalemData.id
        delete kalemData.fatura
        delete kalemData.malzeme
        if (k.irsaliyeKalemId) {
          const kaynak = await tx.irsaliyeKalem.findUnique({ where: { id: k.irsaliyeKalemId } })
          if (!kaynak) throw new BadRequestException(`İrsaliye kalemi bulunamadı: ${k.irsaliyeKalemId}`)
          const kullanim = await tx.faturaKalem.findFirst({ where: { irsaliyeKalemId: k.irsaliyeKalemId } })
          if (kullanim) throw new BadRequestException('Bu irsaliye kalemi zaten faturaya bağlı')
          kalemData = this.snapshotKalem(kaynak, k)
          const irs = await tx.irsaliye.findUnique({ where: { id: kaynak.irsaliyeId }, select: { id: true, faturaNo: true } })
          if (irs && !irs.faturaNo) {
            await tx.irsaliye.update({
              where: { id: irs.id },
              data: { faturaNo: fatura.faturaNo, faturaTarihi: fatura.faturaTarihi },
            })
          }
        } else {
          kalemData.uuid = kalemData.uuid ?? randomUUID()
        }
        await tx.faturaKalem.create({ data: { ...kalemData, faturaId: fatura.id } as any })
      }

      // 3) Direkt fatura (irsaliye bağlantısı yok): aynı tip + alt tipte otomatik irsaliye oluşur.
      //    No, tipin son nosundan alınır (normal irsaliye gibi); faturadan geldiği faturaId'den belli olur.
      //    Stoku oynatan taraf bu irsaliyedir.
      const baglantiVar = irsaliyeIds.length > 0 || kalemler.some((k) => k.irsaliyeKalemId)
      if (!baglantiVar && kalemler.length > 0) {
        const otoKalemler = kalemler.map((k: any) => {
          const { id: _id, irsaliyeKalemId: _ik, faturaId: _f, uuid: _u, malzeme: _m, ...rest } = k
          return { ...rest, uuid: randomUUID() }
        })
        await tx.irsaliye.create({
          data: {
            irsaliyeNo: await this.nextIrsaliyeNo(tx, fatura.faturaTipi),
            irsaliyeTipi: fatura.faturaTipi,
            irsaliyeTarihi: fatura.faturaTarihi,
            faturaNo: fatura.faturaNo,
            faturaTarihi: fatura.faturaTarihi,
            faturaId: fatura.id,
            sevkNo: fatura.sevkNo,
            sevkTarihi: fatura.sevkTarihi,
            aciklama: fatura.aciklama,
            cariHesapId: fatura.cariHesapId,
            depoId: fatura.depoId,
            fasonTipiId: fatura.fasonTipiId,
            kayitYapan: fatura.kayitYapan,
            // Direkt faturadan doğan stok fişi de tamamlanmış sayılır.
            tamamlandi: stokTipiTamamlandi(fatura.faturaTipi),
            kalemler: { create: otoKalemler as any },
          } as any,
        })
      }

      await this.syncCariHareket(tx, fatura.id)
      const kayit = await tx.fatura.findUnique({ where: { id: fatura.id }, include: FATURA_INCLUDE })
      return this.withIrsaliyeler(tx, kayit)
    })
  }

  async update(id: number, dto: UpdateFaturaDto) {
    const mevcut = await this.findOne(id)
    const faturaTipi = dto.faturaTipi ?? mevcut.faturaTipi
    const cariHesapIdGelen = dto.cariHesapId ?? mevcut.cariHesapId
    this.dogrulaCariHesap(faturaTipi, cariHesapIdGelen)
    const data: any = { ...dto }
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    const kalemler = (dto as any).kalemler
    delete data.kalemler
    delete data.irsaliyeIds

    const cariHesapId = data.cariHesapId
    const depoId = data.depoId
    const fasonTipiId = data.fasonTipiId
    delete data.cariHesapId
    delete data.depoId
    delete data.fasonTipiId

    data.cariHesap = cariHesapId ? { connect: { id: cariHesapId } } : { disconnect: true }
    data.depo = depoId ? { connect: { id: depoId } } : { disconnect: true }
    data.fasonTipi = fasonTipiId ? { connect: { id: fasonTipiId } } : { disconnect: true }

    return this.prisma.$transaction(async (tx) => {
      await tx.fatura.update({ where: { id }, data })
      if (Array.isArray(kalemler)) {
        const mevcut = await tx.faturaKalem.findMany({
          where: { faturaId: id },
          select: { id: true, irsaliyeKalemId: true },
        })
        const mevcutById = new Map(mevcut.map((m) => [m.id, m]))
        const gelenIds = new Set<number>()

        for (const k of kalemler) {
          const kalemId = typeof k.id === 'number' ? k.id : null
          if (kalemId) {
            if (!mevcutById.has(kalemId)) {
              throw new BadRequestException(`Fatura kalemi bulunamadı: ${kalemId}`)
            }
            gelenIds.add(kalemId)
          }

          let kalemData: any = { ...k }
          delete kalemData.id
          delete kalemData.fatura
          delete kalemData.malzeme
          delete kalemData.faturaId

          if (k.irsaliyeKalemId) {
            const kaynak = await tx.irsaliyeKalem.findUnique({ where: { id: k.irsaliyeKalemId } })
            if (!kaynak) throw new BadRequestException(`İrsaliye kalemi bulunamadı: ${k.irsaliyeKalemId}`)
            const baskaKullanim = await tx.faturaKalem.findFirst({
              where: { irsaliyeKalemId: k.irsaliyeKalemId, faturaId: { not: id } },
              select: { id: true },
            })
            if (baskaKullanim) throw new BadRequestException('Bu irsaliye kalemi zaten faturaya bağlı')
            kalemData = this.snapshotKalem(kaynak, k)
            const irs = await tx.irsaliye.findUnique({ where: { id: kaynak.irsaliyeId }, select: { id: true, faturaNo: true } })
            if (irs && !irs.faturaNo) {
              const guncelFatura = await tx.fatura.findUnique({ where: { id }, select: { faturaNo: true, faturaTarihi: true } })
              await tx.irsaliye.update({
                where: { id: irs.id },
                data: { faturaNo: guncelFatura?.faturaNo, faturaTarihi: guncelFatura?.faturaTarihi },
              })
            }
          } else {
            kalemData.uuid = kalemData.uuid ?? randomUUID()
          }

          if (kalemId) {
            await tx.faturaKalem.update({ where: { id: kalemId }, data: kalemData as any })
          } else {
            const olusan = await tx.faturaKalem.create({ data: { ...kalemData, faturaId: id } as any })
            gelenIds.add(olusan.id)
          }
        }

        const silinecekler = mevcut.filter((m) => !gelenIds.has(m.id))
        if (silinecekler.length > 0) {
          const silinecekIrsaliyeKalemIds = silinecekler
            .map((m) => m.irsaliyeKalemId)
            .filter((x): x is number => x != null)
          await tx.faturaKalem.deleteMany({ where: { id: { in: silinecekler.map((m) => m.id) } } })
          if (silinecekIrsaliyeKalemIds.length > 0) {
            const etkilenenKalemler = await tx.irsaliyeKalem.findMany({
              where: { id: { in: silinecekIrsaliyeKalemIds } },
              select: { irsaliyeId: true },
            })
            const etkilenenIrsaliyeIds = [...new Set(etkilenenKalemler.map((k) => k.irsaliyeId))]
            for (const irsId of etkilenenIrsaliyeIds) {
              const kalan = await tx.faturaKalem.count({
                where: { faturaId: id, irsaliyeKalem: { irsaliyeId: irsId } },
              })
              if (kalan === 0) {
                await tx.irsaliye.update({
                  where: { id: irsId },
                  data: { faturaNo: null, faturaTarihi: null },
                })
              }
            }
          }
        }
      }
      await this.syncCariHareket(tx, id)
      const kayit = await tx.fatura.findUnique({ where: { id }, include: FATURA_INCLUDE })
      return this.withIrsaliyeler(tx, kayit)
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      // Bağlı irsaliyelerin referansını temizlemeden önce kalem bağlarını topla.
      const bagliKalemler = await tx.faturaKalem.findMany({
        where: { faturaId: id, irsaliyeKalemId: { not: null } },
        select: { irsaliyeKalemId: true },
      })
      const bagliIrsaliyeKalemIds = bagliKalemler.map((k) => k.irsaliyeKalemId as number)
      let bagliIrsaliyeIds: number[] = []
      if (bagliIrsaliyeKalemIds.length > 0) {
        const kalemler = await tx.irsaliyeKalem.findMany({
          where: { id: { in: bagliIrsaliyeKalemIds } },
          select: { irsaliyeId: true },
        })
        bagliIrsaliyeIds = [...new Set(kalemler.map((k) => k.irsaliyeId))]
      }
      await tx.faturaKalem.deleteMany({ where: { faturaId: id } })
      // Sadece otomatik oluşan irsaliyeler silinir (faturaId işaretli).
      const oto = await tx.irsaliye.findMany({ where: { faturaId: id }, select: { id: true } })
      const otoIds = oto.map((o) => o.id)
      if (otoIds.length > 0) {
        await tx.irsaliyeKalem.deleteMany({ where: { irsaliyeId: { in: otoIds } } })
        await tx.irsaliye.deleteMany({ where: { id: { in: otoIds } } })
      }
      // İrsaliyeden oluşan faturalarda bağlı irsaliyelerin fatura referansı temizlenir.
      if (bagliIrsaliyeIds.length > 0) {
        await tx.irsaliye.updateMany({
          where: { id: { in: bagliIrsaliyeIds } },
          data: { faturaNo: null, faturaTarihi: null },
        })
      }
      await tx.muhasebeFis.deleteMany({ where: { kaynakTuru: 'FATURA', kaynakId: id } })
      const fisIds = (await tx.cariHesapHareket.findMany({
        where: { belgeTuru: 'FATURA', belgeId: id },
        select: { fisId: true },
      })).map((h: any) => h.fisId).filter((x: any): x is number => x != null)
      if (fisIds.length > 0) await tx.cariHesapFis.deleteMany({ where: { id: { in: fisIds } } }).catch(() => null)
      await tx.cariHesapHareket.deleteMany({ where: { belgeTuru: 'FATURA', belgeId: id } })
      return tx.fatura.delete({ where: { id } })
    })
  }

  // Fatura kartından bağlanabilir irsaliyeler: otomatik oluşanlar hariç,
  // hiçbir kalemi faturaya bağlı olmayanlar.
  baglanabilirIrsaliyeler(cariHesapId?: number) {
    return this.prisma.irsaliye.findMany({
      where: {
        ...(cariHesapId ? { cariHesapId } : {}),
        faturaId: null,
        kalemler: { none: { faturaKalemleri: { some: {} } } },
      },
      orderBy: [{ irsaliyeTarihi: 'desc' }],
      include: { cariHesap: true, depo: true, kalemler: { include: { malzeme: true } } },
    })
  }

  private dogrulaCariHesap(faturaTipi: string, cariHesapId?: number | null) {
    if (FATURA_CARI_HAREKET_ATLA.has(faturaTipi)) return
    if (!cariHesapId) throw new BadRequestException('Cari hesap seçilmelidir')
  }

  private faturaCariYonu(faturaTipi: string): 'BORC' | 'ALACAK' | null {
    if (FATURA_CARI_HAREKET_ATLA.has(faturaTipi)) return null
    if (FATURA_BORC_TIPLERI.has(faturaTipi)) return 'BORC'
    if (FATURA_ALACAK_TIPLERI.has(faturaTipi)) return 'ALACAK'
    return null
  }

  private async syncCariHareket(tx: any, faturaId: number) {
    const fatura = await tx.fatura.findUnique({
      where: { id: faturaId },
      include: {
        cariHesap: { select: { id: true, kod: true, ad: true, musteriHesapKodu: true, saticiHesapKodu: true } },
        kalemler: { select: { satirTutari: true, kdv: true, kdvDahil: true } },
      },
    })
    if (!fatura) return

    const yon = this.faturaCariYonu(fatura.faturaTipi)
    const mevcutFis = await tx.muhasebeFis.findFirst({
      where: { kaynakTuru: 'FATURA', kaynakId: faturaId },
      select: { id: true },
    })
    // Eski B/CariHesapFis otomatik kaydı varsa temizle
    const eskiHareket = await tx.cariHesapHareket.findFirst({
      where: { belgeTuru: 'FATURA', belgeId: faturaId },
      select: { id: true, fisId: true },
    })
    if (eskiHareket) await this.silOtomatikFis(tx, eskiHareket)

    if (!yon) {
      if (mevcutFis) await tx.muhasebeFis.delete({ where: { id: mevcutFis.id } })
      return
    }

    if (!fatura.cariHesapId) throw new BadRequestException('Cari hesap seçilmelidir')

    const toplam = fatura.kalemler
      .reduce((acc: Prisma.Decimal, k: any) => acc.add(new Prisma.Decimal(Number(k.satirTutari ?? 0))), new Prisma.Decimal(0))
      .toDecimalPlaces(2)

    const kurallar = await tx.muhasebeEntegrasyonTanimi.findMany({ where: { aktif: true } })
    const cariTip = yon === 'BORC' ? 'CARI_BORC' : 'CARI_ALACAK'
    const karsiTip = this.faturaKarsiHesapTipi(fatura.faturaTipi)
    const cariHesapKodu = this.cozEntegrasyonHesapKodu(kurallar, cariTip, fatura.faturaTipi, fatura.depoId, null) ?? this.faturaCariHesapKodu(fatura)

    const kdvGruplari = this.hesaplaKdvGruplari(fatura.kalemler ?? [])
    const toplamKdv = kdvGruplari.reduce((acc, g) => acc.add(g.tutar), new Prisma.Decimal(0)).toDecimalPlaces(2)
    const matrah = toplam.sub(toplamKdv).toDecimalPlaces(2)

    const cariBorc = yon === 'BORC' ? toplam : new Prisma.Decimal(0)
    const cariAlacak = yon === 'ALACAK' ? toplam : new Prisma.Decimal(0)
    const satirlar: any[] = [
      {
        hesapKodu: cariHesapKodu,
        hesapAdi: fatura.cariHesap?.ad ?? null,
        cariHesapId: fatura.cariHesapId,
        ozelKod: null,
        aciklama: fatura.aciklama ?? null,
        vadeTarihi: fatura.sevkTarihi ?? fatura.faturaTarihi ?? null,
        miktar: null,
        belgeNo: fatura.faturaNo ?? null,
        doviz: null,
        dovizKuru: null,
        dovizTutari: null,
        borc: cariBorc,
        alacak: cariAlacak,
      },
    ]

    const karsiHesapKodu = this.cozEntegrasyonHesapKodu(kurallar, karsiTip, fatura.faturaTipi, fatura.depoId, fatura.fasonTipiId ?? null, null) ?? this.faturaKarsiHesapKodu(fatura.faturaTipi)
    satirlar.push({
      hesapKodu: karsiHesapKodu,
      hesapAdi: this.faturaKarsiHesapAdi(fatura.faturaTipi),
      cariHesapId: null,
      ozelKod: null,
      aciklama: fatura.aciklama ?? null,
      vadeTarihi: fatura.faturaTarihi ?? null,
      miktar: null,
      belgeNo: fatura.faturaNo ?? null,
      doviz: null,
      dovizKuru: null,
      dovizTutari: null,
      borc: yon === 'ALACAK' ? matrah : new Prisma.Decimal(0),
      alacak: yon === 'BORC' ? matrah : new Prisma.Decimal(0),
    })

    for (const g of kdvGruplari) {
      if (g.tutar.lte(0)) continue
      const kdvTip = yon === 'ALACAK' ? 'INDIRILECEK_KDV' : 'HESAPLANAN_KDV'
      const kdvHesap = this.cozEntegrasyonHesapKodu(kurallar, kdvTip, fatura.faturaTipi, fatura.depoId, fatura.fasonTipiId ?? null, g.oran) ?? (yon === 'ALACAK' ? '191.00.0000' : '391.00.0000')
      satirlar.push({
        hesapKodu: kdvHesap,
        hesapAdi: yon === 'ALACAK' ? `İndirilecek KDV %${g.oran}` : `Hesaplanan KDV %${g.oran}`,
        cariHesapId: null,
        ozelKod: null,
        aciklama: fatura.aciklama ?? null,
        vadeTarihi: fatura.faturaTarihi ?? null,
        miktar: null,
        belgeNo: fatura.faturaNo ?? null,
        doviz: null,
        dovizKuru: null,
        dovizTutari: null,
        borc: yon === 'ALACAK' ? g.tutar : new Prisma.Decimal(0),
        alacak: yon === 'BORC' ? g.tutar : new Prisma.Decimal(0),
      })
    }

    const fisData = {
      fisTarihi: fatura.faturaTarihi ?? new Date(),
      belgeNo: fatura.faturaNo ?? null,
      k: '0',
      ozelKod: this.faturaOzelKod(fatura.faturaTipi),
      erisimKodu: null,
      aciklama: fatura.aciklama ?? `${fatura.faturaNo ?? ''} nolu faturadan otomatik oluştu`,
      kaynakTuru: 'FATURA',
      kaynakId: faturaId,
      fasonTipiId: fatura.fasonTipiId ?? null,
    }

    if (mevcutFis) {
      await tx.muhasebeFis.update({ where: { id: mevcutFis.id }, data: fisData })
      await tx.muhasebeFisSatir.deleteMany({ where: { fisId: mevcutFis.id } })
      await tx.muhasebeFisSatir.createMany({ data: satirlar.map((s) => ({ ...s, fisId: mevcutFis.id })) })
      return
    }

    for (let deneme = 0; deneme < 5; deneme++) {
      try {
        const son = await tx.muhasebeFis.findFirst({ where: { fisTipi: '1' }, orderBy: { fisNo: 'desc' }, select: { fisNo: true } })
        await tx.muhasebeFis.create({
          data: { fisTipi: '1', fisNo: (son?.fisNo ?? 0) + 1, ...fisData, satirlar: { create: satirlar } },
        })
        return
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
        throw e
      }
    }
    throw new BadRequestException('Otomatik mahsup fiş numarası üretilemedi')
  }

  private async silOtomatikFis(tx: any, hareket: { id: number; fisId: number | null }) {
    if (hareket.fisId) {
      await tx.cariHesapFis.delete({ where: { id: hareket.fisId } }).catch(() => null)
      return
    }
    await tx.cariHesapHareket.delete({ where: { id: hareket.id } }).catch(() => null)
  }

  private faturaOzelKod(faturaTipi: string) {
    if (['1', '22', '7', '9', '92', '11'].includes(faturaTipi)) return 'ALIS'
    if (['122', '124', '133', '139'].includes(faturaTipi)) return 'ALIS_IADE'
    if (['2', '3', '4', '12', '23'].includes(faturaTipi)) return 'SATIS_IADE'
    return 'SATIS'
  }

  private faturaCariHesapKodu(fatura: any) {
    const yon = this.faturaCariYonu(fatura.faturaTipi)
    if (yon === 'BORC') return fatura.cariHesap?.musteriHesapKodu || '120.00.0000'
    return fatura.cariHesap?.saticiHesapKodu || '320.00.0000'
  }

  private faturaKarsiHesapKodu(faturaTipi: string) {
    if (['1', '22', '7', '9', '92', '11'].includes(faturaTipi)) return '153.00.0000'
    if (['122', '124', '133', '139'].includes(faturaTipi)) return '153.00.0000'
    if (['2', '3', '4', '12', '23'].includes(faturaTipi)) return '600.00.0000'
    return '600.00.0000'
  }

  private faturaKarsiHesapAdi(faturaTipi: string) {
    if (['1', '22', '7', '9', '92', '11'].includes(faturaTipi)) return 'Alış/Ticari Mallar'
    if (['122', '124', '133', '139'].includes(faturaTipi)) return 'Alış İade'
    if (['2', '3', '4', '12', '23'].includes(faturaTipi)) return 'Satış İade'
    return 'Satış Geliri'
  }

  private faturaKarsiHesapTipi(faturaTipi: string) {
    if (['1', '22', '7', '9', '92', '11'].includes(faturaTipi)) return 'ALIS_GIDER'
    if (['122', '124', '133', '139'].includes(faturaTipi)) return 'ALIS_IADE'
    if (['2', '3', '4', '12', '23'].includes(faturaTipi)) return 'SATIS_IADE'
    return 'SATIS_GELIR'
  }

  private cozEntegrasyonHesapKodu(
    kurallar: any[],
    hesapTipi: string,
    faturaTipi: string | null,
    depoId: number | null,
    fasonTipiId: number | null,
    kdvOrani: number | null,
  ) {
    const adaylar = kurallar.filter((k) =>
      k.hesapTipi === hesapTipi
      && (k.faturaTipi == null || k.faturaTipi === faturaTipi)
      && (k.depoId == null || k.depoId === depoId)
      && (k.fasonTipiId == null || k.fasonTipiId === fasonTipiId)
      && (k.kdvOrani == null || Number(k.kdvOrani) === Number(kdvOrani)))
    if (!adaylar.length) return null
    const skor = (k: any) => (k.faturaTipi ? 8 : 0) + (k.depoId ? 4 : 0) + (k.fasonTipiId ? 2 : 0) + (k.kdvOrani != null ? 1 : 0)
    adaylar.sort((a, b) => skor(b) - skor(a) || (a.sira ?? 0) - (b.sira ?? 0))
    return adaylar[0].hesapKodu || null
  }

  private hesaplaKdvGruplari(kalemler: any[]) {
    const map = new Map<number, Prisma.Decimal>()
    for (const k of kalemler) {
      const oran = Number(k.kdv ?? 0)
      const satirTutari = new Prisma.Decimal(Number(k.satirTutari ?? 0))
      if (!oran || satirTutari.lte(0)) continue
      const kdvDahil = k.kdvDahil === true
      const kdvTutar = kdvDahil
        ? satirTutari.sub(satirTutari.div(new Prisma.Decimal(1).add(new Prisma.Decimal(oran).div(100))))
        : satirTutari.mul(new Prisma.Decimal(oran).div(100))
      const yuvarli = kdvTutar.toDecimalPlaces(2)
      map.set(oran, (map.get(oran) ?? new Prisma.Decimal(0)).add(yuvarli))
    }
    return Array.from(map.entries()).map(([oran, tutar]) => ({ oran, tutar: tutar.toDecimalPlaces(2) }))
  }
}
