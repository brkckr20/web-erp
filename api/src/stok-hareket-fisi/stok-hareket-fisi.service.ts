import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { CreateStokHareketFisiDto } from './dto/create-stok-hareket-fisi.dto'
import { UpdateStokHareketFisiDto } from './dto/create-stok-hareket-fisi.dto'
import { CreateStokHareketFisiKalemDto } from './dto/create-stok-hareket-fisi-kalem.dto'
import { UpdateStokHareketFisiKalemDto } from './dto/create-stok-hareket-fisi-kalem.dto'

function padFisNo(n: number): string {
  return n.toString().padStart(8, '0')
}

@Injectable()
export class StokHareketFisiService {
  constructor(private prisma: PrismaService) {}

  async nextFisNo(fisTipi: string): Promise<{ fisNo: string }> {
    const last = await this.prisma.stokHareketFisi.findFirst({
      where: { fisTipi },
      orderBy: { fisNo: 'desc' },
      select: { fisNo: true },
    })
    let next = 1
    if (last?.fisNo) {
      const parsed = parseInt(last.fisNo, 10)
      if (!isNaN(parsed)) next = parsed + 1
    }
    return { fisNo: padFisNo(next) }
  }

  findAll() {
    return this.prisma.stokHareketFisi.findMany({
      orderBy: [{ fisTipi: 'asc' }, { fisNo: 'desc' }],
      include: { cariHesap: true, depo: true, kalemler: true },
    })
  }

  async findOne(id: number) {
    const fis = await this.prisma.stokHareketFisi.findUnique({
      where: { id },
      include: { cariHesap: true, depo: true, kalemler: { include: { malzeme: true } } },
    })
    if (!fis) throw new NotFoundException('Fiş bulunamadı')
    return fis
  }

  async findByFisNo(fisNo: string) {
    const fis = await this.prisma.stokHareketFisi.findFirst({
      where: { fisNo },
      include: { cariHesap: true, depo: true, kalemler: true },
    })
    if (!fis) throw new NotFoundException('Fiş bulunamadı')
    return fis
  }

  async create(dto: CreateStokHareketFisiDto) {
    const data: any = { ...dto }
    if (dto.fisTarihi) data.fisTarihi = new Date(dto.fisTarihi)
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.vadeTarihi) data.vadeTarihi = new Date(dto.vadeTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    delete data.kalemler

    return this.prisma.$transaction(async (tx) => {
      const fis = await tx.stokHareketFisi.create({ data })
      if (dto.kalemler && dto.kalemler.length > 0) {
        for (const k of dto.kalemler) {
          const { id: _id, malzeme, fis: _fis, ...kalemData } = k as any
          await tx.stokHareketFisiKalem.create({
            data: { ...kalemData, fisId: fis.id, uuid: kalemData.uuid ?? randomUUID() } as any,
          })
        }
      }
      return tx.stokHareketFisi.findUnique({
        where: { id: fis.id },
      include: { cariHesap: true, depo: true, kalemler: { include: { malzeme: true } } },
      })
    })
  }

  async update(id: number, dto: UpdateStokHareketFisiDto) {
    await this.findOne(id)
    const data: any = { ...dto }
    if (dto.fisTarihi) data.fisTarihi = new Date(dto.fisTarihi)
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.vadeTarihi) data.vadeTarihi = new Date(dto.vadeTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    const kalemler = (dto as any).kalemler
    delete data.kalemler
    return this.prisma.$transaction(async (tx) => {
      await tx.stokHareketFisi.update({ where: { id }, data })
      if (Array.isArray(kalemler)) {
        await tx.stokHareketFisiKalem.deleteMany({ where: { fisId: id } })
        for (const k of kalemler) {
          const { id: _id, malzeme, fis: _fis, ...kalemData } = k as any
          await tx.stokHareketFisiKalem.create({
            data: { ...kalemData, fisId: id, uuid: kalemData.uuid ?? randomUUID() } as any,
          })
        }
      }
      return tx.stokHareketFisi.findUnique({
        where: { id },
        include: { cariHesap: true, depo: true, kalemler: { include: { malzeme: true } } },
      })
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      await tx.stokHareketFisiKalem.deleteMany({ where: { fisId: id } })
      return tx.stokHareketFisi.delete({ where: { id } })
    })
  }

  findKalemler(fisId: number) {
    return this.prisma.stokHareketFisiKalem.findMany({
      where: { fisId },
      include: { malzeme: true },
    })
  }

  async createKalem(dto: CreateStokHareketFisiKalemDto) {
    return this.prisma.stokHareketFisiKalem.create({ data: { ...dto } as any })
  }

  async updateKalem(id: number, dto: UpdateStokHareketFisiKalemDto) {
    return this.prisma.stokHareketFisiKalem.update({ where: { id }, data: { ...dto } as any })
  }

  async removeKalem(id: number) {
    return this.prisma.stokHareketFisiKalem.delete({ where: { id } })
  }
}
