import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCariHesapDto } from './dto/create-cari-hesap.dto'
import { UpdateCariHesapDto } from './dto/update-cari-hesap.dto'

@Injectable()
export class CariHesapService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.cariHesap.findMany({ orderBy: { kod: 'asc' } })
  }

  async findOne(id: number) {
    const cari = await this.prisma.cariHesap.findUnique({ where: { id } })
    if (!cari) throw new NotFoundException('Cari hesap bulunamadı')
    return cari
  }

  async findByKod(kod: string) {
    const cari = await this.prisma.cariHesap.findUnique({ where: { kod } })
    if (!cari) throw new NotFoundException('Cari hesap bulunamadı')
    return cari
  }

  create(dto: CreateCariHesapDto) {
    return this.prisma.cariHesap.create({ data: dto })
  }

  async update(id: number, dto: UpdateCariHesapDto) {
    await this.findOne(id)
    return this.prisma.cariHesap.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.cariHesap.delete({ where: { id } })
  }
}
