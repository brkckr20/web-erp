import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { MalzemeEkDto } from './dto/malzeme-ek.dto'

interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  buffer: Buffer
  size: number
}

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

  async create(malzemeId: number, file: MulterFile) {
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