import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRotaDto, RotaOperasyonDto } from './dto/create-rota.dto'
import { UpdateRotaDto } from './dto/update-rota.dto'

const operasyonInclude = {
  operasyonlar: { orderBy: { sira: 'asc' as const } },
}

function toJson(row: any) {
  return {
    ...row,
    operasyonlar: (row.operasyonlar ?? []).map((o: any) => ({
      ...o,
      birimFiyat: o.birimFiyat == null ? null : Number(o.birimFiyat),
    })),
  }
}

function mapOperasyonlar(list?: RotaOperasyonDto[]) {
  return (list ?? []).map((o) => ({
    sira: o.sira ?? 0,
    operasyonKodu: (o.operasyonKodu ?? '').trim(),
    operasyonAdi: o.operasyonAdi?.trim() ? o.operasyonAdi.trim() : null,
    varsayilanYer: o.varsayilanYer?.trim() ? o.varsayilanYer.trim() : null,
    birim: o.birim?.trim() ? o.birim.trim() : null,
    birimFiyat: o.birimFiyat ?? null,
  }))
}

@Injectable()
export class RotaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.rota.findMany({ include: operasyonInclude, orderBy: { kod: 'asc' } })
    return rows.map(toJson)
  }

  async findOne(id: number) {
    const row = await this.prisma.rota.findUnique({ where: { id }, include: operasyonInclude })
    if (!row) throw new NotFoundException('Rota bulunamadı')
    return toJson(row)
  }

  async findByKod(kod: string) {
    const row = await this.prisma.rota.findUnique({
      where: { kod: kod.trim() },
      include: operasyonInclude,
    })
    if (!row) throw new NotFoundException('Rota bulunamadı')
    return toJson(row)
  }

  async create(dto: CreateRotaDto) {
    const kod = (dto.kod ?? '').trim()
    if (!kod) throw new ConflictException('Kod gerekli')
    const mevcut = await this.prisma.rota.findUnique({ where: { kod } })
    if (mevcut) throw new ConflictException(`Bu kod zaten kullanılıyor: ${kod}`)
    const row = await this.prisma.rota.create({
      data: {
        kod,
        ad: (dto.ad ?? '').trim(),
        ozelKod: dto.ozelKod?.trim() ? dto.ozelKod.trim() : null,
        hizmetKodu: dto.hizmetKodu?.trim() ? dto.hizmetKodu.trim() : null,
        kullanimda: dto.kullanimda ?? true,
        operasyonlar: { create: mapOperasyonlar(dto.operasyonlar) },
      },
      include: operasyonInclude,
    })
    return toJson(row)
  }

  async update(id: number, dto: UpdateRotaDto) {
    await this.findOne(id)
    const kod = (dto.kod ?? '').trim()
    if (kod) {
      const cakisan = await this.prisma.rota.findUnique({ where: { kod } })
      if (cakisan && cakisan.id !== id) throw new ConflictException(`Bu kod zaten kullanılıyor: ${kod}`)
    }
    await this.prisma.rotaOperasyon.deleteMany({ where: { rotaId: id } })
    const row = await this.prisma.rota.update({
      where: { id },
      data: {
        ...(kod ? { kod } : {}),
        ...(dto.ad !== undefined ? { ad: dto.ad.trim() } : {}),
        ...(dto.ozelKod !== undefined ? { ozelKod: dto.ozelKod?.trim() ? dto.ozelKod.trim() : null } : {}),
        ...(dto.hizmetKodu !== undefined ? { hizmetKodu: dto.hizmetKodu?.trim() ? dto.hizmetKodu.trim() : null } : {}),
        ...(dto.kullanimda !== undefined ? { kullanimda: dto.kullanimda } : {}),
        operasyonlar: { create: mapOperasyonlar(dto.operasyonlar) },
      },
      include: operasyonInclude,
    })
    return toJson(row)
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.rota.delete({ where: { id } })
  }
}
