import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateModelBedenDto } from './dto/create-model-beden.dto'

@Injectable()
export class ModelBedenService {
  constructor(private prisma: PrismaService) {}

  async findByMalzeme(malzemeId: number) {
    return this.prisma.malzemeBeden.findMany({
      where: { malzemeId },
      include: { beden: true },
      orderBy: { beden: { sira: 'asc' } },
    })
  }

  async add(dto: CreateModelBedenDto) {
    if (!dto.malzemeId) {
      throw new BadRequestException('Malzeme kaydedilmeden beden eklenemez')
    }
    const malzeme = await this.prisma.malzeme.findUnique({
      where: { id: dto.malzemeId },
      select: { id: true },
    })
    if (!malzeme) {
      throw new NotFoundException('Malzeme bulunamadı, önce modeli kaydedin')
    }
    const beden = await this.prisma.beden.findUnique({
      where: { id: dto.bedenId },
      select: { id: true },
    })
    if (!beden) {
      throw new NotFoundException('Beden bulunamadı')
    }
    const exists = await this.prisma.malzemeBeden.findUnique({
      where: { malzemeId_bedenId: { malzemeId: dto.malzemeId, bedenId: dto.bedenId } },
    })
    if (exists) return exists
    return this.prisma.malzemeBeden.create({
      data: { malzemeId: dto.malzemeId, bedenId: dto.bedenId },
      include: { beden: true },
    })
  }

  async remove(malzemeId: number, bedenId: number) {
    return this.prisma.malzemeBeden.delete({
      where: { malzemeId_bedenId: { malzemeId, bedenId } },
    })
  }
}
