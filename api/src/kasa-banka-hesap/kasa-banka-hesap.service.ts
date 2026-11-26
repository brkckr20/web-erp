import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateKasaBankaHesapDto } from './dto/create-kasa-banka-hesap.dto'
import { UpdateKasaBankaHesapDto } from './dto/update-kasa-banka-hesap.dto'

const TIPLER = ['kasa', 'banka']

@Injectable()
export class KasaBankaHesapService {
  constructor(private prisma: PrismaService) {}

  findAll(tip?: string) {
    return this.prisma.kasaBankaHesap.findMany({
      where: tip ? { tip } : undefined,
      orderBy: { kod: 'asc' },
    })
  }

  async findOne(id: number) {
    const hesap = await this.prisma.kasaBankaHesap.findUnique({ where: { id } })
    if (!hesap) throw new NotFoundException('Kasa/banka hesabı bulunamadı')
    return hesap
  }

  async findByKod(kod: string) {
    const hesap = await this.prisma.kasaBankaHesap.findUnique({ where: { kod } })
    if (!hesap) throw new NotFoundException('Kasa/banka hesabı bulunamadı')
    return hesap
  }

  async create(dto: CreateKasaBankaHesapDto) {
    if (!dto.kod?.trim()) throw new BadRequestException('Kod zorunludur')
    if (!dto.ad?.trim()) throw new BadRequestException('Ad zorunludur')
    if (!TIPLER.includes(dto.tip)) throw new BadRequestException('Geçersiz hesap tipi')
    const data: any = { ...dto, kod: dto.kod.trim(), ad: dto.ad.trim() }
    await this.resolveMasrafYeri(this.prisma, data)
    try {
      return await this.prisma.kasaBankaHesap.create({ data })
    } catch (e) {
      this.kodHatasiniCevir(e)
      throw e
    }
  }

  async update(id: number, dto: UpdateKasaBankaHesapDto) {
    await this.findOne(id)
    if (dto.tip && !TIPLER.includes(dto.tip)) throw new BadRequestException('Geçersiz hesap tipi')
    const data: any = { ...dto, kod: dto.kod?.trim(), ad: dto.ad?.trim() }
    await this.resolveMasrafYeri(this.prisma, data)
    try {
      return await this.prisma.kasaBankaHesap.update({ where: { id }, data })
    } catch (e) {
      this.kodHatasiniCevir(e)
      throw e
    }
  }

  private async resolveMasrafYeri(db: any, data: any) {
    const hasId = 'masrafYeriId' in data
    const hasKod = 'masrafYeriKodu' in data
    if (!hasId && !hasKod) return
    const id = hasId ? (data.masrafYeriId ?? null) : null
    const kod = hasKod ? ((data.masrafYeriKodu ?? '')?.toString().trim() || null) : null
    delete data.masrafYeriId
    if (id != null) {
      const kayit = await db.masrafYeri.findUnique({ where: { id: Number(id) } })
      if (!kayit) throw new BadRequestException('Masraf yeri bulunamadı')
      if (!kayit.kullanimda) throw new BadRequestException('Masraf yeri pasif')
      data.masrafYeriId = kayit.id
      data.masrafYeriKodu = kayit.kod
      return
    }
    if (kod) {
      const kayit = await db.masrafYeri.findUnique({ where: { kod } })
      if (!kayit) throw new BadRequestException('Masraf yeri bulunamadı')
      if (!kayit.kullanimda) throw new BadRequestException('Masraf yeri pasif')
      data.masrafYeriId = kayit.id
      data.masrafYeriKodu = kayit.kod
      return
    }
    data.masrafYeriId = null
    data.masrafYeriKodu = null
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.kasaBankaHesap.delete({ where: { id } })
  }

  private kodHatasiniCevir(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new BadRequestException('Bu kod zaten kullanılıyor')
    }
  }
}
