import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateModelBedenDto } from './dto/create-model-beden.dto'
import { SiralamaModelBedenDto } from './dto/siralama-model-beden.dto'

@Injectable()
export class ModelBedenService {
  constructor(private prisma: PrismaService) {}

  async findByMalzeme(malzemeId: number) {
    return this.prisma.malzemeBeden.findMany({
      where: { malzemeId },
      include: { beden: true },
      orderBy: [{ sira: 'asc' }, { id: 'asc' }],
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
    const son = await this.prisma.malzemeBeden.findFirst({
      where: { malzemeId: dto.malzemeId },
      orderBy: { sira: 'desc' },
      select: { sira: true },
    })
    return this.prisma.malzemeBeden.create({
      data: { malzemeId: dto.malzemeId, bedenId: dto.bedenId, sira: (son?.sira ?? 0) + 1 },
      include: { beden: true },
    })
  }

  async sirala(dto: SiralamaModelBedenDto) {
    const mevcut = await this.prisma.malzemeBeden.findMany({
      where: { malzemeId: dto.malzemeId },
      select: { bedenId: true },
    })
    const mevcutSet = new Set(mevcut.map((m) => m.bedenId))
    if (dto.bedenIds.length !== mevcutSet.size || dto.bedenIds.some((id) => !mevcutSet.has(id))) {
      throw new BadRequestException('Beden listesi modele ait güncel bedenlerle eşleşmiyor')
    }
    await this.prisma.$transaction(
      dto.bedenIds.map((bedenId, i) =>
        this.prisma.malzemeBeden.update({
          where: { malzemeId_bedenId: { malzemeId: dto.malzemeId, bedenId } },
          data: { sira: i + 1 },
        }),
      ),
    )
    return this.findByMalzeme(dto.malzemeId)
  }

  async remove(malzemeId: number, bedenId: number) {
    return this.prisma.malzemeBeden.delete({
      where: { malzemeId_bedenId: { malzemeId, bedenId } },
    })
  }
}
