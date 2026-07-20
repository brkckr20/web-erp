import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDepoDto } from './dto/create-depo.dto'
import { UpdateDepoDto } from './dto/update-depo.dto'

@Injectable()
export class DepoService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.depo.findMany({ orderBy: { kod: 'asc' } })
  }

  async findOne(id: number) {
    const depo = await this.prisma.depo.findUnique({ where: { id } })
    if (!depo) throw new NotFoundException('Depo bulunamadı')
    return depo
  }

  async findByKod(kod: string) {
    const depo = await this.prisma.depo.findUnique({ where: { kod } })
    if (!depo) throw new NotFoundException('Depo bulunamadı')
    return depo
  }

  create(dto: CreateDepoDto) {
    return this.prisma.depo.create({ data: dto })
  }

  async update(id: number, dto: UpdateDepoDto) {
    await this.findOne(id)
    return this.prisma.depo.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.depo.delete({ where: { id } })
  }
}
