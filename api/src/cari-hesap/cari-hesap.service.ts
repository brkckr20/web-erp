import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCariHesapDto } from './dto/create-cari-hesap.dto'
import { UpdateCariHesapDto } from './dto/update-cari-hesap.dto'
import { CreateCariHesapAdresDto } from './dto/create-cari-hesap-adres.dto'
import { UpdateCariHesapAdresDto } from './dto/update-cari-hesap-adres.dto'

@Injectable()
export class CariHesapService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page?: number, limit?: number, prefix?: string) {
    const pageNum = Math.max(Number(page) || 1, 1)
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 50)
    const skip = (pageNum - 1) * limitNum

    const prefixFilter = prefix
      ? prefix.split(',').map((p) => ({ kod: { startsWith: p.trim() } }))
      : undefined

    return this.prisma.cariHesap.findMany({
      where: {
        ...(prefixFilter ? { OR: prefixFilter } : {}),
        ...(search
          ? {
              AND: [
                {
                  OR: [
                    { kod: { contains: search } },
                    { ad: { contains: search } },
                  ],
                },
              ],
            }
          : {}),
      },
      skip,
      take: limitNum,
      orderBy: { kod: 'asc' }
    })
  }

  async findOne(id: number) {
    const cari = await this.prisma.cariHesap.findUnique({ where: { id } })
    if (!cari) throw new NotFoundException('Cari hesap bulunamadı')
    return cari
  }

  async findByKod(kod: string) {
    const cari = await this.prisma.cariHesap.findUnique({ where: { kod } })
    if (!cari) throw new NotFoundException('Cari hesap bulunamadı')
    return cari
  }

  create(dto: CreateCariHesapDto) {
    return this.prisma.cariHesap.create({ data: dto })
  }

  async update(id: number, dto: UpdateCariHesapDto) {
    await this.findOne(id)
    return this.prisma.cariHesap.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.cariHesap.delete({ where: { id } })
  }

  // ---------- Adresler (cari_hesap_adres) ----------

  async adresleriGetir(cariHesapId: number) {
    await this.findOne(cariHesapId)
    return this.prisma.cariHesapAdres.findMany({
      where: { cariHesapId },
      orderBy: { kod: 'asc' },
    })
  }

  // Kod otomatik: carinin mevcut max sayısal kodu + 1, 3 haneli (001, 002, ...).
  private async sonrakiAdresKodu(cariHesapId: number): Promise<string> {
    const mevcut = await this.prisma.cariHesapAdres.findMany({
      where: { cariHesapId },
      select: { kod: true },
    })
    let max = 0
    for (const a of mevcut) {
      const n = parseInt(a.kod, 10)
      if (!isNaN(n) && n > max) max = n
    }
    return String(max + 1).padStart(3, '0')
  }

  async adresEkle(cariHesapId: number, dto: CreateCariHesapAdresDto) {
    await this.findOne(cariHesapId)
    const kod = await this.sonrakiAdresKodu(cariHesapId)
    return this.prisma.$transaction(async (tx) => {
      const sayi = await tx.cariHesapAdres.count({ where: { cariHesapId } })
      // Carinin ilk adresi otomatik varsayılan olur.
      const varsayilan = sayi === 0 ? true : (dto.varsayilan ?? false)
      if (varsayilan) {
        await tx.cariHesapAdres.updateMany({ where: { cariHesapId }, data: { varsayilan: false } })
      }
      return tx.cariHesapAdres.create({ data: { ...dto, kod, varsayilan, cariHesapId } })
    })
  }

  async adresGuncelle(adresId: number, dto: UpdateCariHesapAdresDto) {
    const mevcut = await this.prisma.cariHesapAdres.findUnique({ where: { id: adresId } })
    if (!mevcut) throw new NotFoundException('Adres bulunamadı')
    return this.prisma.$transaction(async (tx) => {
      if (dto.varsayilan) {
        await tx.cariHesapAdres.updateMany({
          where: { cariHesapId: mevcut.cariHesapId, id: { not: adresId } },
          data: { varsayilan: false },
        })
      }
      return tx.cariHesapAdres.update({ where: { id: adresId }, data: dto })
    })
  }

  async adresSil(adresId: number) {
    const mevcut = await this.prisma.cariHesapAdres.findUnique({ where: { id: adresId } })
    if (!mevcut) throw new NotFoundException('Adres bulunamadı')
    return this.prisma.$transaction(async (tx) => {
      await tx.cariHesapAdres.delete({ where: { id: adresId } })
      // Varsayılan silindiyse en küçük kodlu adresi varsayılan yap.
      if (mevcut.varsayilan) {
        const ilk = await tx.cariHesapAdres.findFirst({
          where: { cariHesapId: mevcut.cariHesapId },
          orderBy: { kod: 'asc' },
        })
        if (ilk) await tx.cariHesapAdres.update({ where: { id: ilk.id }, data: { varsayilan: true } })
      }
      return { silindi: true }
    })
  }
}
