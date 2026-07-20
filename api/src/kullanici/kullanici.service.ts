import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateKullaniciDto } from './dto/create-kullanici.dto'
import { UpdateKullaniciDto } from './dto/update-kullanici.dto'

@Injectable()
export class KullaniciService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.kullanici.findMany({ orderBy: { kod: 'asc' } })
  }

  async findOne(id: number) {
    const k = await this.prisma.kullanici.findUnique({ where: { id } })
    if (!k) throw new NotFoundException('Kullanıcı bulunamadı')
    return k
  }

  async findByKod(kod: string) {
    const k = await this.prisma.kullanici.findUnique({ where: { kod } })
    if (!k) throw new NotFoundException('Kullanıcı bulunamadı')
    return k
  }

  create(dto: CreateKullaniciDto) {
    return this.prisma.kullanici.create({ data: dto })
  }

  async update(id: number, dto: UpdateKullaniciDto) {
    await this.findOne(id)
    return this.prisma.kullanici.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.kullanici.delete({ where: { id } })
  }
}
