import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateNakliyeciDto } from './dto/create-nakliyeci.dto'
import { UpdateNakliyeciDto } from './dto/update-nakliyeci.dto'

const plakaInclude = {
  plakalar: { orderBy: { plaka: 'asc' } },
} satisfies Prisma.NakliyeciInclude

@Injectable()
export class NakliyeciService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.nakliyeci.findMany({
      include: plakaInclude,
      orderBy: { unvan: 'asc' },
    })
  }

  async findOne(id: number) {
    const entity = await this.prisma.nakliyeci.findUnique({ where: { id }, include: plakaInclude })
    if (!entity) throw new NotFoundException('Nakliyeci bulunamadı')
    return entity
  }

  // Boşluklar temizlenip büyük harfe çevrilir; boş satırlar atılır, aynı plaka
  // bir kez yazılır (DB'de nakliyeci_id + plaka unique kısıtı da var).
  private normalizePlakalar(plakalar?: string[]) {
    const unique = new Set<string>()
    for (const p of plakalar ?? []) {
      const temiz = (p ?? '').trim().toUpperCase()
      if (temiz) unique.add(temiz)
    }
    return [...unique]
  }

  async create(dto: CreateNakliyeciDto) {
    const { plakalar, ...data } = dto
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.nakliyeci.create({ data })
      const liste = this.normalizePlakalar(plakalar)
      if (liste.length > 0) {
        await tx.nakliyeciPlaka.createMany({
          data: liste.map((plaka) => ({ nakliyeciId: created.id, plaka })),
        })
      }
      return tx.nakliyeci.findUnique({ where: { id: created.id }, include: plakaInclude })
    })
  }

  async update(id: number, dto: UpdateNakliyeciDto) {
    await this.findOne(id)
    const { plakalar, ...data } = dto
    return this.prisma.$transaction(async (tx) => {
      await tx.nakliyeci.update({ where: { id }, data })
      // Plaka listesi gönderildiğinde bütünüyle yenilenir; gönderilmezse dokunulmaz.
      if (plakalar !== undefined) {
        await tx.nakliyeciPlaka.deleteMany({ where: { nakliyeciId: id } })
        const liste = this.normalizePlakalar(plakalar)
        if (liste.length > 0) {
          await tx.nakliyeciPlaka.createMany({
            data: liste.map((plaka) => ({ nakliyeciId: id, plaka })),
          })
        }
      }
      return tx.nakliyeci.findUnique({ where: { id }, include: plakaInclude })
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.nakliyeci.delete({ where: { id } })
  }
}
