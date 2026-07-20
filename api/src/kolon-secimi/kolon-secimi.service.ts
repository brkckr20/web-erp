import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SaveKolonSecimiDto } from './dto/save-kolon-secimi.dto'

@Injectable()
export class KolonSecimiService {
  constructor(private prisma: PrismaService) {}

  async findByEkranAdi(kullaniciId: number, ekranAdi: string) {
    return this.prisma.kolonSecimi.findMany({
      where: { kullaniciId, ekranAdi },
      select: {
        kolonAdi: true,
        gizli: true,
        genislik: true,
        sira: true,
        siralamaYon: true,
      },
      orderBy: { sira: 'asc' as const },
    })
  }

  async saveBatch(kullaniciId: number, dto: SaveKolonSecimiDto) {
    const { ekranAdi, kolonlar } = dto

    await this.prisma.$transaction(
      kolonlar.map((k) =>
        this.prisma.kolonSecimi.upsert({
          where: {
            kullaniciId_ekranAdi_kolonAdi: {
              kullaniciId,
              ekranAdi,
              kolonAdi: k.kolonAdi,
            },
          },
          create: {
            kullaniciId,
            ekranAdi,
            kolonAdi: k.kolonAdi,
            gizli: k.gizli,
            genislik: k.genislik,
            sira: k.sira,
            siralamaYon: k.siralamaYon,
          },
          update: {
            gizli: k.gizli,
            genislik: k.genislik,
            sira: k.sira,
            siralamaYon: k.siralamaYon,
          },
        }),
      ),
    )

    return { kaydedilen: kolonlar.length }
  }
}
