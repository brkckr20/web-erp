import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCariHesapFisDto, CariHesapHareketDto } from './dto/create-cari-hesap-fis.dto'
import { UpdateCariHesapFisDto } from './dto/update-cari-hesap-fis.dto'

const include = {
  hareketler: {
    orderBy: { id: 'asc' as const },
    include: { cariHesap: { select: { kod: true, ad: true } } },
  },
}

type SatirVerisi = Omit<Prisma.CariHesapHareketCreateManyInput, 'fisId'>

const metin = (v?: string | null) => {
  const s = (v ?? '').trim()
  return s ? s : null
}

const tarih = (v?: string | null) => {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

@Injectable()
export class CariHesapFisService {
  constructor(private prisma: PrismaService) {}

  findAll(fisTipi?: string) {
    return this.prisma.cariHesapFis.findMany({
      where: fisTipi ? { fisTipi } : undefined,
      orderBy: [{ fisTarihi: 'desc' }, { fisNo: 'desc' }],
      include,
    })
  }

  async findOne(id: number) {
    const fis = await this.prisma.cariHesapFis.findUnique({ where: { id }, include })
    if (!fis) throw new NotFoundException('Cari hesap fişi bulunamadı')
    return fis
  }

  async sonrakiNo(fisTipi: string) {
    const last = await this.prisma.cariHesapFis.findFirst({
      where: { fisTipi },
      orderBy: { fisNo: 'desc' },
      select: { fisNo: true },
    })
    return { fisNo: (last?.fisNo ?? 0) + 1 }
  }

  async create(dto: CreateCariHesapFisDto) {
    this.dogrula(dto)
    const fisTarihi = tarih(dto.fisTarihi)
    if (!fisTarihi) throw new BadRequestException('Fiş tarihi geçersiz')

    for (let deneme = 0; deneme < 5; deneme++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const son = await tx.cariHesapFis.findFirst({
            where: { fisTipi: dto.fisTipi },
            orderBy: { fisNo: 'desc' },
            select: { fisNo: true },
          })
          return tx.cariHesapFis.create({
            data: {
              ...this.baslikData(dto),
              fisTipi: dto.fisTipi,
              fisNo: (son?.fisNo ?? 0) + 1,
              fisTarihi,
              hareketler: { createMany: { data: this.satirDataList(dto) } },
            },
            include,
          })
        })
      } catch (e) {
        if (this.tekilHata(e)) continue
        throw e
      }
    }
    throw new BadRequestException('Fiş numarası üretilemedi, tekrar deneyin')
  }

  async update(id: number, dto: UpdateCariHesapFisDto) {
    await this.findOne(id)
    if (dto.hareketler) {
      this.dogrula({ fisTipi: '0', hareketler: dto.hareketler })
    }

    return this.prisma.$transaction(async (tx) => {
      const fisTarihi = dto.fisTarihi !== undefined ? tarih(dto.fisTarihi) : undefined
      if (dto.fisTarihi !== undefined && !fisTarihi) throw new BadRequestException('Fiş tarihi geçersiz')

      await tx.cariHesapFis.update({
        where: { id },
        data: {
          ...this.baslikData(dto),
          ...(fisTarihi ? { fisTarihi } : {}),
        },
      })
      if (dto.hareketler) {
        await tx.cariHesapHareket.deleteMany({ where: { fisId: id } })
        const satirlar = this.satirDataList(dto)
        if (satirlar.length) {
          await tx.cariHesapHareket.createMany({
            data: satirlar.map((s) => ({ ...s, fisId: id })),
          })
        }
      }
      return tx.cariHesapFis.findUnique({ where: { id }, include })
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.cariHesapFis.delete({ where: { id } })
  }

  private baslikData(dto: CreateCariHesapFisDto | UpdateCariHesapFisDto) {
    const data: Record<string, unknown> = {}
    const metinAlanlari = ['belgeNo', 'k', 'erisimKodu', 'ozelKod', 'dovizCinsi', 'masrafYeri', 'aciklama'] as const
    for (const alan of metinAlanlari) {
      if (alan in dto) {
        data[alan] = metin((dto as Record<string, unknown>)[alan] as string | null | undefined)
      }
    }
    if ('dovizKuru' in dto) {
      const ham = dto.dovizKuru
      const kur = Number(ham)
      data.dovizKuru = ham != null && ham !== '' && !isNaN(kur) ? new Prisma.Decimal(kur) : null
    }
    if ('kurTarihi' in dto) data.kurTarihi = tarih(dto.kurTarihi)
    return data
  }

  private satirDataList(dto: CreateCariHesapFisDto | UpdateCariHesapFisDto): SatirVerisi[] {
    const baslikKur = Number(dto.dovizKuru) > 0 ? new Prisma.Decimal(Number(dto.dovizKuru)) : new Prisma.Decimal(1)
    return (dto.hareketler ?? []).map((s) => this.satirData(s, baslikKur, dto.dovizCinsi ?? null))
  }

  private satirData(s: CariHesapHareketDto, baslikKur: Prisma.Decimal, baslikDoviz: string | null): SatirVerisi {
    const kur = Number(s.dovizKuru) > 0 ? new Prisma.Decimal(Number(s.dovizKuru)) : baslikKur
    const borc = new Prisma.Decimal(Number(s.borc ?? 0))
    const alacak = new Prisma.Decimal(Number(s.alacak ?? 0))
    return {
      cariHesapId: s.cariHesapId,
      ozelKod: metin(s.ozelKod),
      hesapKodu: metin(s.hesapKodu),
      hesapAdi: metin(s.hesapAdi),
      aciklama: metin(s.aciklama),
      vadeTarihi: tarih(s.vadeTarihi),
      belgeNo: metin(s.belgeNo),
      borc,
      alacak,
      doviz: metin(s.doviz) ?? metin(baslikDoviz),
      dovizKuru: kur,
      borcYerel: borc.mul(kur).toDecimalPlaces(2),
      alacakYerel: alacak.mul(kur).toDecimalPlaces(2),
      belgeTuru: metin(s.belgeTuru),
      belgeId: s.belgeId ?? null,
      kontrol: metin(s.kontrol),
    }
  }

  private dogrula(dto: { fisTipi: string; hareketler?: CariHesapHareketDto[] }) {
    if (!dto.fisTipi?.trim()) throw new BadRequestException('Fiş tipi zorunludur')
    if (!dto.hareketler?.length) throw new BadRequestException('En az bir fiş satırı girilmelidir')
    for (const s of dto.hareketler) {
      if (!s.cariHesapId) throw new BadRequestException('Satırda cari hesap seçilmelidir')
      const borc = Number(s.borc ?? 0)
      const alacak = Number(s.alacak ?? 0)
      if (isNaN(borc) || isNaN(alacak)) throw new BadRequestException('Satır tutarı geçersiz')
      if (borc < 0 || alacak < 0) throw new BadRequestException('Satır tutarı negatif olamaz')
      if (borc > 0 && alacak > 0) throw new BadRequestException('Satırda borç ve alacak aynı anda girilemez')
      if (borc === 0 && alacak === 0) throw new BadRequestException('Satırda borç veya alacak girilmelidir')
    }
  }

  private tekilHata(e: unknown) {
    return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
  }
}
