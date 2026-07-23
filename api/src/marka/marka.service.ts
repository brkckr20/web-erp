import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMarkaDto } from './dto/create-marka.dto'
import { UpdateMarkaDto } from './dto/update-marka.dto'

@Injectable()
export class MarkaService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.marka.findMany({
      orderBy: { kod: 'asc' },
    })
  }

  async findOne(id: number) {
    const m = await this.prisma.marka.findUnique({ where: { id } })
    if (!m) throw new NotFoundException('Marka bulunamadı')
    return m
  }

  async findByKod(kod: string) {
    const m = await this.prisma.marka.findUnique({ where: { kod } })
    if (!m) throw new NotFoundException('Marka bulunamadı')
    return m
  }

  async create(dto: CreateMarkaDto) {
    return this.prisma.marka.create({ data: dto })
  }

  async update(id: number, dto: UpdateMarkaDto) {
    await this.findOne(id)
    return this.prisma.marka.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.marka.delete({ where: { id } })
  }
}
