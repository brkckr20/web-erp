import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMalzemeDto } from './dto/create-malzeme.dto'
import { UpdateMalzemeDto } from './dto/update-malzeme.dto'

@Injectable()
export class MalzemeService {
  constructor(private prisma: PrismaService) {}

  findAll(tip?: number) {
    const where = tip != null ? { tip } : undefined
    return this.prisma.malzeme.findMany({
      where,
      include: { kumasTuru: true },
      orderBy: { kod: 'asc' },
    })
  }

  async findOne(id: number) {
    const m = await this.prisma.malzeme.findUnique({
      where: { id },
      include: { kumasTuru: true },
    })
    if (!m) throw new NotFoundException('Malzeme bulunamadı')
    return m
  }

  async findByKod(kod: string) {
    const m = await this.prisma.malzeme.findUnique({
      where: { kod },
      include: { kumasTuru: true },
    })
    if (!m) throw new NotFoundException('Malzeme bulunamadı')
    return m
  }

  async nextKod(numaratorId: number) {
    const num = await this.prisma.numarator.findUnique({ where: { id: numaratorId } })
    if (!num) throw new NotFoundException('Numaratör bulunamadı')
    if (!num.kullanimda) throw new BadRequestException('Numaratör kullanımda değil')

    const yeniNo = num.sonNo + 1
    const kod = `${num.onEk}${String(yeniNo).padStart(3, '0')}`

    await this.prisma.numarator.update({
      where: { id: numaratorId },
      data: { sonNo: yeniNo },
    })

    return { kod }
  }

  create(dto: CreateMalzemeDto) {
    const { ...data } = dto as any
    delete data.id
    delete data.createdAt
    delete data.updatedAt
    delete data.numaratorId
    delete data.markaRef
    delete data.grup
    delete data.numarator
    delete data.kalemler
    delete data.isEmriKalemler
    delete data.kkKalemler
    delete data.receteler
    delete data.receteKalemler
    delete data.malzemeBedenler
    delete data.malzemeKumasGruplari
    delete data.kumasTuru
    return this.prisma.malzeme.create({ data })
  }

  async update(id: number, dto: UpdateMalzemeDto) {
    await this.findOne(id)
    const { ...data } = dto as any
    delete data.id
    delete data.createdAt
    delete data.updatedAt
    delete data.numaratorId
    delete data.markaRef
    delete data.grup
    delete data.numarator
    delete data.kalemler
    delete data.isEmriKalemler
    delete data.kkKalemler
    delete data.receteler
    delete data.receteKalemler
    delete data.malzemeBedenler
    delete data.malzemeKumasGruplari
    delete data.kumasTuru
    return this.prisma.malzeme.update({ where: { id }, data })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.malzeme.delete({ where: { id } })
  }
}
