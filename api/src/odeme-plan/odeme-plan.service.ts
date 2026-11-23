import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOdemePlanDto } from './dto/create-odeme-plan.dto'
import { UpdateOdemePlanDto } from './dto/update-odeme-plan.dto'

const include = { satirlar: { orderBy: { sira: 'asc' as const } } }

@Injectable()
export class OdemePlanService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.odemePlan.findMany({ orderBy: { kod: 'asc' }, include })
  }

  async findOne(id: number) {
    const plan = await this.prisma.odemePlan.findUnique({ where: { id }, include })
    if (!plan) throw new NotFoundException('Ödeme planı bulunamadı')
    return plan
  }

  async findByKod(kod: string) {
    const plan = await this.prisma.odemePlan.findUnique({ where: { kod }, include })
    if (!plan) throw new NotFoundException('Ödeme planı bulunamadı')
    return plan
  }

  async create(dto: CreateOdemePlanDto) {
    if (!dto.kod?.trim()) throw new BadRequestException('Kod zorunludur')
    if (!dto.ad?.trim()) throw new BadRequestException('Ad zorunludur')
    const { satirlar, ...plan } = dto
    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.odemePlan.create({
          data: { ...plan, kod: plan.kod.trim(), ad: plan.ad.trim() },
        })
        await this.satirlariYaz(tx, created.id, satirlar)
        return tx.odemePlan.findUnique({ where: { id: created.id }, include })
      })
    } catch (e) {
      this.kodHatasiniCevir(e)
      throw e
    }
  }

  async update(id: number, dto: UpdateOdemePlanDto) {
    await this.findOne(id)
    const { satirlar, ...plan } = dto
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.odemePlan.update({
          where: { id },
          data: {
            ...plan,
            kod: plan.kod?.trim(),
            ad: plan.ad?.trim(),
          },
        })
        if (Array.isArray(satirlar)) {
          await tx.odemePlanSatir.deleteMany({ where: { planId: id } })
          await this.satirlariYaz(tx, id, satirlar)
        }
        return tx.odemePlan.findUnique({ where: { id }, include })
      })
    } catch (e) {
      this.kodHatasiniCevir(e)
      throw e
    }
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.odemePlan.delete({ where: { id } })
  }

  private async satirlariYaz(
    tx: Prisma.TransactionClient,
    planId: number,
    satirlar?: { id?: number; sira?: number; gun: number; oran: number }[],
  ) {
    if (!satirlar?.length) return
    for (const [i, s] of satirlar.entries()) {
      await tx.odemePlanSatir.create({
        data: {
          planId,
          sira: s.sira ?? i,
          gun: Number(s.gun ?? 0),
          oran: new Prisma.Decimal(Number(s.oran ?? 0)),
        },
      })
    }
  }

  private kodHatasiniCevir(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new BadRequestException('Bu kod zaten kullanılıyor')
    }
  }
}
