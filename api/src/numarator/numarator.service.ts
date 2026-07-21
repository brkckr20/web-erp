import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateNumaratorDto } from './dto/create-numarator.dto'
import { UpdateNumaratorDto } from './dto/update-numarator.dto'

@Injectable()
export class NumaratorService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.numarator.findMany({ orderBy: { ad: 'asc' } })
  }

  async findOne(id: number) {
    const n = await this.prisma.numarator.findUnique({ where: { id } })
    if (!n) throw new NotFoundException('Numaratör bulunamadı')
    return n
  }

  async create(dto: CreateNumaratorDto) {
    return this.prisma.numarator.create({ data: { ...dto, sonNo: dto.sonNo ?? 0 } })
  }

  async update(id: number, dto: UpdateNumaratorDto) {
    await this.findOne(id)
    return this.prisma.numarator.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.numarator.delete({ where: { id } })
  }
}
