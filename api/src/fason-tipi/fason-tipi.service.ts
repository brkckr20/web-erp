import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFasonTipiDto } from './dto/create-fason-tipi.dto'
import { UpdateFasonTipiDto } from './dto/update-fason-tipi.dto'

@Injectable()
export class FasonTipiService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.fasonTipi.findMany({ orderBy: { ad: 'asc' } })
  }

  async findOne(id: number) {
    const item = await this.prisma.fasonTipi.findUnique({ where: { id } })
    if (!item) throw new NotFoundException('Fason tipi bulunamadı')
    return item
  }

  create(dto: CreateFasonTipiDto) {
    return this.prisma.fasonTipi.create({ data: dto })
  }

  async update(id: number, dto: UpdateFasonTipiDto) {
    await this.findOne(id)
    return this.prisma.fasonTipi.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.fasonTipi.delete({ where: { id } })
  }
}
