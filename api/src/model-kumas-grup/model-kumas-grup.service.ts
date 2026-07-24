import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateModelKumasGrupDto } from './dto/create-model-kumas-grup.dto'

@Injectable()
export class ModelKumasGrupService {
  constructor(private prisma: PrismaService) {}

  async findByMalzeme(malzemeId: number) {
    return this.prisma.malzemeKumasGrup.findMany({
      where: { malzemeId },
      include: { kumasGrup: true },
      orderBy: { kumasGrup: { kod: 'asc' } },
    })
  }

  async add(dto: CreateModelKumasGrupDto) {
    const exists = await this.prisma.malzemeKumasGrup.findUnique({
      where: { malzemeId_kumasGrupId: { malzemeId: dto.malzemeId, kumasGrupId: dto.kumasGrupId } },
    })
    if (exists) return exists
    return this.prisma.malzemeKumasGrup.create({
      data: { malzemeId: dto.malzemeId, kumasGrupId: dto.kumasGrupId },
      include: { kumasGrup: true },
    })
  }

  async remove(malzemeId: number, kumasGrupId: number) {
    return this.prisma.malzemeKumasGrup.delete({
      where: { malzemeId_kumasGrupId: { malzemeId, kumasGrupId } },
    })
  }
}
