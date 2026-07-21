import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOzellikKodlamaDto } from './dto/create-ozellik-kodlama.dto'
import { UpdateOzellikKodlamaDto } from './dto/update-ozellik-kodlama.dto'

@Injectable()
export class OzellikKodlamaService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.ozellikKodlama.findMany({ orderBy: { ad: 'asc' } })
  }

  findByKategori(kategori: string) {
    return this.prisma.ozellikKodlama.findMany({
      where: { kategori },
      orderBy: { ad: 'asc' },
    })
  }

  async findOne(id: number) {
    const o = await this.prisma.ozellikKodlama.findUnique({ where: { id } })
    if (!o) throw new NotFoundException('OzellikKodlama bulunamadı')
    return o
  }

  create(dto: CreateOzellikKodlamaDto) {
    return this.prisma.ozellikKodlama.create({ data: dto })
  }

  async update(id: number, dto: UpdateOzellikKodlamaDto) {
    await this.findOne(id)
    return this.prisma.ozellikKodlama.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.ozellikKodlama.delete({ where: { id } })
  }
}
