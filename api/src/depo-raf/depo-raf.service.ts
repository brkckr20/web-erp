import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDepoRafDto } from './dto/create-depo-raf.dto'
import { UpdateDepoRafDto } from './dto/update-depo-raf.dto'

const DEPO_SECIMI = { id: true, kod: true, ad: true }

@Injectable()
export class DepoRafService {
  constructor(private prisma: PrismaService) {}

  private sayi(deger: string | undefined, alan: string): number | undefined {
    if (deger === undefined || deger === null || deger === '') return undefined
    const n = Number(deger)
    if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(`${alan} geçersiz`)
    return n
  }

  private temizle(deger?: string | null): string | null {
    const s = deger?.trim()
    return s ? s : null
  }

  private async depoBul(id: number) {
    const depo = await this.prisma.depo.findUnique({ where: { id }, select: DEPO_SECIMI })
    if (!depo) throw new NotFoundException(`Depo bulunamadı: ${id}`)
    return depo
  }

  private async kodDogrula(depoId: number, kod: string, haricId?: number) {
    const varMi = await this.prisma.depoRaf.findUnique({
      where: { depoId_kod: { depoId, kod } },
      select: { id: true },
    })
    if (varMi && varMi.id !== haricId) {
      throw new ConflictException(`Bu depoda "${kod}" kodlu raf zaten tanımlı`)
    }
  }

  private p2002Cevir(hata: unknown): never {
    const hedef = hata as { code?: string }
    if (hedef?.code === 'P2002') {
      throw new ConflictException('Bu depoda aynı raf kodu zaten tanımlı')
    }
    throw hata
  }

  async findAll(depoId?: string, aktif?: string) {
    const where: any = {}
    const depo = this.sayi(depoId, 'depoId')
    if (depo) where.depoId = depo
    if (aktif === 'true' || aktif === 'false') where.aktif = aktif === 'true'
    return this.prisma.depoRaf.findMany({
      where,
      include: { depo: { select: DEPO_SECIMI } },
      orderBy: [{ depo: { kod: 'asc' } }, { sira: 'asc' }, { kod: 'asc' }],
    })
  }

  async findOne(id: number) {
    const raf = await this.prisma.depoRaf.findUnique({ where: { id }, include: { depo: { select: DEPO_SECIMI } } })
    if (!raf) throw new NotFoundException('Raf bulunamadı')
    return raf
  }

  async create(dto: CreateDepoRafDto) {
    const depoId = this.sayi(dto.depoId != null ? String(dto.depoId) : undefined, 'depoId')
    if (!depoId) throw new BadRequestException('Depo seçimi zorunludur')
    const kod = dto.kod?.trim()
    if (!kod) throw new BadRequestException('Raf kodu zorunludur')
    const ad = dto.ad?.trim()
    if (!ad) throw new BadRequestException('Raf adı zorunludur')
    if (dto.kapasite != null && Number(dto.kapasite) < 0) {
      throw new BadRequestException('Kapasite negatif olamaz')
    }
    await this.depoBul(depoId)
    await this.kodDogrula(depoId, kod)

    try {
      return await this.prisma.depoRaf.create({
        data: {
          depoId,
          kod,
          ad,
          kat: dto.kat ?? 0,
          rafTipi: this.temizle(dto.rafTipi),
          kapasite: dto.kapasite ?? null,
          kapasiteBirimi: this.temizle(dto.kapasiteBirimi),
          aktif: dto.aktif ?? true,
          sira: dto.sira ?? 0,
          aciklama: this.temizle(dto.aciklama),
        },
        include: { depo: { select: DEPO_SECIMI } },
      })
    } catch (hata) {
      this.p2002Cevir(hata)
    }
  }

  async update(id: number, dto: UpdateDepoRafDto) {
    const mevcut = await this.findOne(id)
    const depoId = this.sayi(dto.depoId != null ? String(dto.depoId) : undefined, 'depoId') ?? mevcut.depoId
    const kod = dto.kod?.trim() || mevcut.kod
    const ad = dto.ad?.trim() || mevcut.ad
    if (dto.kapasite != null && Number(dto.kapasite) < 0) {
      throw new BadRequestException('Kapasite negatif olamaz')
    }
    await this.depoBul(depoId)
    await this.kodDogrula(depoId, kod, id)

    try {
      return await this.prisma.depoRaf.update({
        where: { id },
        data: {
          depoId,
          kod,
          ad,
          kat: dto.kat ?? mevcut.kat,
          rafTipi: dto.rafTipi !== undefined ? this.temizle(dto.rafTipi) : mevcut.rafTipi,
          kapasite: dto.kapasite !== undefined ? dto.kapasite : mevcut.kapasite,
          kapasiteBirimi: dto.kapasiteBirimi !== undefined ? this.temizle(dto.kapasiteBirimi) : mevcut.kapasiteBirimi,
          aktif: dto.aktif ?? mevcut.aktif,
          sira: dto.sira ?? mevcut.sira,
          aciklama: dto.aciklama !== undefined ? this.temizle(dto.aciklama) : mevcut.aciklama,
        },
        include: { depo: { select: DEPO_SECIMI } },
      })
    } catch (hata) {
      this.p2002Cevir(hata)
    }
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.depoRaf.delete({ where: { id } })
  }
}
