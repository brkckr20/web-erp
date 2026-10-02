import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFaturaDto } from './dto/create-fatura.dto'
import { UpdateFaturaDto } from './dto/create-fatura.dto'

function padNo(n: number): string {
  return n.toString().padStart(8, '0')
}

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
    return fatura
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
  private snapshotKalem(kaynak: any, fiyatOverride?: any) {
    const { id: _id, irsaliyeId: _irsaliyeId, irsaliye: _irsaliye, malzeme: _malzeme, varyant1Renk: _v1, varyant2Renk: _v2, boyahaneRenk: _br, faturaKalemleri: _fk, createdAt: _c, updatedAt: _u, fire: _fire, ...miktar } = kaynak
    return {
      ...miktar,
      irsaliyeKalemId: kaynak.id,
      birimFiyat: fiyatOverride?.birimFiyat ?? kaynak.birimFiyat,
      doviz: fiyatOverride?.doviz ?? kaynak.doviz,
      kdv: fiyatOverride?.kdv ?? kaynak.kdv,
      satirTutari: fiyatOverride?.satirTutari ?? kaynak.satirTutari,
      uuid: randomUUID(),
    }
  }

  async create(dto: CreateFaturaDto) {
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
            kalemler: { create: otoKalemler as any },
          } as any,
        })
      }

      return tx.fatura.findUnique({ where: { id: fatura.id }, include: FATURA_INCLUDE })
    })
  }

  async update(id: number, dto: UpdateFaturaDto) {
    await this.findOne(id)
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
        await tx.faturaKalem.deleteMany({ where: { faturaId: id } })
        for (const k of kalemler) {
          let kalemData: any = { ...k }
          delete kalemData.id
          delete kalemData.fatura
          delete kalemData.malzeme
          if (k.irsaliyeKalemId) {
            const kaynak = await tx.irsaliyeKalem.findUnique({ where: { id: k.irsaliyeKalemId } })
            if (!kaynak) throw new BadRequestException(`İrsaliye kalemi bulunamadı: ${k.irsaliyeKalemId}`)
            kalemData = this.snapshotKalem(kaynak, k)
          } else {
            kalemData.uuid = kalemData.uuid ?? randomUUID()
          }
          await tx.faturaKalem.create({ data: { ...kalemData, faturaId: id } as any })
        }
      }
      return tx.fatura.findUnique({ where: { id }, include: FATURA_INCLUDE })
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
}
