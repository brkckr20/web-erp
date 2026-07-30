import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMalzemeFiyatDto } from './dto/create-malzeme-fiyat.dto'
import { UpdateMalzemeFiyatDto } from './dto/update-malzeme-fiyat.dto'

@Injectable()
export class MalzemeFiyatService {
  constructor(private prisma: PrismaService) {}

  findByMalzeme(malzemeId: number) {
    return this.prisma.malzemeFiyat.findMany({
      where: { malzemeId },
      orderBy: { tarih: 'desc' },
    })
  }

  async findOne(id: number) {
    const fiyat = await this.prisma.malzemeFiyat.findUnique({ where: { id } })
    if (!fiyat) throw new NotFoundException('Fiyat bulunamadı')
    return fiyat
  }

  create(dto: CreateMalzemeFiyatDto) {
    return this.prisma.malzemeFiyat.create({
      data: {
        malzemeId: dto.malzemeId,
        kod: dto.kod ?? null,
        aciklama: dto.aciklama ?? null,
        tarih: dto.tarih ? new Date(dto.tarih) : null,
        bedenId: dto.bedenId ?? null,
        dovizCinsi: dto.dovizCinsi ?? null,
        fiyat: dto.fiyat ?? null,
        dovizKuru: dto.dovizKuru ?? null,
        baslangic: dto.baslangic ? new Date(dto.baslangic) : null,
        bitis: dto.bitis ? new Date(dto.bitis) : null,
        kullanimda: dto.kullanimda ?? null,
      },
    })
  }

  async update(id: number, dto: UpdateMalzemeFiyatDto) {
    await this.findOne(id)
    return this.prisma.malzemeFiyat.update({
      where: { id },
      data: {
        kod: dto.kod ?? undefined,
        aciklama: dto.aciklama ?? undefined,
        tarih: dto.tarih !== undefined ? (dto.tarih ? new Date(dto.tarih) : null) : undefined,
        bedenId: dto.bedenId ?? undefined,
        dovizCinsi: dto.dovizCinsi ?? undefined,
        fiyat: dto.fiyat ?? undefined,
        dovizKuru: dto.dovizKuru ?? undefined,
        baslangic: dto.baslangic !== undefined ? (dto.baslangic ? new Date(dto.baslangic) : null) : undefined,
        bitis: dto.bitis !== undefined ? (dto.bitis ? new Date(dto.bitis) : null) : undefined,
        kullanimda: dto.kullanimda ?? undefined,
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.malzemeFiyat.delete({ where: { id } })
  }
}
