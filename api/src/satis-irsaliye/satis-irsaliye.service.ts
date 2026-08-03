import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSatisIrsaliyeDto } from './dto/create-satis-irsaliye.dto'
import { UpdateSatisIrsaliyeDto } from './dto/create-satis-irsaliye.dto'
import { CreateSatisIrsaliyeKalemDto } from './dto/create-satis-irsaliye.dto'

function padIrsaliyeNo(n: number): string {
  return n.toString().padStart(8, '0')
}

@Injectable()
export class SatisIrsaliyeService {
  constructor(private prisma: PrismaService) {}

  async nextIrsaliyeNo(irsaliyeTipi: string): Promise<{ irsaliyeNo: string }> {
    const last = await this.prisma.satisIrsaliye.findFirst({
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

  findAll() {
    return this.prisma.satisIrsaliye.findMany({
      orderBy: [{ irsaliyeTipi: 'asc' }, { irsaliyeNo: 'desc' }],
      include: { cariHesap: true, depo: true, fasonTipi: true, kalemler: true },
    })
  }

  async findOne(id: number) {
    const irsaliye = await this.prisma.satisIrsaliye.findUnique({
      where: { id },
      include: { cariHesap: true, depo: true, fasonTipi: true, kalemler: { include: { malzeme: true } } },
    })
    if (!irsaliye) throw new NotFoundException('İrsaliye bulunamadı')
    return irsaliye
  }

  async create(dto: CreateSatisIrsaliyeDto) {
    const data: any = { ...dto }
    if (dto.irsaliyeTarihi) data.irsaliyeTarihi = new Date(dto.irsaliyeTarihi)
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    delete data.kalemler

    return this.prisma.$transaction(async (tx) => {
      const irsaliye = await tx.satisIrsaliye.create({ data })
      if (dto.kalemler && dto.kalemler.length > 0) {
        for (const k of dto.kalemler) {
          const { id: _id, malzeme: _malzeme, irsaliye: _irsaliye, ...kalemData } = k as any
          await tx.satisIrsaliyeKalem.create({
            data: { ...kalemData, irsaliyeId: irsaliye.id, uuid: kalemData.uuid ?? randomUUID() } as any,
          })
        }
      }
      return tx.satisIrsaliye.findUnique({
        where: { id: irsaliye.id },
        include: { cariHesap: true, depo: true, fasonTipi: true, kalemler: { include: { malzeme: true } } },
      })
    })
  }

  async update(id: number, dto: UpdateSatisIrsaliyeDto) {
    await this.findOne(id)
    const data: any = { ...dto }
    if (dto.irsaliyeTarihi) data.irsaliyeTarihi = new Date(dto.irsaliyeTarihi)
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    const kalemler = (dto as any).kalemler
    delete data.kalemler
    return this.prisma.$transaction(async (tx) => {
      await tx.satisIrsaliye.update({ where: { id }, data })
      if (Array.isArray(kalemler)) {
        await tx.satisIrsaliyeKalem.deleteMany({ where: { irsaliyeId: id } })
        for (const k of kalemler) {
          const { id: _id, malzeme: _malzeme, irsaliye: _irsaliye, ...kalemData } = k as any
          await tx.satisIrsaliyeKalem.create({
            data: { ...kalemData, irsaliyeId: id, uuid: kalemData.uuid ?? randomUUID() } as any,
          })
        }
      }
      return tx.satisIrsaliye.findUnique({
        where: { id },
        include: { cariHesap: true, depo: true, fasonTipi: true, kalemler: { include: { malzeme: true } } },
      })
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      await tx.satisIrsaliyeKalem.deleteMany({ where: { irsaliyeId: id } })
      return tx.satisIrsaliye.delete({ where: { id } })
    })
  }

  findKalemler(irsaliyeId: number) {
    return this.prisma.satisIrsaliyeKalem.findMany({
      where: { irsaliyeId },
      include: { malzeme: true },
    })
  }

  async createKalem(dto: CreateSatisIrsaliyeKalemDto) {
    return this.prisma.satisIrsaliyeKalem.create({ data: { ...dto } as any })
  }

  async updateKalem(id: number, dto: CreateSatisIrsaliyeKalemDto) {
    return this.prisma.satisIrsaliyeKalem.update({ where: { id }, data: { ...dto } as any })
  }

  async removeKalem(id: number) {
    return this.prisma.satisIrsaliyeKalem.delete({ where: { id } })
  }
}
