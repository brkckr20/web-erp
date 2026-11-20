import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRolDto, UpdateRolDto } from './dto/rol.dto'

const rolInclude: Prisma.RolInclude = {
  izinler: { select: { izinId: true, izin: { select: { id: true, kod: true, ad: true } } } },
  _count: { select: { kullanicilar: true } },
}

@Injectable()
export class RolService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.rol.findMany({ orderBy: { ad: 'asc' }, include: rolInclude })
  }

  async findOne(id: number) {
    const rol = await this.prisma.rol.findUnique({ where: { id }, include: rolInclude })
    if (!rol) throw new NotFoundException('Rol bulunamadı')
    return rol
  }

  izinler() {
    return this.prisma.izin.findMany({ orderBy: { kod: 'asc' } })
  }

  async create(dto: CreateRolDto) {
    const ad = String(dto?.ad ?? '').trim()
    if (!ad) throw new BadRequestException('Rol adı zorunludur')
    const izinIdler = await this.izinleriHazirla(dto?.izinIdler)
    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.rol.create({
          data: {
            ad,
            aciklama: String(dto?.aciklama ?? '').trim() || null,
            aktif: dto?.aktif !== false,
            izinler: { create: izinIdler.map((izinId) => ({ izinId })) },
          },
        })
        return tx.rol.findUnique({ where: { id: created.id }, include: rolInclude })
      })
    } catch (e) {
      this.hataCevir(e)
    }
  }

  async update(id: number, dto: UpdateRolDto) {
    await this.findOne(id)
    const ad = String(dto?.ad ?? '').trim()
    if (!ad) throw new BadRequestException('Rol adı zorunludur')
    const izinIdler = await this.izinleriHazirla(dto?.izinIdler)
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.rol.update({
          where: { id },
          data: {
            ad,
            aciklama: String(dto?.aciklama ?? '').trim() || null,
            aktif: dto?.aktif !== false,
          },
        })
        await tx.rolIzin.deleteMany({ where: { rolId: id } })
        if (izinIdler.length > 0) {
          await tx.rolIzin.createMany({
            data: izinIdler.map((izinId) => ({ rolId: id, izinId })),
          })
        }
        return tx.rol.findUnique({ where: { id }, include: rolInclude })
      })
    } catch (e) {
      this.hataCevir(e)
    }
  }

  async remove(id: number) {
    const rol = await this.findOne(id)
    if (rol._count.kullanicilar > 0) {
      throw new BadRequestException(
        `Bu role atanmış ${rol._count.kullanicilar} kullanıcı var; silmek için önce rollerini değiştirin`,
      )
    }
    await this.prisma.rol.delete({ where: { id } })
    return { id }
  }

  private async izinleriHazirla(izinIdler?: number[]): Promise<number[]> {
    if (!Array.isArray(izinIdler)) return []
    const tekil = [...new Set(izinIdler.map(Number).filter((n) => Number.isInteger(n) && n > 0))]
    if (tekil.length === 0) return []
    const bulunan = await this.prisma.izin.findMany({
      where: { id: { in: tekil } },
      select: { id: true, kod: true },
    })
    if (bulunan.length !== tekil.length) {
      throw new BadRequestException('Geçersiz izin seçimi')
    }
    const turetilen = await this.modulIzinleriniTuret(bulunan.map((i) => i.kod))
    return [...new Set([...tekil, ...turetilen])]
  }

  // Ekran izinleri ince taneli, API kontrolleri ise modül kodlarıyla kaba çalışır.
  // ekran.<modul>.<ekran>.<islem> varsa modülün <modul>.<islem> izni de role yazılır.
  private async modulIzinleriniTuret(kodlar: string[]): Promise<number[]> {
    const modulKodlari = new Set<string>()
    for (const kod of kodlar) {
      const parca = kod.split('.')
      if (parca.length === 4 && parca[0] === 'ekran') {
        modulKodlari.add(`${parca[1]}.${parca[3]}`)
      }
    }
    if (modulKodlari.size === 0) return []
    const modulIzinleri = await this.prisma.izin.findMany({
      where: { kod: { in: [...modulKodlari] } },
      select: { id: true },
    })
    return modulIzinleri.map((i) => i.id)
  }

  private hataCevir(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new BadRequestException('Bu rol adı zaten kullanılıyor')
    }
    throw e
  }
}
