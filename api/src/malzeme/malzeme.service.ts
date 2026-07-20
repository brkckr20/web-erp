import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMalzemeDto } from './dto/create-malzeme.dto'
import { UpdateMalzemeDto } from './dto/update-malzeme.dto'

@Injectable()
export class MalzemeService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.malzeme.findMany({ orderBy: { kod: 'asc' } })
  }

  async findOne(id: number) {
    const m = await this.prisma.malzeme.findUnique({ where: { id } })
    if (!m) throw new NotFoundException('Malzeme bulunamadı')
    return m
  }

  async findByKod(kod: string) {
    const m = await this.prisma.malzeme.findUnique({ where: { kod } })
    if (!m) throw new NotFoundException('Malzeme bulunamadı')
    return m
  }

  create(dto: CreateMalzemeDto) {
    return this.prisma.malzeme.create({ data: dto })
  }

  async update(id: number, dto: UpdateMalzemeDto) {
    await this.findOne(id)
    return this.prisma.malzeme.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.malzeme.delete({ where: { id } })
  }
}
