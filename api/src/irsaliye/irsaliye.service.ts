import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { UpdateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { CreateIrsaliyeKalemDto } from './dto/create-irsaliye.dto'

function padIrsaliyeNo(n: number): string {
  return n.toString().padStart(8, '0')
}

// Stoku oynatan tipler: fiş oluştuğu anda tamamlanmış sayılır (Depo Bazlı Stok
// yalnızca tamamlandi=1 sayar). Manuel kart bunu frontend'de basar; otomatik
// yollar (201/202'den irsaliye, fatura otomatik irsaliyesi) buradan beslenir.
export const STOK_TAMAMLANDI_TIPLERI = [
  '1', '2', '3', '4', '5', '8', '9', '11', '12',
  '120', '121', '122', '123', '124', '134',
]

export function stokTipiTamamlandi(irsaliyeTipi: any): boolean {
  return STOK_TAMAMLANDI_TIPLERI.includes(String(irsaliyeTipi ?? ''))
}

// Fason fire'ı kalemin ölçü birimine göre brüt − net'ten hesaplanır (Decimal(18,4)).
// İstemciden gelen fire değeri yok sayılır; fire her kayıtta yeniden yazılır.
// kg tarafı brut_agirlik − net_agirlik, mt tarafı brut_metre − net_metre.
// Adet (veya ölçü birimi boş) ölçüsünde fire tutulmaz -> null.
// Giden (brüt) kalemde fire anlamsızdır: henüz dönen mal yoktur, fire ancak
// fason GİRİŞ kaleminde (11) net girildiğinde oluşur -> net yoksa null.
function fireHesapla(k: any): Prisma.Decimal | null {
  const birim = String(k.olcuBirimi ?? '').toLowerCase()
  let brut: any
  let net: any
  if (birim === 'brutkg' || birim === 'kg') {
    brut = k.brutAgirlik
    net = k.netAgirlik
  } else if (birim === 'brutmt' || birim === 'mt') {
    brut = k.brutMetre
    net = k.netMetre
  } else {
    return null
  }
  // Net miktar girilmemişse fire hesaplanamaz (giden kalem, taslak fiş vb.)
  if (net == null || net === '' || net === 0) return null
  if (brut == null || brut === '') return null
  return new Prisma.Decimal(brut).minus(new Prisma.Decimal(net))
}

// Kalem verisini yazmaya hazırlar: ilişki alanlarını temizler, fire'ı hesaplar.
function kalemDataHazirla(k: any): any {
  const { id: _id, malzeme: _malzeme, irsaliye: _irsaliye, fire: _fire, tahsisler: _tahsisler, stokTahsisleri: _stokTahsisleri, islemler: _islemler, prosesler: _prosesler, ...rest } = k
  return { ...rest, fire: fireHesapla(k) }
}

const kalemInclude = {
  malzeme: true,
  varyant1Renk: true,
  varyant2Renk: true,
  boyahaneRenk: true,
  tahsisler: true,
  // Serbest ham stoktan sipariş kalemine yapılan elle tahsisler (Tahsis Detayları).
  stokTahsisleri: true,
  islemler: { include: { islem: true } },
}

// Kalem satırına seçilen prosesleri yazar (aynı transaction içinde).
// Silinmiş kartların id'leri atlanır (bayat seçim FK patlatmasın).
async function islemleriYaz(tx: any, irsaliyeKalemId: number, prosesler: { islemId: number; sira?: number }[] | undefined) {
  if (!Array.isArray(prosesler) || prosesler.length === 0) return
  const adaylar = [...new Set(prosesler.map((p) => Number(p?.islemId)).filter((n) => Number.isFinite(n) && n > 0))]
  if (adaylar.length === 0) return
  const mevcutKartlar = await tx.islem.findMany({ where: { id: { in: adaylar } }, select: { id: true } })
  const gecerli = new Set((mevcutKartlar as { id: number }[]).map((r) => r.id))
  const gorulen = new Set<number>()
  let sira = 0
  for (const p of prosesler) {
    const islemId = Number(p?.islemId)
    if (!gecerli.has(islemId) || gorulen.has(islemId)) continue
    gorulen.add(islemId)
    sira += 1
    await tx.irsaliyeKalemIslem.create({ data: { irsaliyeKalemId, islemId, sira: p?.sira ?? sira } })
  }
}

// Kalem satırına bağlı tahsis dağılımını yazar (aynı transaction içinde).
async function tahsisleriYaz(tx: any, irsaliyeKalemId: number, tahsisler: any[] | undefined) {
  if (!Array.isArray(tahsisler) || tahsisler.length === 0) return
  for (const t of tahsisler) {
    const miktar = Number(t.miktar) || 0
    if (!miktar) continue
    await tx.irsaliyeKalemTahsis.create({
      data: {
        irsaliyeKalemId,
        siparisKalemId: t.siparisKalemId ?? null,
        siparisNo: t.siparisNo ?? null,
        modelKod: t.modelKod ?? null,
        miktar: new Prisma.Decimal(miktar),
      },
    })
  }
}

// Bu kalemlerden türetilmiş irsaliye kalemleri (kaynak_kalem_id ile bağlı).
// Skaler FK olduğu için silme öncesi elle kontrol edilir; aksi halde bağ boşa düşer.
async function turetilmisKalemler(tx: Prisma.TransactionClient, kaynakKalemIds: number[]) {
  if (kaynakKalemIds.length === 0) return []
  return tx.irsaliyeKalem.findMany({
    where: { kaynakKalemId: { in: kaynakKalemIds } },
    select: {
      id: true,
      kaynakKalemId: true,
      irsaliye: { select: { id: true, irsaliyeNo: true, irsaliyeTipi: true } },
    },
  })
}

function turetilmisEtiket(
  rows: { irsaliye: { id: number; irsaliyeNo: string | null; irsaliyeTipi: string } }[],
): string {
  return [
    ...new Set(
      rows.map(
        (r) => `${r.irsaliye.irsaliyeTipi}-${r.irsaliye.irsaliyeNo ?? `#${r.irsaliye.id}`}`,
      ),
    ),
  ].join(', ')
}

@Injectable()
export class IrsaliyeService {
  constructor(private prisma: PrismaService) {}

  async nextIrsaliyeNo(irsaliyeTipi: string): Promise<{ irsaliyeNo: string }> {
    const last = await this.prisma.irsaliye.findFirst({
      where: { irsaliyeTipi },
      orderBy: { irsaliyeNo: 'desc' },
      select: { irsaliyeNo: true },
    })
    let next = 1
    if (last?.irsaliyeNo) {
      const parsed = parseInt(last.irsaliyeNo, 10)
      if (!isNaN(parsed)) next = parsed + 1
    }
    return { irsaliyeNo: padIrsaliyeNo(next) }
  }

  findAll(irsaliyeTipi?: string) {
    const where: any = {}
    if (irsaliyeTipi) {
      const tipler = irsaliyeTipi.split(',').map((t) => t.trim())
      where.irsaliyeTipi = { in: tipler }
    }
    return this.prisma.irsaliye.findMany({
      where,
      orderBy: [{ irsaliyeTipi: 'asc' }, { irsaliyeNo: 'desc' }],
      include: {
        cariHesap: true,
        depo: true,
        fasonTipi: true,
        nakliyeci: true,
        kalemler: { include: kalemInclude },
      },
    })
  }

  // e-İrsaliye listesi: tüm modüllerdeki (malzeme fişleri + satış irsaliyeleri)
  // e-İrsaliye oluşturulmuş kayıtlar. Ekran yalnızca belge başlığını gösterir,
  // kalemler taşınmaz.
  eIrsaliyeListesi() {
    return this.prisma.irsaliye.findMany({
      where: { eIrsaliyeNo: { not: null } },
      orderBy: [{ eIrsaliyeNo: 'desc' }],
      select: {
        id: true,
        irsaliyeNo: true,
        irsaliyeTipi: true,
        irsaliyeTarihi: true,
        kayitYapan: true,
        eIrsaliyeNo: true,
        eIrsaliyeDurum: true,
        ettnNo: true,
        xsltDosyaAdi: true,
        cariHesap: { select: { kod: true, ad: true } },
        depo: { select: { kod: true } },
      },
    })
  }

  async findOne(id: number) {
    const irsaliye = await this.prisma.irsaliye.findUnique({
      where: { id },
      include: {
        cariHesap: true,
        depo: true,
        fasonTipi: true,
        nakliyeci: true,
        kalemler: { include: kalemInclude },
      },
    })
    if (!irsaliye) throw new NotFoundException('İrsaliye bulunamadı')
    return irsaliye
  }

  /**
   * Tamamlanmış 10-Üretim fişi satırlarını ilgili sipariş kalemine bağlar.
   * Satırın barkodu (takipNo) KK kalemine, oradan KK iş emrine ve sipariş numarasına
   * çözülür. Siparişte o malzemeye düşen TEK sipariş kalemi varsa satır doğrudan
   * siparis_kalem_id ile bağlanır; Kumaş Planlama bu satırı "Ham Stok" sayar.
   * Aday kalemler tedarik_ihtiyac'tan gelir: siparis_kalem.malzeme_id MODEL
   * malzemesidir, kumaş satırını tutmaz.
   * Birden fazla eşleşme varsa yanlış siparişe bağlamamak için dokunulmaz (elle tahsis).
   * Zaten bağlı ve malzemesi tutan satırlar korunur.
   */
  async sipariseTahsisEt(
    tx: Prisma.TransactionClient,
    irsaliyeId: number,
    varsayilanIsEmriId?: number | null,
  ): Promise<{ baglanan: number; belirsiz: number }> {
    const sonuc = { baglanan: 0, belirsiz: 0 }
    const fis = await tx.irsaliye.findUnique({
      where: { id: irsaliyeId },
      select: {
        irsaliyeTipi: true,
        tamamlandi: true,
        kalemler: { select: { id: true, malzemeId: true, takipNo: true, siparisKalemId: true } },
      },
    })
    if (!fis || fis.irsaliyeTipi !== '10' || !fis.tamamlandi || fis.kalemler.length === 0) return sonuc

    // Mevcut bağlar: siparişi de taşınır, satırın malzemesi değişmişse bağ tazelenir.
    const bagliIds = [
      ...new Set(fis.kalemler.map((k) => k.siparisKalemId).filter((v): v is number => v != null)),
    ]
    const baglilar = bagliIds.length
      ? await tx.siparisKalem.findMany({
          where: { id: { in: bagliIds } },
          select: { id: true, siparisId: true },
        })
      : []
    const bagliMap = new Map(baglilar.map((k) => [k.id, k]))

    // Barkod → KK iş emri (aynı barkod birden fazla KK'da olsa en yenisi geçerli).
    const barkodlar = [
      ...new Set(fis.kalemler.map((k) => k.takipNo).filter((b): b is string => !!b && b.trim() !== '')),
    ]
    const kkKalemler = barkodlar.length
      ? await tx.kaliteKontrolKalem.findMany({
          where: { barkod: { in: barkodlar } },
          select: {
            barkod: true,
            isEmriNo: true,
            fis: { select: { isEmriId: true, isEmriNo: true } },
          },
          orderBy: { id: 'desc' },
        })
      : []
    const barkodIsEmri = new Map<string, { id: number | null; no: string | null }>()
    for (const k of kkKalemler) {
      if (!k.barkod || barkodIsEmri.has(k.barkod)) continue
      barkodIsEmri.set(k.barkod, {
        id: k.fis?.isEmriId ?? null,
        // Fiş seviyesinde iş emri yoksa satırdaki iş emri no'su kullanılır.
        no: k.fis?.isEmriNo ?? k.isEmriNo ?? null,
      })
    }

    const siparisNoOnbellek = new Map<string, string | null>()
    const siparisNoBul = async (isEmriId: number | null, isEmriNo: string | null) => {
      const anahtar = isEmriId != null ? `id:${isEmriId}` : isEmriNo ? `no:${isEmriNo}` : ''
      if (!anahtar) return null
      if (siparisNoOnbellek.has(anahtar)) return siparisNoOnbellek.get(anahtar)!
      const ie =
        isEmriId != null
          ? await tx.isEmri.findUnique({ where: { id: isEmriId }, select: { siparisNo: true } })
          : await tx.isEmri.findUnique({ where: { isEmriNo: isEmriNo! }, select: { siparisNo: true } })
      const siparisNo = ie?.siparisNo ?? null
      siparisNoOnbellek.set(anahtar, siparisNo)
      return siparisNo
    }

    const siparisIdOnbellek = new Map<string, number | null>()
    const siparisIdBul = async (siparisNo: string) => {
      if (siparisIdOnbellek.has(siparisNo)) return siparisIdOnbellek.get(siparisNo)!
      const s = await tx.siparis.findUnique({ where: { siparisNo }, select: { id: true } })
      const id = s?.id ?? null
      siparisIdOnbellek.set(siparisNo, id)
      return id
    }

    // Kumaş ihtiyacı sipariş kalemi + malzeme eşleşmesini verir. siparis_kalem.malzeme_id
    // model malzemesi olduğu için oradan aranmaz.
    const kalemOnbellek = new Map<string, number[]>()
    const adayKalemler = async (siparisId: number, malzemeId: number) => {
      const anahtar = `${siparisId}:${malzemeId}`
      const onbellek = kalemOnbellek.get(anahtar)
      if (onbellek) return onbellek
      const rows = await tx.tedarikIhtiyac.findMany({
        where: { siparisId, malzemeId },
        select: { siparisKalemId: true },
      })
      const adaylar = [...new Set(rows.map((r) => r.siparisKalemId))]
      kalemOnbellek.set(anahtar, adaylar)
      return adaylar
    }

    for (const k of fis.kalemler) {
      if (k.malzemeId == null) continue

      // Bağlı kalem hâlâ bu malzemenin ihtiyacındaysa dokunulmaz.
      const mevcut = k.siparisKalemId != null ? bagliMap.get(k.siparisKalemId) : null
      if (mevcut && (await adayKalemler(mevcut.siparisId, k.malzemeId)).includes(mevcut.id)) continue

      const kkIsEmri = k.takipNo ? barkodIsEmri.get(k.takipNo) : undefined
      const siparisNo =
        (await siparisNoBul(kkIsEmri?.id ?? null, kkIsEmri?.no ?? null)) ??
        (await siparisNoBul(varsayilanIsEmriId ?? null, null))
      const siparisId = siparisNo ? await siparisIdBul(siparisNo) : null
      const adaylar = siparisId != null ? await adayKalemler(siparisId, k.malzemeId) : []

      if (adaylar.length === 1) {
        await tx.irsaliyeKalem.update({
          where: { id: k.id },
          data: { siparisKalemId: adaylar[0] },
        })
        sonuc.baglanan += 1
      } else if (adaylar.length > 1) {
        // Belirsiz eşleşme: eski (artık tutmayan) bağ varsa temizlenir, elle tahsise bırakılır.
        if (k.siparisKalemId != null) {
          await tx.irsaliyeKalem.update({ where: { id: k.id }, data: { siparisKalemId: null } })
        }
        sonuc.belirsiz += 1
      } else if (k.siparisKalemId != null) {
        await tx.irsaliyeKalem.update({ where: { id: k.id }, data: { siparisKalemId: null } })
      }
    }
    return sonuc
  }

  async create(dto: CreateIrsaliyeDto) {
    const data: any = { ...dto }
    // 201'de onay yalnızca yetkili onay uç noktasından verilir; kaydet onayı değiştiremez.
    if (data.irsaliyeTipi === '201') delete data.onaylandi
    delete data.onaylayan
    delete data.onayTarihi
    // Otomatik oluşan stok fişleri taslak kalmasın ( örn. 201'den Mal Alım ).
    if (data.tamamlandi !== true && stokTipiTamamlandi(data.irsaliyeTipi)) data.tamamlandi = true
    if (dto.irsaliyeTarihi) data.irsaliyeTarihi = new Date(dto.irsaliyeTarihi)
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.terminTarihi) data.terminTarihi = new Date(dto.terminTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    delete data.kalemler

    return this.prisma.$transaction(async (tx) => {
      const irsaliye = await tx.irsaliye.create({ data })
      if (dto.kalemler && dto.kalemler.length > 0) {
        for (const k of dto.kalemler) {
          const kalemData = kalemDataHazirla(k)
          const kalem = await tx.irsaliyeKalem.create({
            data: { ...kalemData, irsaliyeId: irsaliye.id, uuid: kalemData.uuid ?? randomUUID() } as any,
          })
          await tahsisleriYaz(tx, kalem.id, (k as any).tahsisler)
          await islemleriYaz(tx, kalem.id, (k as any).prosesler)
        }
      }
      const olusan = await tx.irsaliye.findUnique({
        where: { id: irsaliye.id },
        include: {
          cariHesap: true,
          depo: true,
          fasonTipi: true,
          nakliyeci: true,
          kalemler: { include: kalemInclude },
        },
      })
      if (!olusan) return olusan
      const tahsis = await this.sipariseTahsisEt(tx, olusan.id)
      return { ...olusan, tahsis }
    })
  }

  async update(id: number, dto: UpdateIrsaliyeDto) {
    const mevcut = await this.findOne(id)
    const data: any = { ...dto }
    if (mevcut.irsaliyeTipi === '201' && mevcut.onaylandi && Array.isArray((dto as any).kalemler)) {
      throw new BadRequestException('Onaylı siparişin satırları değiştirilemez. Önce onayı kaldırın.')
    }
    // 201'de kaydet, onay bilgisini (ve onaylayan/tarihi) ezmez.
    if (mevcut.irsaliyeTipi === '201') delete data.onaylandi
    delete data.onaylayan
    delete data.onayTarihi
    if (dto.irsaliyeTarihi) data.irsaliyeTarihi = new Date(dto.irsaliyeTarihi)
    if (dto.faturaTarihi) data.faturaTarihi = new Date(dto.faturaTarihi)
    if (dto.sevkTarihi) data.sevkTarihi = new Date(dto.sevkTarihi)
    if (dto.terminTarihi) data.terminTarihi = new Date(dto.terminTarihi)
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi)
    if (dto.guncellemeTarihi) data.guncellemeTarihi = new Date(dto.guncellemeTarihi)
    const kalemler = (dto as any).kalemler
    delete data.kalemler

    const cariHesapId = data.cariHesapId
    const depoId = data.depoId
    const fasonTipiId = data.fasonTipiId
    delete data.cariHesapId
    delete data.depoId
    delete data.fasonTipiId

    data.cariHesap = cariHesapId ? { connect: { id: cariHesapId } } : { disconnect: true }
    data.depo = depoId ? { connect: { id: depoId } } : { disconnect: true }
    data.fasonTipi = fasonTipiId ? { connect: { id: fasonTipiId } } : { disconnect: true }
    // Nakliyeci yalnızca gönderildiğinde dokunulur; alanı taşımayan kısmi
    // güncellemeler mevcut bağı koparmasın.
    if ('nakliyeciId' in dto) {
      data.nakliyeci = dto.nakliyeciId ? { connect: { id: dto.nakliyeciId } } : { disconnect: true }
      delete data.nakliyeciId
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.irsaliye.update({ where: { id }, data })
      if (Array.isArray(kalemler)) {
        // Kalemler YERİNDE güncellenir (id korunur). Eski davranış (delete + yeniden
        // create) kalem id'lerini her kayıtta değiştiriyordu → fatura_kalem ve
        // kalite_kontrol_kalem gibi FK'lar bozuluyordu. Eşleştirme uuid üzerinden.
        const eskiler = await tx.irsaliyeKalem.findMany({
          where: { irsaliyeId: id },
          select: { id: true, uuid: true },
        })
        const eskiByUuid = new Map<string, { id: number; uuid: string | null }>()
        for (const e of eskiler) if (e.uuid) eskiByUuid.set(e.uuid, e)

        const korunanKalemIds: number[] = []
        for (const k of kalemler) {
          const uuid = (k as any).uuid ?? null
          const eski = uuid ? eskiByUuid.get(uuid) : null
          const kalemData = kalemDataHazirla(k)
          if (eski) {
            await tx.irsaliyeKalem.update({
              where: { id: eski.id },
              data: { ...kalemData, irsaliyeId: id, uuid: eski.uuid } as any,
            })
            await tx.irsaliyeKalemTahsis.deleteMany({ where: { irsaliyeKalemId: eski.id } })
            await tx.irsaliyeKalemIslem.deleteMany({ where: { irsaliyeKalemId: eski.id } })
            await tahsisleriYaz(tx, eski.id, (k as any).tahsisler)
            await islemleriYaz(tx, eski.id, (k as any).prosesler)
            korunanKalemIds.push(eski.id)
          } else {
            const kalem = await tx.irsaliyeKalem.create({
              data: { ...kalemData, irsaliyeId: id, uuid: kalemData.uuid ?? randomUUID() } as any,
            })
            await tahsisleriYaz(tx, kalem.id, (k as any).tahsisler)
            await islemleriYaz(tx, kalem.id, (k as any).prosesler)
            korunanKalemIds.push(kalem.id)
          }
        }

        // Payload'da olmayan kalemler silinir. Silinen kalem KK'ya veya faturaya
        // bağlıysa engellenir (FK ihlali yerine okunabilir uyarı).
        const silinecekler = eskiler.filter((e) => !korunanKalemIds.includes(e.id))
        if (silinecekler.length > 0) {
          const silinecekIdler = silinecekler.map((e) => e.id)
          const bagliKK = await tx.kaliteKontrolKalem.findMany({
            where: { irsaliyeKalemId: { in: silinecekIdler } },
            select: { id: true, barkod: true, fis: { select: { fisNo: true } } },
          })
          if (bagliKK.length > 0) {
            const fisNolar = [...new Set(bagliKK.map((b) => b.fis.fisNo))].join(', ')
            throw new BadRequestException(
              `Bu kalemler kalite kontrol girişlerine bağlı (KK Fiş No: ${fisNolar}). ` +
                'Önce kalite kontrol kaydını silin.',
            )
          }
          const bagliFatura = await tx.faturaKalem.findMany({
            where: { irsaliyeKalemId: { in: silinecekIdler } },
            select: { fatura: { select: { faturaNo: true } } },
          })
          if (bagliFatura.length > 0) {
            const faturaNolar = [...new Set(bagliFatura.map((b) => b.fatura.faturaNo))].join(', ')
            throw new BadRequestException(
              `Bu kalemler faturaya bağlı (Fatura No: ${faturaNolar}). ` +
                'Önce faturayı silin veya irsaliye bağlantısını kaldırın.',
            )
          }
          const turetilmis = await turetilmisKalemler(tx, silinecekIdler)
          if (turetilmis.length > 0) {
            throw new BadRequestException(
              `Bu kalemlerden türetilmiş irsaliye var (${turetilmisEtiket(turetilmis)}). ` +
                'Önce bağlı irsaliyeyi silin veya bu kalemleri koruyun.',
            )
          }
          await tx.irsaliyeKalemTahsis.deleteMany({ where: { irsaliyeKalemId: { in: silinecekIdler } } })
          await tx.irsaliyeKalemIslem.deleteMany({ where: { irsaliyeKalemId: { in: silinecekIdler } } })
          await tx.irsaliyeKalem.deleteMany({ where: { id: { in: silinecekIdler } } })
        }
      }
      const guncel = await tx.irsaliye.findUnique({
        where: { id },
        include: {
          cariHesap: true,
          depo: true,
          fasonTipi: true,
          nakliyeci: true,
          kalemler: { include: kalemInclude },
        },
      })
      if (!guncel) return guncel
      const tahsis = await this.sipariseTahsisEt(tx, guncel.id)
      return { ...guncel, tahsis }
    })
  }

  async setOnay(id: number, onaylandi: boolean, kullanici?: { kod?: string | null; ad?: string | null }) {
    const fis = await this.findOne(id)
    if (fis.irsaliyeTipi !== '201') throw new BadRequestException('Yalnızca 201-Satın Alma Siparişi onaylanabilir')
    const onaylayan = onaylandi
      ? [kullanici?.kod, kullanici?.ad].filter(Boolean).join(' - ') || null
      : null
    return this.prisma.irsaliye.update({
      where: { id },
      data: {
        onaylandi,
        onaylayan,
        onayTarihi: onaylandi ? new Date() : null,
        // Onay kalkınca Teslim Alındı da düşer (Onaysız'a döner).
        tamamlandi: onaylandi ? fis.tamamlandi : false,
        guncellemeTarihi: new Date(),
      },
    })
  }

  async setTamamlandi(id: number, tamamlandi: boolean) {
    const fis = await this.findOne(id)
    if (fis.irsaliyeTipi !== '201') throw new BadRequestException('Yalnızca 201-Satın Alma Siparişi tamamlandı olarak işaretlenebilir')
    if (tamamlandi && !fis.onaylandi) throw new BadRequestException('Onaysız sipariş tamamlandı olarak işaretlenemez')
    return this.prisma.irsaliye.update({
      where: { id },
      data: { tamamlandi, guncellemeTarihi: new Date() },
    })
  }

  async kaynakSiparisler(id: number) {
    const fis = await this.findOne(id)
    const kaynakKalemIds = fis.kalemler.map((k) => k.kaynakKalemId).filter((v): v is number => v != null)
    if (kaynakKalemIds.length === 0) return []
    const kaynakKalemler = await this.prisma.irsaliyeKalem.findMany({
      where: { id: { in: kaynakKalemIds } },
      select: { irsaliye: { select: { id: true, irsaliyeNo: true, irsaliyeTipi: true, tamamlandi: true } } },
    })
    const map = new Map<number, { id: number; irsaliyeNo: string | null; irsaliyeTipi: string; tamamlandi: boolean }>()
    for (const k of kaynakKalemler) {
      if (k.irsaliye.irsaliyeTipi === '201') map.set(k.irsaliye.id, k.irsaliye)
    }
    return [...map.values()]
  }

  async remove(id: number) {
    const fis = await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      // Bu fişten türetilmiş irsaliyeler varsa silme engellenir (kaynak_kalem_id boşa düşmesin).
      const turetilmis = await turetilmisKalemler(tx, fis.kalemler.map((k) => k.id))
      if (turetilmis.length > 0) {
        throw new BadRequestException(
          `Bu fişten türetilmiş irsaliye var (${turetilmisEtiket(turetilmis)}). ` +
            'Önce bağlı irsaliyeyi silin.',
        )
      }
      // Kalite kontrol girişine bağlı kalemler varsa silme engellenir (uyarı).
      const bagliKK = await tx.kaliteKontrolKalem.findMany({
        where: { irsaliyeKalem: { irsaliyeId: id } },
        select: { id: true, barkod: true, fis: { select: { fisNo: true } } },
      })
      if (bagliKK.length > 0) {
        const fisNolar = [...new Set(bagliKK.map((b) => b.fis.fisNo))].join(', ')
        throw new BadRequestException(
          `Bu fiş kalite kontrol girişlerine bağlı (KK Fiş No: ${fisNolar}). ` +
            'Önce kalite kontrol kaydını silin.',
        )
      }
      // İrsaliyeden üretilen faturalar (fatura_kalem.irsaliye_kalem_id) silmeyi engeller.
      const bagliFatura = await tx.faturaKalem.findMany({
        where: { irsaliyeKalem: { irsaliyeId: id } },
        select: { fatura: { select: { faturaNo: true } } },
      })
      if (bagliFatura.length > 0) {
        const faturaNolar = [...new Set(bagliFatura.map((b) => b.fatura.faturaNo))].join(', ')
        throw new BadRequestException(
          `Bu fiş faturaya bağlı (Fatura No: ${faturaNolar}). ` +
            'Önce faturayı silin veya irsaliye bağlantısını kaldırın.',
        )
      }
      await tx.irsaliyeKalem.deleteMany({ where: { irsaliyeId: id } })
      return tx.irsaliye.delete({ where: { id } })
    })
  }

  findKalemler(irsaliyeId: number) {
    return this.prisma.irsaliyeKalem.findMany({
      where: { irsaliyeId },
      include: { malzeme: true },
    })
  }

  async createKalem(dto: CreateIrsaliyeKalemDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.irsaliyeId) {
        const fis = await tx.irsaliye.findUnique({ where: { id: dto.irsaliyeId }, select: { irsaliyeTipi: true, onaylandi: true } })
        if (fis?.irsaliyeTipi === '201' && fis.onaylandi) {
          throw new BadRequestException('Onaylı siparişin satırları değiştirilemez. Önce onayı kaldırın.')
        }
      }
      const kalem = await tx.irsaliyeKalem.create({ data: kalemDataHazirla(dto) as any })
      await islemleriYaz(tx, kalem.id, (dto as any).prosesler)
      return kalem
    })
  }

  async updateKalem(id: number, dto: CreateIrsaliyeKalemDto) {
    return this.prisma.$transaction(async (tx) => {
      const mevcut = await tx.irsaliyeKalem.findUnique({ where: { id }, select: { irsaliye: { select: { irsaliyeTipi: true, onaylandi: true } } } })
      if (mevcut?.irsaliye?.irsaliyeTipi === '201' && mevcut.irsaliye.onaylandi) {
        throw new BadRequestException('Onaylı siparişin satırları değiştirilemez. Önce onayı kaldırın.')
      }
      const kalem = await tx.irsaliyeKalem.update({ where: { id }, data: kalemDataHazirla(dto) as any })
      if (Array.isArray((dto as any).prosesler)) {
        await tx.irsaliyeKalemIslem.deleteMany({ where: { irsaliyeKalemId: id } })
        await islemleriYaz(tx, id, (dto as any).prosesler)
      }
      return kalem
    })
  }

  async removeKalem(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const mevcut = await tx.irsaliyeKalem.findUnique({ where: { id }, select: { irsaliye: { select: { irsaliyeTipi: true, onaylandi: true } } } })
      if (mevcut?.irsaliye?.irsaliyeTipi === '201' && mevcut.irsaliye.onaylandi) {
        throw new BadRequestException('Onaylı siparişin satırları değiştirilemez. Önce onayı kaldırın.')
      }
      const turetilmis = await turetilmisKalemler(tx, [id])
      if (turetilmis.length > 0) {
        throw new BadRequestException(
          `Bu kalemden türetilmiş irsaliye var (${turetilmisEtiket(turetilmis)}). ` +
            'Önce bağlı irsaliyeyi silin.',
        )
      }
      const bagliKK = await tx.kaliteKontrolKalem.findMany({
        where: { irsaliyeKalemId: id },
        select: { fis: { select: { fisNo: true } } },
      })
      if (bagliKK.length > 0) {
        const fisNolar = [...new Set(bagliKK.map((b) => b.fis.fisNo))].join(', ')
        throw new BadRequestException(
          `Bu kalem kalite kontrol girişlerine bağlı (KK Fiş No: ${fisNolar}). ` +
            'Önce kalite kontrol kaydını silin.',
        )
      }
      const bagliFatura = await tx.faturaKalem.findMany({
        where: { irsaliyeKalemId: id },
        select: { fatura: { select: { faturaNo: true } } },
      })
      if (bagliFatura.length > 0) {
        const faturaNolar = [...new Set(bagliFatura.map((b) => b.fatura.faturaNo))].join(', ')
        throw new BadRequestException(
          `Bu kalem faturaya bağlı (Fatura No: ${faturaNolar}). ` +
            'Önce faturayı silin veya irsaliye bağlantısını kaldırın.',
        )
      }
      return tx.irsaliyeKalem.delete({ where: { id } })
    })
  }
}
