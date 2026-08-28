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

  async getFavoriler(id: number): Promise<string[]> {
    const k = await this.findOne(id)
    if (!k.favoriler) return []
    try {
      return JSON.parse(k.favoriler)
    } catch {
      return []
    }
  }

  async toggleFavori(id: number, favoriKey: string): Promise<string[]> {
    const k = await this.findOne(id)
    let favoriler: string[] = []
    if (k.favoriler) {
      try {
        favoriler = JSON.parse(k.favoriler)
      } catch {
        favoriler = []
      }
    }
    const index = favoriler.indexOf(favoriKey)
    if (index > -1) {
      favoriler.splice(index, 1)
    } else {
      favoriler.push(favoriKey)
    }
    await this.prisma.kullanici.update({
      where: { id },
      data: { favoriler: JSON.stringify(favoriler) },
    })
    return favoriler
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
