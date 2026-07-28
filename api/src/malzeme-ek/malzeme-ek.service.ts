import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MalzemeEkDto } from './dto/malzeme-ek.dto'

@Injectable()
export class MalzemeEkService {
  constructor(private prisma: PrismaService) {}

  async findAll(malzemeId: number): Promise<MalzemeEkDto[]> {
    return this.prisma.malzemeEk.findMany({
      where: { malzemeId },
      select: { id: true, malzemeId: true, dosyaAdi: true, mimetype: true, boyut: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: number) {
    const row = await this.prisma.malzemeEk.findUnique({ where: { id } })
    if (!row) throw new NotFoundException('Dosya bulunamadı')
    return row
  }

  async create(malzemeId: number, file: Express.Multer.File) {
    return this.prisma.malzemeEk.create({
      data: {
        malzemeId,
        dosyaAdi: file.originalname,
        mimetype: file.mimetype,
        boyut: file.size,
        data: file.buffer,
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.malzemeEk.delete({ where: { id } })
  }
}