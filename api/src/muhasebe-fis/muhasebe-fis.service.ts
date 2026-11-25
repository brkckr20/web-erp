import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMuhasebeFisDto, MuhasebeFisSatirDto } from './dto/create-muhasebe-fis.dto'
import { UpdateMuhasebeFisDto } from './dto/update-muhasebe-fis.dto'

const include = {
  fasonTipi: { select: { id: true, ad: true } },
  satirlar: { orderBy: { id: 'asc' as const }, include: { cariHesap: { select: { kod: true, ad: true } } } },
}

const metin = (v?: string | null) => { const s = (v ?? '').trim(); return s ? s : null }
const tarih = (v?: string | null) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d }
const dec = (v: unknown, def = 0) => { const n = Number(v ?? def); return isNaN(n) ? new Prisma.Decimal(def) : new Prisma.Decimal(n) }

@Injectable()
export class MuhasebeFisService {
  constructor(private prisma: PrismaService) {}

  findAll(fisTipi?: string) {
    return this.prisma.muhasebeFis.findMany({
      where: fisTipi ? { fisTipi } : undefined,
      orderBy: [{ fisTarihi: 'desc' }, { fisNo: 'desc' }],
      include,
    })
  }

  async findOne(id: number) {
    const fis = await this.prisma.muhasebeFis.findUnique({ where: { id }, include })
    if (!fis) throw new NotFoundException('Muhasebe fişi bulunamadı')
    return fis
  }

  async create(dto: CreateMuhasebeFisDto) {
    this.dogrula(dto)
    const fisTarihi = tarih(dto.fisTarihi)
    if (!fisTarihi) throw new BadRequestException('Fiş tarihi geçersiz')

    for (let deneme = 0; deneme < 5; deneme++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const son = await tx.muhasebeFis.findFirst({ where: { fisTipi: dto.fisTipi }, orderBy: { fisNo: 'desc' }, select: { fisNo: true } })
          return tx.muhasebeFis.create({
            data: {
              fisTipi: dto.fisTipi,
              fisNo: (son?.fisNo ?? 0) + 1,
              fisTarihi,
              ...this.baslikData(dto),
              satirlar: { create: this.satirDataList(dto.satirlar) },
            },
            include,
          })
        })
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
        throw e
      }
    }
    throw new BadRequestException('Fiş numarası üretilemedi')
  }

  async update(id: number, dto: UpdateMuhasebeFisDto) {
    await this.findOne(id)
    if (dto.satirlar) this.dogrulaSatirlar(dto.satirlar)
    return this.prisma.$transaction(async (tx) => {
      const fisTarihi = dto.fisTarihi !== undefined ? tarih(dto.fisTarihi) : undefined
      if (dto.fisTarihi !== undefined && !fisTarihi) throw new BadRequestException('Fiş tarihi geçersiz')
      await tx.muhasebeFis.update({ where: { id }, data: { ...this.baslikData(dto), ...(fisTarihi ? { fisTarihi } : {}) } })
      if (dto.satirlar) {
        await tx.muhasebeFisSatir.deleteMany({ where: { fisId: id } })
        if (dto.satirlar.length) await tx.muhasebeFisSatir.createMany({ data: this.satirDataList(dto.satirlar).map((s) => ({ ...s, fisId: id })) })
      }
      return tx.muhasebeFis.findUnique({ where: { id }, include })
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.muhasebeFis.delete({ where: { id } })
  }

  private baslikData(dto: CreateMuhasebeFisDto | UpdateMuhasebeFisDto) {
    const data: any = {}
    for (const k of ['belgeNo', 'k', 'ozelKod', 'erisimKodu', 'aciklama', 'kaynakTuru'] as const) {
      if (k in dto) data[k] = metin((dto as any)[k])
    }
    if ('kaynakId' in dto) data.kaynakId = dto.kaynakId ?? null
    if ('fasonTipiId' in dto) data.fasonTipiId = dto.fasonTipiId ?? null
    if ('masrafYeri' in dto) data.masrafYeri = metin((dto as any).masrafYeri)
    return data
  }

  private satirDataList(satirlar: MuhasebeFisSatirDto[]) {
    return satirlar.map((s) => {
      const borc = dec(s.borc)
      const alacak = dec(s.alacak)
      return {
        hesapKodu: (s.hesapKodu ?? '').trim(),
        hesapAdi: metin(s.hesapAdi),
        cariHesapId: s.cariHesapId ?? null,
        ozelKod: metin(s.ozelKod),
        aciklama: metin(s.aciklama),
        vadeTarihi: tarih(s.vadeTarihi),
        miktar: s.miktar == null ? null : dec(s.miktar),
        belgeNo: metin(s.belgeNo),
        doviz: metin(s.doviz),
        dovizKuru: s.dovizKuru == null ? null : dec(s.dovizKuru),
        dovizTutari: s.dovizTutari == null ? null : dec(s.dovizTutari),
        borc,
        alacak,
      }
    })
  }

  private dogrula(dto: CreateMuhasebeFisDto) {
    if (!dto.fisTipi?.trim()) throw new BadRequestException('Fiş tipi zorunludur')
    this.dogrulaSatirlar(dto.satirlar ?? [])
  }

  private dogrulaSatirlar(satirlar: MuhasebeFisSatirDto[]) {
    if (!satirlar.length) throw new BadRequestException('En az bir fiş satırı girilmelidir')
    let borc = new Prisma.Decimal(0)
    let alacak = new Prisma.Decimal(0)
    for (const s of satirlar) {
      if (!s.hesapKodu?.trim()) throw new BadRequestException('Satırda hesap kodu zorunludur')
      const b = Number(s.borc ?? 0)
      const a = Number(s.alacak ?? 0)
      if (isNaN(b) || isNaN(a) || b < 0 || a < 0) throw new BadRequestException('Satır tutarı geçersiz')
      if (b > 0 && a > 0) throw new BadRequestException('Satırda borç ve alacak aynı anda girilemez')
      if (b === 0 && a === 0) throw new BadRequestException('Satırda borç veya alacak girilmelidir')
      borc = borc.add(b)
      alacak = alacak.add(a)
    }
    if (!borc.equals(alacak)) throw new BadRequestException('Fiş borç ve alacak toplamı eşit olmalıdır')
  }
}
