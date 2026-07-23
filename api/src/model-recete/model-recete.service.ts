import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReceteDto } from './dto/create-recete.dto'
import { UpdateReceteDto } from './dto/update-recete.dto'
import { CreateKalemDto } from './dto/create-kalem.dto'
import { UpdateKalemDto } from './dto/update-kalem.dto'
import { CreateOlcuDto } from './dto/create-olcu.dto'
import { UpdateOlcuDto } from './dto/update-olcu.dto'

@Injectable()
export class ModelReceteService {
  constructor(private prisma: PrismaService) {}

  async findByMalzeme(malzemeId: number) {
    const recete = await this.prisma.modelRecete.findFirst({
      where: { malzemeId },
      include: {
        kalemler: {
          include: {
            malzeme: true,
            olculer: {
              include: { beden: true },
              orderBy: { beden: { sira: 'asc' } },
            },
          },
          orderBy: { sira: 'asc' },
        },
      },
    })
    if (!recete) {
      const created = await this.prisma.modelRecete.create({
        data: { malzemeId },
        include: { kalemler: { include: { malzeme: true, olculer: { include: { beden: true } } } } },
      })
      return created
    }
    return recete
  }

  async findOne(id: number) {
    const r = await this.prisma.modelRecete.findUnique({
      where: { id },
      include: {
        kalemler: {
          include: {
            malzeme: true,
            olculer: {
              include: { beden: true },
              orderBy: { beden: { sira: 'asc' } },
            },
          },
          orderBy: { sira: 'asc' },
        },
      },
    })
    if (!r) throw new NotFoundException('Reçete bulunamadı')
    return r
  }

  async createKalem(receteId: number, dto: CreateKalemDto) {
    const maxSira = await this.prisma.receteKalem.findFirst({
      where: { receteId },
      orderBy: { sira: 'desc' },
      select: { sira: true },
    })
    return this.prisma.receteKalem.create({
      data: {
        receteId,
        sira: (maxSira?.sira ?? 0) + 1,
        malzemeId: dto.malzemeId ?? null,
        birimFiyat: dto.birimFiyat ?? null,
        dovizCinsi: dto.dovizCinsi ?? null,
        aciklama: dto.aciklama ?? null,
      },
      include: { malzeme: true, olculer: { include: { beden: true } } },
    })
  }

  async updateKalem(id: number, dto: UpdateKalemDto) {
    await this.prisma.receteKalem.findUnique({ where: { id } })
    return this.prisma.receteKalem.update({
      where: { id },
      data: {
        malzemeId: dto.malzemeId,
        birimFiyat: dto.birimFiyat,
        dovizCinsi: dto.dovizCinsi,
        aciklama: dto.aciklama,
        sira: dto.sira,
      },
      include: { malzeme: true, olculer: { include: { beden: true } } },
    })
  }

  async removeKalem(id: number) {
    return this.prisma.receteKalem.delete({ where: { id } })
  }

  async upsertOlcu(kalemId: number, dto: CreateOlcuDto) {
    return this.prisma.receteOlcu.upsert({
      where: { kalemId_bedenId: { kalemId, bedenId: dto.bedenId } },
      create: {
        kalemId,
        bedenId: dto.bedenId,
        metraj: dto.metraj ?? null,
        en: dto.en ?? null,
        boy: dto.boy ?? null,
        miktar: dto.miktar ?? null,
      },
      update: {
        metraj: dto.metraj,
        en: dto.en,
        boy: dto.boy,
        miktar: dto.miktar,
      },
      include: { beden: true },
    })
  }

  async removeOlcu(id: number) {
    return this.prisma.receteOlcu.delete({ where: { id } })
  }
}
