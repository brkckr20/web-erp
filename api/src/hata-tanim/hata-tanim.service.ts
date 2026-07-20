import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateHataTanimDto } from './dto/create-hata-tanim.dto'
import { UpdateHataTanimDto } from './dto/update-hata-tanim.dto'

@Injectable()
export class HataTanimService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.hataTanim.findMany({ orderBy: { hataKodu: 'asc' } })
  }

  async findOne(id: number) {
    const entity = await this.prisma.hataTanim.findUnique({ where: { id } })
    if (!entity) throw new NotFoundException('Hata tanımı bulunamadı')
    return entity
  }

  async findByKod(kod: string) {
    const entity = await this.prisma.hataTanim.findUnique({ where: { hataKodu: kod } })
    if (!entity) throw new NotFoundException('Hata tanımı bulunamadı')
    return entity
  }

  create(dto: CreateHataTanimDto) {
    return this.prisma.hataTanim.create({ data: dto })
  }

  async update(id: number, dto: UpdateHataTanimDto) {
    await this.findOne(id)
    return this.prisma.hataTanim.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.hataTanim.delete({ where: { id } })
  }
}
