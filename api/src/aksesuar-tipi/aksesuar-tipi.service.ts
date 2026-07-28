import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAksesuarTipiDto } from './dto/create-aksesuar-tipi.dto'
import { UpdateAksesuarTipiDto } from './dto/update-aksesuar-tipi.dto'

@Injectable()
export class AksesuarTipiService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.aksesuarTipi.findMany({ orderBy: { ad: 'asc' } })
  }

  async findOne(id: number) {
    const item = await this.prisma.aksesuarTipi.findUnique({ where: { id } })
    if (!item) throw new NotFoundException('Aksesuar tipi bulunamadı')
    return item
  }

  create(dto: CreateAksesuarTipiDto) {
    return this.prisma.aksesuarTipi.create({ data: dto })
  }

  async update(id: number, dto: UpdateAksesuarTipiDto) {
    await this.findOne(id)
    return this.prisma.aksesuarTipi.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.aksesuarTipi.delete({ where: { id } })
  }
}