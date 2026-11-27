import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBankaFisDto, BankaFisHareketDto } from './dto/create-banka-fis.dto'
import { UpdateBankaFisDto } from './dto/update-banka-fis.dto'

const include = {
  hareketler: {
    orderBy: { id: 'asc' as const },
    include: { cariHesap: { select: { kod: true, ad: true } } },
  },
}

const fisDetayInclude = {
  hareketler: {
    orderBy: { id: 'asc' as const },
    include: {
      cariHesap: {
        select: {
          id: true,
          kod: true,
          ad: true,
          musteriHesapKodu: true,
          saticiHesapKodu: true,
        },
      },
    },
  },
}

type FisDetay = Prisma.BankaFisGetPayload<{ include: typeof fisDetayInclude }>
type SatirVerisi = Omit<Prisma.BankaFisHareketCreateManyInput, 'fisId'>
type MahsupSatiri = Omit<Prisma.MuhasebeFisSatirCreateManyInput, 'fisId'>

/** Banka fişinden üretilen mahsup fişlerini işaretler. */
const KAYNAK_TURU = 'BANKA_FIS'
/** Mahsup fişi numarası bu tipte üretilir (fatura/cari hesap fişi ile aynı seri). */
const MAHSUP_FIS_TIPI = '1'

/**
 * Havale fişlerinde cari satırının yönü fiş tipiyle sabittir:
 * gelen havale cariyi alacaklandırır, gönderilen havale borçlandırır.
 */
const HAVALE_CARI_YONU: Record<string, 'borc' | 'alacak'> = { '3': 'alacak', '4': 'borc' }

const metin = (v?: string | null) => {
  const s = (v ?? '').trim()
  return s ? s : null
}

