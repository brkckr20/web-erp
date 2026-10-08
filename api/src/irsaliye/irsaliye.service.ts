import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { UpdateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { CreateIrsaliyeKalemDto } from './dto/create-irsaliye.dto'

function padIrsaliyeNo(n: number): string {
  return n.toString().padStart(8, '0')
}

// Fason fire'ı kalemin ölçü birimine göre brüt − net'ten hesaplanır (Decimal(18,4)).
// İstemciden gelen fire değeri yok sayılır; fire her kayıtta yeniden yazılır.
// kg tarafı brut_agirlik − net_agirlik, mt tarafı brut_metre − net_metre.
// Adet (veya ölçü birimi boş) ölçüsünde fire tutulmaz -> null.
// Giden (brüt) kalemde fire anlamsızdır: henüz dönen mal yoktur, fire ancak
// fason GİRİŞ kaleminde (11) net girildiğinde oluşur -> net yoksa null.
function fireHesapla(k: any): Prisma.Decimal | null {
  const birim = String(k.olcuBirimi ?? '').toLowerCase()
  let brut: any
  let net: any
  if (birim === 'brutkg' || birim === 'kg') {
    brut = k.brutAgirlik
    net = k.netAgirlik
  } else if (birim === 'brutmt' || birim === 'mt') {
    brut = k.brutMetre
    net = k.netMetre
  } else {
    return null
  }
  // Net miktar girilmemişse fire hesaplanamaz (giden kalem, taslak fiş vb.)
  if (net == null || net === '' || net === 0) return null
  if (brut == null || brut === '') return null
  return new Prisma.Decimal(brut).minus(new Prisma.Decimal(net))
}

// Kalem verisini yazmaya hazırlar: ilişki alanlarını temizler, fire'ı hesaplar.
function kalemDataHazirla(k: any): any {
  const { id: _id, malzeme: _malzeme, irsaliye: _irsaliye, fire: _fire, tahsisler: _tahsisler, islemler: _islemler, prosesler: _prosesler, ...rest } = k
  return { ...rest, fire: fireHesapla(k) }
}

const kalemInclude = {
  malzeme: true,
  varyant1Renk: true,
  varyant2Renk: true,
  boyahaneRenk: true,
  tahsisler: true,
  islemler: { include: { islem: true } },
}

// Kalem satırına seçilen prosesleri yazar (aynı transaction içinde).
// Silinmiş kartların id'leri atlanır (bayat seçim FK patlatmasın).
async function islemleriYaz(tx: any, irsaliyeKalemId: number, prosesler: { islemId: number; sira?: number }[] | undefined) {
  if (!Array.isArray(prosesler) || prosesler.length === 0) return
  const adaylar = [...new Set(prosesler.map((p) => Number(p?.islemId)).filter((n) => Number.isFinite(n) && n > 0))]
  if (adaylar.length === 0) return
  const mevcutKartlar = await tx.islem.findMany({ where: { id: { in: adaylar } }, select: { id: true } })
  const gecerli = new Set((mevcutKartlar as { id: number }[]).map((r) => r.id))
  const gorulen = new Set<number>()
  let sira = 0
  for (const p of prosesler) {
    const islemId = Number(p?.islemId)
    if (!gecerli.has(islemId) || gorulen.has(islemId)) continue
    gorulen.add(islemId)
    sira += 1
    await tx.irsaliyeKalemIslem.create({ data: { irsaliyeKalemId, islemId, sira: p?.sira ?? sira } })
  }
}

// Kalem satırına bağlı tahsis dağılımını yazar (aynı transaction içinde).
async function tahsisleriYaz(tx: any, irsaliyeKalemId: number, tahsisler: any[] | undefined) {
  if (!Array.isArray(tahsisler) || tahsisler.length === 0) return
  for (const t of tahsisler) {
    const miktar = Number(t.miktar) || 0
    if (!miktar) continue
    await tx.irsaliyeKalemTahsis.create({
      data: {
        irsaliyeKalemId,
        siparisKalemId: t.siparisKalemId ?? null,
        siparisNo: t.siparisNo ?? null,
        modelKod: t.modelKod ?? null,
        miktar: new Prisma.Decimal(miktar),
      },
    })
  }
}

@Injectable()
export class IrsaliyeService {
  constructor(private prisma: PrismaService) {}

  async nextIrsaliyeNo(irsaliyeTipi: string): Promise<{ irsaliyeNo: string }> {
    const last = await this.prisma.irsaliye.findFirst({
      where: { irsaliyeTipi },
      orderBy: { irsaliyeNo: 'desc' },
      select: { irsaliyeNo: true },
    })
    let next = 1
    if (last?.irsaliyeNo) {
      const parsed = parseInt(last.irsaliyeNo, 10)
      if (!isNaN(parsed)) next = parsed + 1
    }
    return { irsaliyeNo: padIrsaliyeNo(next) }
  }

  findAll(irsaliyeTipi?: string) {
    const where: any = {}
    if (irsaliyeTipi) {
      const tipler = irsaliyeTipi.split(',').map((t) => t.trim())
      where.irsaliyeTipi = { in: tipler }
    }
    return this.prisma.irsaliye.findMany({
      where,
      orderBy: [{ irsaliyeTipi: 'asc' }, { irsaliyeNo: 'desc' }],
      include: {
        cariHesap: true,
        depo: true,
        fasonTipi: true,
        kalemler: { include: kalemInclude },
      },
    })
  }

  async findOne(id: number) {
    const irsaliye = await this.prisma.irsaliye.findUnique({
      where: { id },
      include: {
        cariHesap: true,
        depo: true,
        fasonTipi: true,
        kalemler: { include: kalemInclude },
      },
    })
    if (!irsaliye) throw new NotFoundException('İrsaliye bulunamadı')
    return irsaliye
  }

  async create(dto: CreateIrsaliyeDto) {
    const data: any = { ...dto }
    if (dto.irsaliyeTarihi) data.irsaliyeTarihi = new Date(dto.irsaliyeTarihi)
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.terminTarihi) data.terminTarihi = new Date(dto.terminTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    delete data.kalemler

    return this.prisma.$transaction(async (tx) => {
      const irsaliye = await tx.irsaliye.create({ data })
      if (dto.kalemler && dto.kalemler.length > 0) {
        for (const k of dto.kalemler) {
          const kalemData = kalemDataHazirla(k)
          const kalem = await tx.irsaliyeKalem.create({
            data: { ...kalemData, irsaliyeId: irsaliye.id, uuid: kalemData.uuid ?? randomUUID() } as any,
          })
          await tahsisleriYaz(tx, kalem.id, (k as any).tahsisler)
          await islemleriYaz(tx, kalem.id, (k as any).prosesler)
        }
      }
      return tx.irsaliye.findUnique({
        where: { id: irsaliye.id },
        include: {
          cariHesap: true,
          depo: true,
          fasonTipi: true,
          kalemler: { include: kalemInclude },
        },
      })
    })
  }

  async update(id: number, dto: UpdateIrsaliyeDto) {
    await this.findOne(id)
    const data: any = { ...dto }
    if (dto.irsaliyeTarihi) data.irsaliyeTarihi = new Date(dto.irsaliyeTarihi)
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.terminTarihi) data.terminTarihi = new Date(dto.terminTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    const kalemler = (dto as any).kalemler
    delete data.kalemler

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
      await tx.irsaliye.update({ where: { id }, data })
      if (Array.isArray(kalemler)) {
        await tx.irsaliyeKalem.deleteMany({ where: { irsaliyeId: id } })
        for (const k of kalemler) {
          const kalemData = kalemDataHazirla(k)
          const kalem = await tx.irsaliyeKalem.create({
            data: { ...kalemData, irsaliyeId: id, uuid: kalemData.uuid ?? randomUUID() } as any,
          })
          await tahsisleriYaz(tx, kalem.id, (k as any).tahsisler)
          await islemleriYaz(tx, kalem.id, (k as any).prosesler)
        }
      }
      return tx.irsaliye.findUnique({
        where: { id },
        include: {
          cariHesap: true,
          depo: true,
          fasonTipi: true,
          kalemler: { include: kalemInclude },
        },
      })
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      await tx.irsaliyeKalem.deleteMany({ where: { irsaliyeId: id } })
      return tx.irsaliye.delete({ where: { id } })
    })
  }

  findKalemler(irsaliyeId: number) {
    return this.prisma.irsaliyeKalem.findMany({
      where: { irsaliyeId },
      include: { malzeme: true },
    })
  }

  async createKalem(dto: CreateIrsaliyeKalemDto) {
    return this.prisma.$transaction(async (tx) => {
      const kalem = await tx.irsaliyeKalem.create({ data: kalemDataHazirla(dto) as any })
      await islemleriYaz(tx, kalem.id, (dto as any).prosesler)
      return kalem
    })
  }

  async updateKalem(id: number, dto: CreateIrsaliyeKalemDto) {
    return this.prisma.$transaction(async (tx) => {
      const kalem = await tx.irsaliyeKalem.update({ where: { id }, data: kalemDataHazirla(dto) as any })
      if (Array.isArray((dto as any).prosesler)) {
        await tx.irsaliyeKalemIslem.deleteMany({ where: { irsaliyeKalemId: id } })
        await islemleriYaz(tx, id, (dto as any).prosesler)
      }
      return kalem
    })
  }

  async removeKalem(id: number) {
    return this.prisma.irsaliyeKalem.delete({ where: { id } })
  }
}
