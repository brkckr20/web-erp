import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateKumasGrupDto } from './dto/create-kumas-grup.dto'
import { UpdateKumasGrupDto } from './dto/update-kumas-grup.dto'

@Injectable()
export class KumasGrupService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.kumasGrup.findMany({
      orderBy: { kod: 'asc' },
    })
  }

  async findOne(id: number) {
    const g = await this.prisma.kumasGrup.findUnique({ where: { id } })
    if (!g) throw new NotFoundException('Kumaş grubu bulunamadı')
    return g
  }

  async create(dto: CreateKumasGrupDto) {
    return this.prisma.kumasGrup.create({ data: dto })
  }

  async update(id: number, dto: UpdateKumasGrupDto) {
    await this.findOne(id)
    return this.prisma.kumasGrup.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.kumasGrup.delete({ where: { id } })
  }
}