const tarih = (v?: string | null) => {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

const dec = (v: unknown) => new Prisma.Decimal(Number(v ?? 0))

@Injectable()
export class BankaFisService {
  constructor(private prisma: PrismaService) {}

  findAll(fisTipi?: string) {
    return this.prisma.bankaFis.findMany({
      where: fisTipi ? { fisTipi } : undefined,
      orderBy: [{ fisTarihi: 'desc' }, { fisNo: 'desc' }],
      include,
    })
  }

  async findOne(id: number) {
    const fis = await this.prisma.bankaFis.findUnique({ where: { id }, include })
    if (!fis) throw new NotFoundException('Banka fişi bulunamadı')
    return fis
  }

  async sonrakiNo(fisTipi: string) {
    const last = await this.prisma.bankaFis.findFirst({
      where: { fisTipi },
      orderBy: { fisNo: 'desc' },
      select: { fisNo: true },
    })
    return { fisNo: (last?.fisNo ?? 0) + 1 }
  }

  async create(dto: CreateBankaFisDto) {
    this.dogrula(dto)
    const fisTarihi = tarih(dto.fisTarihi)
    if (!fisTarihi) throw new BadRequestException('Fiş tarihi geçersiz')

    for (let deneme = 0; deneme < 5; deneme++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const son = await tx.bankaFis.findFirst({
            where: { fisTipi: dto.fisTipi },
            orderBy: { fisNo: 'desc' },
            select: { fisNo: true },
          })
          const masraf = await this.resolveMasrafYeri(tx, dto)
          const olusan = await tx.bankaFis.create({
            data: {
              ...this.baslikData(dto),
              ...masraf,
              fisTipi: dto.fisTipi,
              fisNo: (son?.fisNo ?? 0) + 1,
              fisTarihi,
              hareketler: { createMany: { data: this.satirDataList(dto, dto.fisTipi) } },
            },
            select: { id: true },
          })
          // Banka fişi de mahsup fişi üretir; yevmiye/cari ekstre tek kaynaktan okunur.
          await this.syncMuhasebeFis(tx, olusan.id)
          return tx.bankaFis.findUnique({ where: { id: olusan.id }, include })
        })
      } catch (e) {
        if (this.tekilHata(e)) continue
        throw e
      }
    }
    throw new BadRequestException('Fiş numarası üretilemedi, tekrar deneyin')
  }

  async update(id: number, dto: UpdateBankaFisDto) {
    const mevcutFis = await this.findOne(id)
    if (dto.hareketler) {
      this.dogrula({ fisTipi: '0', hareketler: dto.hareketler })
    }
    // Fiş tipi kartta değiştirilemez; yön mevcut fişin tipine göre belirlenir.
    const fisTipi = mevcutFis.fisTipi

    return this.prisma.$transaction(async (tx) => {
      const fisTarihi = dto.fisTarihi !== undefined ? tarih(dto.fisTarihi) : undefined
      if (dto.fisTarihi !== undefined && !fisTarihi) throw new BadRequestException('Fiş tarihi geçersiz')
      const masraf = await this.resolveMasrafYeri(tx, dto)

      await tx.bankaFis.update({
        where: { id },
        data: {
          ...this.baslikData(dto),
          ...masraf,
          ...(fisTarihi ? { fisTarihi } : {}),
        },
      })
      if (dto.hareketler) {
        await tx.bankaFisHareket.deleteMany({ where: { fisId: id } })
        const satirlar = this.satirDataList(dto, fisTipi)
        if (satirlar.length) {
          await tx.bankaFisHareket.createMany({
            data: satirlar.map((s) => ({ ...s, fisId: id })),
          })
        }
      }
      await this.syncMuhasebeFis(tx, id)
      return tx.bankaFis.findUnique({ where: { id }, include })
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      await tx.muhasebeFis.deleteMany({ where: { kaynakTuru: KAYNAK_TURU, kaynakId: id } })
      return tx.bankaFis.delete({ where: { id } })
    })
  }

  // ---------- Mahsup fişi üretimi ----------

  private async syncMuhasebeFis(tx: Prisma.TransactionClient, fisId: number) {
    const fis = await tx.bankaFis.findUnique({ where: { id: fisId }, include: fisDetayInclude })
    if (!fis) return

    const mevcut = await tx.muhasebeFis.findFirst({
      where: { kaynakTuru: KAYNAK_TURU, kaynakId: fisId },
      select: { id: true },
    })
    const satirlar = await this.mahsupSatirlari(tx, fis)

    if (!satirlar.length) {
      if (mevcut) await tx.muhasebeFis.delete({ where: { id: mevcut.id } })
      return
    }

    const baslik = {
      fisTarihi: fis.fisTarihi,
      belgeNo: fis.belgeNo,
      k: fis.k,
      ozelKod: fis.ozelKod,
      erisimKodu: fis.erisimKodu,
      aciklama: fis.aciklama ?? `${String(fis.fisNo).padStart(8, '0')} nolu banka fişi`,
      kaynakTuru: KAYNAK_TURU,
      kaynakId: fisId,
      masrafYeri: fis.masrafYeri,
      masrafYeriId: fis.masrafYeriId ?? null,
    }

    if (mevcut) {
      await tx.muhasebeFis.update({ where: { id: mevcut.id }, data: baslik })
      await tx.muhasebeFisSatir.deleteMany({ where: { fisId: mevcut.id } })
      await tx.muhasebeFisSatir.createMany({
        data: satirlar.map((s) => ({ ...s, fisId: mevcut.id })),
      })
      return
    }

    for (let deneme = 0; deneme < 5; deneme++) {
      try {
        const son = await tx.muhasebeFis.findFirst({
          where: { fisTipi: MAHSUP_FIS_TIPI },
          orderBy: { fisNo: 'desc' },
          select: { fisNo: true },
        })
        await tx.muhasebeFis.create({
          data: {
            fisTipi: MAHSUP_FIS_TIPI,
            fisNo: (son?.fisNo ?? 0) + 1,
            ...baslik,
            satirlar: { create: satirlar },
          },
        })
        return
      } catch (e) {
        if (this.tekilHata(e)) continue
        throw e
      }
    }
    throw new BadRequestException('Mahsup fiş numarası üretilemedi, tekrar deneyin')
  }

  private async mahsupSatirlari(tx: Prisma.TransactionClient, fis: FisDetay): Promise<MahsupSatiri[]> {
    const satirlar: MahsupSatiri[] = []

    for (const h of fis.hareketler) {
      const borc = Number(h.borcYerel ?? 0)
      const alacak = Number(h.alacakYerel ?? 0)
      if (borc === 0 && alacak === 0) continue

      const cariKodu = await this.cariHesapKodu(tx, h.cariHesap, borc)
      const dovizTutari = dec(Number(h.borc ?? 0) + Number(h.alacak ?? 0))

      satirlar.push({
        hesapKodu: cariKodu,
        hesapAdi: h.cariHesap?.ad ?? null,
        cariHesapId: h.cariHesapId,
        ozelKod: h.ozelKod ?? null,
        aciklama: h.aciklama ?? fis.aciklama ?? null,
        vadeTarihi: h.vadeTarihi ?? null,
        miktar: null,
        belgeNo: h.belgeNo ?? fis.belgeNo ?? null,
        doviz: h.doviz ?? fis.dovizCinsi ?? null,
        dovizKuru: h.dovizKuru ?? null,
        dovizTutari,
        borc: dec(borc),
        alacak: dec(alacak),
      })

      const karsiKod = metin(h.hesapKodu)
      if (!karsiKod) continue
      if (karsiKod === cariKodu) {
        throw new BadRequestException(
          `Karşı hesap, cari hesabın kendi hesap kodundan farklı olmalıdır (${cariKodu})`,
        )
      }
      const karsiHesap = await tx.muhasebeHesap.findUnique({
        where: { kod: karsiKod },
        select: { ad: true },
      })
      if (!karsiHesap) {
        throw new BadRequestException(`Hesap planında bulunamadı: ${karsiKod}`)
      }

      satirlar.push({
        hesapKodu: karsiKod,
        hesapAdi: karsiHesap.ad,
        cariHesapId: null,
        ozelKod: h.ozelKod ?? null,
        aciklama: h.aciklama ?? fis.aciklama ?? null,
        vadeTarihi: h.vadeTarihi ?? null,
        miktar: null,
        belgeNo: h.belgeNo ?? fis.belgeNo ?? null,
        doviz: h.doviz ?? fis.dovizCinsi ?? null,
        dovizKuru: h.dovizKuru ?? null,
        dovizTutari,
        borc: dec(alacak),
        alacak: dec(borc),
      })
    }

    let toplamBorc = new Prisma.Decimal(0)
    let toplamAlacak = new Prisma.Decimal(0)
    for (const s of satirlar) {
      toplamBorc = toplamBorc.add(Number(s.borc ?? 0))
      toplamAlacak = toplamAlacak.add(Number(s.alacak ?? 0))
    }
    if (!toplamBorc.equals(toplamAlacak)) {
      throw new BadRequestException(
        'Banka fişi dengelenmiyor: her satıra karşı hesap kodu girin veya virman satırlarını tamamlayın',
      )
    }
    return satirlar
  }

  /**
   * Cari satırının kendi hesap kodu: borç için müşteri, alacak için satıcı hesabı.
   * Tanımlı değilse hesap planındaki 120/320 kök hesabı kullanılır.
   */
  private async cariHesapKodu(
    tx: Prisma.TransactionClient,
    cari: FisDetay['hareketler'][number]['cariHesap'],
    borc: number,
  ) {
    if (!cari) throw new BadRequestException('Satırda cari hesap seçilmelidir')
    const aday =
      borc > 0
        ? cari.musteriHesapKodu ?? cari.saticiHesapKodu
        : cari.saticiHesapKodu ?? cari.musteriHesapKodu
    if (aday) return aday

    const kok = borc > 0 ? '120' : '320'
    const hesap = await tx.muhasebeHesap.findFirst({
      where: { kod: { startsWith: kok } },
      orderBy: { kod: 'asc' },
      select: { kod: true },
    })
    return hesap?.kod ?? kok
  }

  private baslikData(dto: CreateBankaFisDto | UpdateBankaFisDto) {
    const data: Record<string, unknown> = {}
    const metinAlanlari = ['belgeNo', 'k', 'erisimKodu', 'ozelKod', 'dovizCinsi', 'aciklama'] as const
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

  private async resolveMasrafYeri(tx: Prisma.TransactionClient, dto: CreateBankaFisDto | UpdateBankaFisDto) {
    const hasId = 'masrafYeriId' in dto
    const hasKod = 'masrafYeri' in dto
    if (!hasId && !hasKod) return {}
    const id = hasId ? ((dto as any).masrafYeriId ?? null) : null
    const kod = hasKod ? metin((dto as any).masrafYeri) : null
    if (id != null) {
      const kayit = await tx.masrafYeri.findUnique({ where: { id: Number(id) } })
      if (!kayit) throw new BadRequestException('Masraf yeri bulunamadı')
      if (!kayit.kullanimda) throw new BadRequestException('Masraf yeri pasif')
      return { masrafYeriId: kayit.id, masrafYeri: kayit.kod }
    }
    if (kod) {
      const kayit = await tx.masrafYeri.findUnique({ where: { kod } })
      if (!kayit) throw new BadRequestException('Masraf yeri bulunamadı')
      if (!kayit.kullanimda) throw new BadRequestException('Masraf yeri pasif')
      return { masrafYeriId: kayit.id, masrafYeri: kayit.kod }
    }
    return { masrafYeriId: null, masrafYeri: null }
  }

  private satirDataList(
    dto: CreateBankaFisDto | UpdateBankaFisDto,
    fisTipi: string,
  ): SatirVerisi[] {
    const baslikKur = Number(dto.dovizKuru) > 0 ? new Prisma.Decimal(Number(dto.dovizKuru)) : new Prisma.Decimal(1)
    return (dto.hareketler ?? []).map((s) => this.satirData(s, baslikKur, dto.dovizCinsi ?? null, fisTipi))
  }

  private satirData(
    s: BankaFisHareketDto,
    baslikKur: Prisma.Decimal,
    baslikDoviz: string | null,
    fisTipi: string,
  ): SatirVerisi {
    const kur = Number(s.dovizKuru) > 0 ? new Prisma.Decimal(Number(s.dovizKuru)) : baslikKur
    // Havale fişinde tutar, fiş tipinin belirlediği cari yönüne yazılır; ters kolona
    // girilmiş olsa bile doğru tarafa taşınır (gelen: alacak, gönderilen: borç).
    const yon = HAVALE_CARI_YONU[fisTipi]
    const girilenBorc = Number(s.borc ?? 0)
    const girilenAlacak = Number(s.alacak ?? 0)
    const borc = new Prisma.Decimal(yon === 'alacak' ? 0 : girilenBorc + (yon === 'borc' ? girilenAlacak : 0))
    const alacak = new Prisma.Decimal(yon === 'borc' ? 0 : girilenAlacak + (yon === 'alacak' ? girilenBorc : 0))
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

  private dogrula(dto: { fisTipi: string; hareketler?: BankaFisHareketDto[] }) {
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
