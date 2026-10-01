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
      //    Ayrım: irsaliyeNo boş, faturaNo dolu. Stoku oynatan taraf bu irsaliyedir.
      const baglantiVar = irsaliyeIds.length > 0 || kalemler.some((k) => k.irsaliyeKalemId)
      if (!baglantiVar && kalemler.length > 0) {
        const otoKalemler = kalemler.map((k: any) => {
          const { id: _id, irsaliyeKalemId: _ik, faturaId: _f, uuid: _u, malzeme: _m, ...rest } = k
          return { ...rest, uuid: randomUUID() }
        })
        await tx.irsaliye.create({
          data: {
            irsaliyeNo: null,
            irsaliyeTipi: fatura.faturaTipi,
            irsaliyeTarihi: fatura.faturaTarihi,
            faturaNo: fatura.faturaNo,
            faturaTarihi: fatura.faturaTarihi,
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
    const fatura = await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      await tx.faturaKalem.deleteMany({ where: { faturaId: id } })
      // Sadece otomatik oluşan irsaliyeler silinir (irsaliyeNo boş + bu faturanın nosu).
      await tx.irsaliyeKalem.deleteMany({
        where: { irsaliye: { irsaliyeNo: null, faturaNo: fatura.faturaNo } },
      })
      await tx.irsaliye.deleteMany({
        where: { irsaliyeNo: null, faturaNo: fatura.faturaNo },
      })
      // İrsaliyeden oluşan faturalarda bağlı irsaliyelerin fatura referansı temizlenir.
      await tx.irsaliye.updateMany({
        where: { faturaNo: fatura.faturaNo, irsaliyeNo: { not: null } },
        data: { faturaNo: null, faturaTarihi: null },
      })
      return tx.fatura.delete({ where: { id } })
    })
  }

  // Fatura kartından bağlanabilir irsaliyeler: hiçbir kalemi faturaya bağlı olmayanlar.
  baglanabilirIrsaliyeler(cariHesapId?: number) {
    return this.prisma.irsaliye.findMany({
      where: {
        ...(cariHesapId ? { cariHesapId } : {}),
        kalemler: { none: { faturaKalemleri: { some: {} } } },
      },
      orderBy: [{ irsaliyeTarihi: 'desc' }],
      include: { cariHesap: true, depo: true, kalemler: { include: { malzeme: true } } },
    })
  }
}
