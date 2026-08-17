import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ParametreService {
  constructor(private prisma: PrismaService) {}

  findAll(grup?: string) {
    return this.prisma.parametre.findMany({
      where: grup ? { grup } : undefined,
      orderBy: [{ grup: 'asc' }, { anahtar: 'asc' }],
    })
  }

  async findOne(grup: string, anahtar: string) {
    const item = await this.prisma.parametre.findUnique({
      where: { grup_anahtar: { grup, anahtar } },
    })
    if (!item) throw new NotFoundException('Parametre bulunamadı')
    return item
  }

  async set(grup: string, anahtar: string, deger: string, guncelleyen?: string) {
    const item = await this.prisma.parametre.upsert({
      where: { grup_anahtar: { grup, anahtar } },
      update: { deger, guncelleyen },
      create: { grup, anahtar, deger, guncelleyen },
    })
    return item
  }
}
