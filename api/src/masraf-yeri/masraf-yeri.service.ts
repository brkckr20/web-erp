import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMasrafYeriDto } from './dto/create-masraf-yeri.dto'
import { UpdateMasrafYeriDto } from './dto/update-masraf-yeri.dto'

@Injectable()
export class MasrafYeriService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.masrafYeri.findMany({ orderBy: { kod: 'asc' } })
  }

  async findOne(id: number) {
    const kayit = await this.prisma.masrafYeri.findUnique({ where: { id } })
    if (!kayit) throw new NotFoundException('Masraf yeri bulunamadı')
    return kayit
  }

  async findByKod(kod: string) {
    const kayit = await this.prisma.masrafYeri.findUnique({ where: { kod } })
    if (!kayit) throw new NotFoundException('Masraf yeri bulunamadı')
    return kayit
  }

  async create(dto: CreateMasrafYeriDto) {
    if (!dto.kod?.trim()) throw new BadRequestException('Kod zorunludur')
    if (!dto.ad?.trim()) throw new BadRequestException('Ad zorunludur')
    try {
      return await this.prisma.masrafYeri.create({
        data: {
          kod: dto.kod.trim(),
          ad: dto.ad.trim(),
          ozelKod: dto.ozelKod ?? null,
          erisimKodu: dto.erisimKodu ?? null,
          aciklama: dto.aciklama ?? null,
          dovizCinsi: dto.dovizCinsi ?? null,
          kullanimda: dto.kullanimda ?? true,
        },
      })
    } catch (e) {
      this.kodHatasiniCevir(e)
      throw e
    }
  }

  async update(id: number, dto: UpdateMasrafYeriDto) {
    await this.findOne(id)
    try {
      return await this.prisma.masrafYeri.update({
        where: { id },
        data: {
          ...dto,
          kod: dto.kod?.trim(),
          ad: dto.ad?.trim(),
        },
      })
    } catch (e) {
      this.kodHatasiniCevir(e)
      throw e
    }
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.masrafYeri.delete({ where: { id } })
  }

  private kodHatasiniCevir(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new BadRequestException('Bu kod zaten kullanılıyor')
    }
  }
}