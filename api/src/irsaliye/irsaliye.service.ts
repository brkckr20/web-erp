import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { UpdateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { CreateIrsaliyeKalemDto } from './dto/create-irsaliye.dto'

function padIrsaliyeNo(n: number): string {
  return n.toString().padStart(8, '0')
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

  findAll() {
    return this.prisma.irsaliye.findMany({
      orderBy: [{ irsaliyeTipi: 'asc' }, { irsaliyeNo: 'desc' }],
      include: { cariHesap: true, depo: true, fasonTipi: true, kalemler: { include: { malzeme: true } } },
    })
  }

  async findOne(id: number) {
    const irsaliye = await this.prisma.irsaliye.findUnique({
      where: { id },
      include: { cariHesap: true, depo: true, fasonTipi: true, kalemler: { include: { malzeme: true } } },
    })
    if (!irsaliye) throw new NotFoundException('İrsaliye bulunamadı')
    return irsaliye
  }

  async create(dto: CreateIrsaliyeDto) {
    const data: any = { ...dto }
    if (dto.irsaliyeTarihi) data.irsaliyeTarihi = new Date(dto.irsaliyeTarihi)
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    delete data.kalemler

    return this.prisma.$transaction(async (tx) => {
      const irsaliye = await tx.irsaliye.create({ data })
      if (dto.kalemler && dto.kalemler.length > 0) {
        for (const k of dto.kalemler) {
          const { id: _id, malzeme: _malzeme, irsaliye: _irsaliye, ...kalemData } = k as any
          await tx.irsaliyeKalem.create({
            data: { ...kalemData, irsaliyeId: irsaliye.id, uuid: kalemData.uuid ?? randomUUID() } as any,
          })
        }
      }
      return tx.irsaliye.findUnique({
        where: { id: irsaliye.id },
        include: { cariHesap: true, depo: true, fasonTipi: true, kalemler: { include: { malzeme: true } } },
      })
    })
  }

  async update(id: number, dto: UpdateIrsaliyeDto) {
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
      await tx.irsaliye.update({ where: { id }, data })
      if (Array.isArray(kalemler)) {
        await tx.irsaliyeKalem.deleteMany({ where: { irsaliyeId: id } })
        for (const k of kalemler) {
          const { id: _id, malzeme: _malzeme, irsaliye: _irsaliye, ...kalemData } = k as any
          await tx.irsaliyeKalem.create({
            data: { ...kalemData, irsaliyeId: id, uuid: kalemData.uuid ?? randomUUID() } as any,
          })
        }
      }
      return tx.irsaliye.findUnique({
        where: { id },
        include: { cariHesap: true, depo: true, fasonTipi: true, kalemler: { include: { malzeme: true } } },
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
    return this.prisma.irsaliyeKalem.create({ data: { ...dto } as any })
  }

  async updateKalem(id: number, dto: CreateIrsaliyeKalemDto) {
    return this.prisma.irsaliyeKalem.update({ where: { id }, data: { ...dto } as any })
  }

  async removeKalem(id: number) {
    return this.prisma.irsaliyeKalem.delete({ where: { id } })
  }
}
