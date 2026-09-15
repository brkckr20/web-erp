import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIslemDto } from './dto/create-islem.dto'
import { UpdateIslemDto } from './dto/update-islem.dto'

@Injectable()
export class IslemService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.islem.findMany({ orderBy: { sira: 'asc' } })
  }

  async findOne(id: number) {
    const row = await this.prisma.islem.findUnique({ where: { id } })
    if (!row) throw new NotFoundException('İşlem bulunamadı')
    return row
  }

  async create(dto: CreateIslemDto) {
    const kod = (dto.kod ?? '').trim().toUpperCase()
    if (!kod) throw new ConflictException('Kod gerekli')
    const mevcut = await this.prisma.islem.findUnique({ where: { kod } })
    if (mevcut) throw new ConflictException(`Bu kod zaten kullanılıyor: ${kod}`)
    return this.prisma.islem.create({
      data: {
        kod,
        ad: (dto.ad ?? '').trim(),
        birim: dto.birim?.trim() ? dto.birim.trim() : null,
        sira: dto.sira ?? 0,
        aktif: dto.aktif ?? true,
      },
    })
  }

  async update(id: number, dto: UpdateIslemDto) {
    await this.findOne(id)
    const kod = (dto.kod ?? '').trim().toUpperCase()
    if (kod) {
      const cakisan = await this.prisma.islem.findUnique({ where: { kod } })
      if (cakisan && cakisan.id !== id) throw new ConflictException(`Bu kod zaten kullanılıyor: ${kod}`)
    }
    return this.prisma.islem.update({
      where: { id },
      data: {
        ...(kod ? { kod } : {}),
        ...(dto.ad !== undefined ? { ad: dto.ad.trim() } : {}),
        ...(dto.birim !== undefined ? { birim: dto.birim?.trim() ? dto.birim.trim() : null } : {}),
        ...(dto.sira !== undefined ? { sira: dto.sira } : {}),
        ...(dto.aktif !== undefined ? { aktif: dto.aktif } : {}),
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.islem.delete({ where: { id } })
  }
}
