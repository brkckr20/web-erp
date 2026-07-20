import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateKaliteKontrolDto, UpdateKaliteKontrolDto } from './dto/create-kalite-kontrol.dto'

function padBarkod(n: number, length: number): string {
  return n.toString().padStart(length, '0')
}

@Injectable()
export class KaliteKontrolService {
  constructor(private prisma: PrismaService) {}

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

  findAll() {
    return this.prisma.kaliteKontrol.findMany({
      orderBy: { fisNo: 'desc' },
      include: { cariHesap: true, depo: true },
    })
  }

  async findOne(id: number) {
    const fis = await this.prisma.kaliteKontrol.findUnique({
      where: { id },
      include: {
        cariHesap: true,
        depo: true,
        isEmri: true,
        kalemler: { include: { malzeme: true, hatalar: true } },
      },
    })
    if (!fis) throw new NotFoundException('Fiş bulunamadı')
    const result: any = { ...fis }
    result.siparisNo = fis.isEmri?.siparisNo ?? null
    return result
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
        for (const k of kalemler) {
          const { hatalar: hataArr, id: _id, malzeme, fis: _fis, ...kalemData } = k as any
          const kalem = await tx.kaliteKontrolKalem.create({
            data: { ...kalemData, fisId: fis.id } as any,
          })
          if (Array.isArray(hataArr) && hataArr.length > 0) {
            for (const h of hataArr) {
              await tx.kaliteKontrolHata.create({
                data: { ...h, kalemId: kalem.id },
              })
            }
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
        const existingKalemIds = await tx.kaliteKontrolKalem.findMany({
          where: { fisId: id },
          select: { id: true },
        })
        if (existingKalemIds.length > 0) {
          await tx.kaliteKontrolHata.deleteMany({
            where: { kalemId: { in: existingKalemIds.map((k) => k.id) } },
          })
        }
        await tx.kaliteKontrolKalem.deleteMany({ where: { fisId: id } })
        for (const k of kalemler) {
          const { hatalar: hataArr, id: _id, malzeme, fis: _fis, ...kalemData } = k as any
          const kalem = await tx.kaliteKontrolKalem.create({
            data: { ...kalemData, fisId: id } as any,
          })
          if (Array.isArray(hataArr) && hataArr.length > 0) {
            for (const h of hataArr) {
              await tx.kaliteKontrolHata.create({
                data: { ...h, kalemId: kalem.id },
              })
            }
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
