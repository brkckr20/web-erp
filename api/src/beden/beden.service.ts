import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBedenDto } from './dto/create-beden.dto'
import { UpdateBedenDto } from './dto/update-beden.dto'

@Injectable()
export class BedenService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.beden.findMany({
      orderBy: { sira: 'asc' },
    })
  }

  async findOne(id: number) {
    const b = await this.prisma.beden.findUnique({ where: { id } })
    if (!b) throw new NotFoundException('Beden bulunamadı')
    return b
  }

  async create(dto: CreateBedenDto) {
    return this.prisma.beden.create({ data: dto })
  }

  async update(id: number, dto: UpdateBedenDto) {
    await this.findOne(id)
    return this.prisma.beden.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.beden.delete({ where: { id } })
  }
}
