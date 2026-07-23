import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateGrupDto } from './dto/create-grup.dto'
import { UpdateGrupDto } from './dto/update-grup.dto'

@Injectable()
export class GrupService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.grup.findMany({
      orderBy: { kod: 'asc' },
    })
  }

  async findOne(id: number) {
    const g = await this.prisma.grup.findUnique({ where: { id } })
    if (!g) throw new NotFoundException('Grup bulunamadı')
    return g
  }

  async findByKod(kod: string) {
    const g = await this.prisma.grup.findUnique({ where: { kod } })
    if (!g) throw new NotFoundException('Grup bulunamadı')
    return g
  }

  async create(dto: CreateGrupDto) {
    return this.prisma.grup.create({ data: dto })
  }

  async update(id: number, dto: UpdateGrupDto) {
    await this.findOne(id)
    return this.prisma.grup.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.grup.delete({ where: { id } })
  }
}
