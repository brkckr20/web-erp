import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMakinaDto } from './dto/create-makina.dto'
import { UpdateMakinaDto } from './dto/update-makina.dto'

type MakinaData = CreateMakinaDto | UpdateMakinaDto

@Injectable()
export class MakinaService {
  constructor(private prisma: PrismaService) {}

  private normalize(dto: MakinaData) {
    const dateKeys = ['alimTarihi', 'garantiBitis', 'sonBakimTarihi'] as const
    const data: Record<string, unknown> = { ...dto }
    for (const key of dateKeys) {
      const val = data[key]
      if (val === undefined) continue
      data[key] = val ? new Date(val as string) : null
    }
    return data
  }

  findAll() {
    return this.prisma.makina.findMany({ orderBy: { kod: 'asc' } })
  }

  async findOne(id: number) {
    const m = await this.prisma.makina.findUnique({ where: { id } })
    if (!m) throw new NotFoundException('Makina bulunamadı')
    return m
  }

  async findByKod(kod: string) {
    const m = await this.prisma.makina.findUnique({ where: { kod } })
    if (!m) throw new NotFoundException('Makina bulunamadı')
    return m
  }

  create(dto: CreateMakinaDto) {
    return this.prisma.makina.create({ data: this.normalize(dto) as never })
  }

  async update(id: number, dto: UpdateMakinaDto) {
    await this.findOne(id)
    return this.prisma.makina.update({ where: { id }, data: this.normalize(dto) as never })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.makina.delete({ where: { id } })
  }
}
