import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRenkDto } from './dto/create-renk.dto'
import { UpdateRenkDto } from './dto/update-renk.dto'

@Injectable()
export class RenkService {
  constructor(private prisma: PrismaService) {}

  private selectWithCari = {
    id: true,
    kod: true,
    ad: true,
    tip: true,
    aciklama: true,
    renk: true,
    cariKodu: true,
    talepTarihi: true,
    okeyTarihi: true,
    fiyat: true,
    dovizCinsi: true,
    kullanimda: true,
    tarih: true,
    ozelKod: true,
    pantoneNo: true,
    renkTuru: true,
    parentRenkId: true,
    createdAt: true,
    updatedAt: true,
    cariHesap: { select: { ad: true } },
    parentRenk: { select: { kod: true, ad: true } },
  }

  private formatResult(renk: any) {
    const { cariHesap, parentRenk, ...rest } = renk
    return {
      ...rest,
      cariAdi: cariHesap?.ad ?? null,
      parentRenkAdi: parentRenk?.ad ?? null,
    }
  }

  async findAll(tip?: number) {
    const list = await this.prisma.renk.findMany({
      where: tip != null ? { tip } : undefined,
      select: this.selectWithCari,
      orderBy: { kod: 'asc' },
    })
    return list.map(this.formatResult)
  }

  async findOne(id: number) {
    const renk = await this.prisma.renk.findUnique({ where: { id }, select: this.selectWithCari })
    if (!renk) throw new NotFoundException('Renk bulunamadı')
    return this.formatResult(renk)
  }

  async findByKod(kod: string) {
    const renk = await this.prisma.renk.findUnique({ where: { kod }, select: this.selectWithCari })
    if (!renk) throw new NotFoundException('Renk bulunamadı')
    return this.formatResult(renk)
  }

  create(dto: CreateRenkDto) {
    return this.prisma.renk.create({
      data: {
        ...dto,
        talepTarihi: dto.talepTarihi ? new Date(dto.talepTarihi) : null,
        okeyTarihi: dto.okeyTarihi ? new Date(dto.okeyTarihi) : null,
        tarih: dto.tarih ? new Date(dto.tarih) : null,
      },
    })
  }

  async update(id: number, dto: UpdateRenkDto) {
    await this.findOne(id)
    return this.prisma.renk.update({
      where: { id },
      data: {
        ...dto,
        talepTarihi: dto.talepTarihi ? new Date(dto.talepTarihi) : dto.talepTarihi === null ? null : undefined,
        okeyTarihi: dto.okeyTarihi ? new Date(dto.okeyTarihi) : dto.okeyTarihi === null ? null : undefined,
        tarih: dto.tarih ? new Date(dto.tarih) : dto.tarih === null ? null : undefined,
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.renk.delete({ where: { id } })
  }
}