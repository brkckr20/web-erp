import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSirketDto, UpdateSirketDto } from './dto/create-sirket.dto'

const include = {
  adresler: { orderBy: { sira: 'asc' as const } },
  webler: { orderBy: { sira: 'asc' as const } },
  ibanlar: { orderBy: { sira: 'asc' as const } },
}

@Injectable()
export class SirketService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.sirket.findMany({ orderBy: { ad: 'asc' }, include })
  }

  async findOne(id: number) {
    const item = await this.prisma.sirket.findUnique({ where: { id }, include })
    if (!item) throw new NotFoundException('Şirket bulunamadı')
    return item
  }

  create(dto: CreateSirketDto) {
    const { adresler, webler, ibanlar, ...sirket } = dto
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.sirket.create({ data: sirket })
      if (adresler?.length) {
        for (const [i, a] of adresler.entries()) {
          const { id: _id, ...rest } = a
          await tx.sirketAdres.create({ data: { ...rest, sira: rest.sira ?? i, sirketId: created.id } })
        }
      }
      if (webler?.length) {
        for (const [i, w] of webler.entries()) {
          const { id: _id, ...rest } = w
          await tx.sirketWeb.create({ data: { ...rest, sira: rest.sira ?? i, sirketId: created.id } })
        }
      }
      if (ibanlar?.length) {
        for (const [i, b] of ibanlar.entries()) {
          const { id: _id, ...rest } = b
          await tx.sirketIban.create({ data: { ...rest, sira: rest.sira ?? i, sirketId: created.id } })
        }
      }
      return tx.sirket.findUnique({ where: { id: created.id }, include })
    })
  }

  async update(id: number, dto: UpdateSirketDto) {
    await this.findOne(id)
    const { adresler, webler, ibanlar, ...sirket } = dto
    return this.prisma.$transaction(async (tx) => {
      await tx.sirket.update({ where: { id }, data: sirket })
      if (Array.isArray(adresler)) {
        await tx.sirketAdres.deleteMany({ where: { sirketId: id } })
        for (const [i, a] of adresler.entries()) {
          const { id: _id, ...rest } = a
          await tx.sirketAdres.create({ data: { ...rest, sira: rest.sira ?? i, sirketId: id } })
        }
      }
      if (Array.isArray(webler)) {
        await tx.sirketWeb.deleteMany({ where: { sirketId: id } })
        for (const [i, w] of webler.entries()) {
          const { id: _id, ...rest } = w
          await tx.sirketWeb.create({ data: { ...rest, sira: rest.sira ?? i, sirketId: id } })
        }
      }
      if (Array.isArray(ibanlar)) {
        await tx.sirketIban.deleteMany({ where: { sirketId: id } })
        for (const [i, b] of ibanlar.entries()) {
          const { id: _id, ...rest } = b
          await tx.sirketIban.create({ data: { ...rest, sira: rest.sira ?? i, sirketId: id } })
        }
      }
      return tx.sirket.findUnique({ where: { id }, include })
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      await tx.sirketAdres.deleteMany({ where: { sirketId: id } })
      await tx.sirketWeb.deleteMany({ where: { sirketId: id } })
      await tx.sirketIban.deleteMany({ where: { sirketId: id } })
      return tx.sirket.delete({ where: { id } })
    })
  }
}
