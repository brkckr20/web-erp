import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateGtipDto } from './dto/create-gtip.dto'
import { UpdateGtipDto } from './dto/update-gtip.dto'

@Injectable()
export class GtipService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.gtip.findMany({
      orderBy: { kod: 'asc' },
    })
  }

  async findOne(id: number) {
    const g = await this.prisma.gtip.findUnique({ where: { id } })
    if (!g) throw new NotFoundException('GTİP bulunamadı')
    return g
  }

  async create(dto: CreateGtipDto) {
    return this.prisma.gtip.create({ data: dto })
  }

  async update(id: number, dto: UpdateGtipDto) {
    await this.findOne(id)
    return this.prisma.gtip.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.gtip.delete({ where: { id } })
  }
}
