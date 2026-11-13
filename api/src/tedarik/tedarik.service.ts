import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { HesaplaParamsDto, HesaplaSonuc, TedarikHesaplaSatir } from './dto/hesapla.dto'
import { TedarikIhtiyacCreateDto } from './dto/create.dto'
import { TedarikIhtiyacUpdateDto } from './dto/update.dto'
import { TahsisSatirDto } from './dto/tahsis.dto'
import { BAYAT, GUNCEL } from './tedarik.constants'

// Stok etkili fiş tipleri (Depo Bazlı Stok ile aynı listeler).
const STOK_GIRIS_TIPLERI = `('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101')`
const STOK_CIKIS_TIPLERI = `('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140')`

@Injectable()
export class TedarikService {
  constructor(private prisma: PrismaService) {}

  async hesapla(params: HesaplaParamsDto): Promise<HesaplaSonuc> {
    return this.kaydet(params, await this.hesaplaRaw(params))
  }

  private async kaydet(params: HesaplaParamsDto, ham: HesaplaSonuc): Promise<HesaplaSonuc> {
    const { satirlar: tumSatirlar, toplamNet } = ham
    const satirlar = tumSatirlar.filter((s) => Math.abs(Number(s.netMiktar) || 0) > 0.0001)

    await this.prisma.$transaction(async (tx) => {
      const where: { siparisId: number; siparisKalemId?: number; tip?: string } = {
        siparisId: params.siparisId,
      }
      if (params.kalemId) where.siparisKalemId = params.kalemId
      where.tip = params.tip ?? 'kumas'

      await tx.tedarikIhtiyac.deleteMany({ where })

      if (satirlar.length) {
        await tx.tedarikIhtiyac.createMany({
          data: satirlar.map((s) => ({
            siparisId: params.siparisId,
            siparisKalemId: s.siparisKalemId,
            receteKalemId: s.receteKalemId,
            malzemeId: s.malzemeId,
            malzemeKod: s.malzemeKod,
            malzemeAd: s.malzemeAd,
            kumasGrupId: s.kumasGrupId,
            kumasGrupKod: s.kumasGrupKod,
            renkId: s.renkId,
            renkKod: s.renkKod,
            renkAd: s.renkAd,
            birim: s.birim,
            brutMiktar: s.brutMiktar,
            netMiktar: s.netMiktar,
            tip: params.tip ?? 'kumas',
            durum: GUNCEL,
          })),
        })
      }
    })

    return { satirlar, toplamNet, kaydedildi: true }
  }

  /** Siparişe ait tedarik kaydı özeti (Sipariş Kartı'ndaki onay kutusu için) */
  async ozet(siparisId: number) {
    const rows = await this.prisma.$queryRaw<
      { tip: string; kalemSayisi: bigint | number; satirSayisi: bigint | number; bayatSatirSayisi: bigint | number }[]
    >`
      SELECT
        ti.tip                                                          AS tip,
        COUNT(DISTINCT ti.siparis_kalem_id)                             AS kalemSayisi,
        COUNT(*)                                                        AS satirSayisi,
        SUM(CASE WHEN ti.durum = N'guncel-degil' THEN 1 ELSE 0 END)     AS bayatSatirSayisi
      FROM tedarik_ihtiyac ti
      WHERE ti.siparis_id = ${siparisId}
      GROUP BY ti.tip
      ORDER BY ti.tip
    `

    const tipler = rows.map((r) => ({
      tip: r.tip,
      kalemSayisi: Number(r.kalemSayisi) || 0,
      satirSayisi: Number(r.satirSayisi) || 0,
      bayatSatirSayisi: Number(r.bayatSatirSayisi) || 0,
    }))

    return {
      tipler,
      kalemSayisi: tipler.reduce((a, t) => a + t.kalemSayisi, 0),
      satirSayisi: tipler.reduce((a, t) => a + t.satirSayisi, 0),
      bayatSatirSayisi: tipler.reduce((a, t) => a + t.bayatSatirSayisi, 0),
    }
  }

  /** Siparişin tamamını, kayıtlı olduğu tipler için yeniden hesaplar */
  async siparisHesapla(siparisId: number) {
    const ozet = await this.ozet(siparisId)
    const tipler = ozet.tipler.length ? ozet.tipler.map((t) => t.tip) : ['kumas']

    const kalemler = await this.prisma.siparisKalem.findMany({
      where: { siparisId },
      select: { id: true },
      orderBy: { sira: 'asc' },
    })

    let islenen = 0
    const hatalar: string[] = []
    for (const tip of tipler) {
      for (const k of kalemler) {
        try {
          await this.hesapla({ siparisId, kalemId: k.id, tip })
          islenen++
        } catch (e) {
          hatalar.push(
            `Kalem #${k.id} / ${tip}: ${e instanceof Error ? e.message : String(e)}`,
          )
        }
      }
    }

    return { tipler, kalemSayisi: kalemler.length, islenen, hataSayisi: hatalar.length, hatalar }
  }

  /** Sipariş değişikliği sonrası bayat kalan tedarik hesaplarını topluca tazeler */
  async guncelleBayatlar(limit = 500) {
    const bayatlar = await this.prisma.tedarikIhtiyac.findMany({
      where: { durum: BAYAT },
      distinct: ['siparisId', 'siparisKalemId', 'tip'],
      select: { siparisId: true, siparisKalemId: true, tip: true },
      orderBy: [{ siparisId: 'asc' }, { siparisKalemId: 'asc' }],
      take: limit,
    })

    let guncellenen = 0
    const hatalar: string[] = []
    for (const b of bayatlar) {
      try {
        await this.hesapla({ siparisId: b.siparisId, kalemId: b.siparisKalemId, tip: b.tip })
        guncellenen++
      } catch (e) {
        hatalar.push(
          `Sipariş #${b.siparisId} / kalem #${b.siparisKalemId} / ${b.tip}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        )
      }
    }

    const kalan = await this.prisma.tedarikIhtiyac.count({ where: { durum: BAYAT } })
    return { islenen: bayatlar.length, guncellenen, hataSayisi: hatalar.length, kalan, hatalar }
  }

  private async hesaplaRaw(params: HesaplaParamsDto): Promise<HesaplaSonuc> {
    const siparisId = Number(params.siparisId)
    const kalemId = params.kalemId ? Number(params.kalemId) : null

    if ((params.tip ?? 'kumas') !== 'kumas') {
      return this.hesaplaMalzeme(params)
    }

    const rows = await this.prisma.$queryRaw<TedarikHesaplaSatir[]>`
      WITH detay AS (
        SELECT
          m.id           AS malzeme_id,
          m.kod          AS malzeme_kod,
          m.ad           AS malzeme_ad,
          m.hesap_birimi AS hesap_birimi,
          gr.hesap_birimi AS grup_hesap_birimi,
          rk.miktar_bolen AS miktar_bolen,
          kg.id          AS kumas_grup_id,
          kg.kod         AS kumas_grup_kod,
          g.renk_id      AS renk_id,
          rn.kod         AS renk_kod,
          rn.ad          AS renk_ad,
          rk.id          AS recete_kalem_id,
          sk.id          AS siparis_kalem_id,
          -- Miktar Bölen: 1/ölçü × sipariş adedi (örn. ölçü 200, sipariş 400 → 2).
          -- Normal satır: ölçü miktarı × sipariş beden miktarı.
          CASE WHEN rk.miktar_bolen = 1
               THEN ISNULL(SUM(ISNULL(srb.miktar, 0) / NULLIF(ro.miktar, 0)), 0)
               ELSE SUM(ISNULL(ro.miktar, 0) * ISNULL(srb.miktar, 0)) END AS brut
        FROM siparis s
        JOIN siparis_kalem sk        ON sk.siparis_id   = s.id
        JOIN model_recete mr         ON mr.malzeme_id   = sk.malzeme_id
        JOIN recete_kalem rk         ON rk.recete_id  = mr.id
          AND rk.tip = 2
          AND ISNULL(rk.tedarik_hesaplanmayacak, 0) = 0
        JOIN kumas_grup kg           ON kg.kod        = rk.variant_1
        JOIN malzeme m               ON m.id          = rk.malzeme_id
        LEFT JOIN grup gr            ON gr.id         = m.grup_id
        JOIN recete_olcu ro          ON ro.kalem_id  = rk.id
        JOIN siparis_renk sr         ON sr.siparis_kalem_id = sk.id
        -- Kumaş grubuna bu renk satırında renk seçilmemişse kumaş kullanılmıyor kabul edilir.
        JOIN siparis_renk_kumas_grup g ON g.siparis_renk_id = sr.id
          AND g.kumas_grup_id = kg.id
          AND g.renk_id IS NOT NULL
        JOIN renk rn                 ON rn.id         = g.renk_id
        JOIN siparis_renk_beden srb  ON srb.siparis_renk_id = sr.id
          AND srb.beden_id = ro.beden_id
        WHERE s.id = ${siparisId}
          AND (${kalemId} IS NULL OR sk.id = ${kalemId})
        GROUP BY
          m.id, m.kod, m.ad, m.hesap_birimi, gr.hesap_birimi, rk.miktar_bolen,
          kg.id, kg.kod,
          g.renk_id, rn.kod, rn.ad,
          rk.id, sk.id
      )
      SELECT
        d.malzeme_id          AS malzemeId,
        d.malzeme_kod         AS malzemeKod,
        d.malzeme_ad          AS malzemeAd,
        d.kumas_grup_id       AS kumasGrupId,
        d.kumas_grup_kod      AS kumasGrupKod,
        d.renk_id             AS renkId,
        d.renk_kod            AS renkKod,
        d.renk_ad             AS renkAd,
        d.recete_kalem_id     AS receteKalemId,
        d.siparis_kalem_id    AS siparisKalemId,
        -- Birim: malzeme kartındaki hesap birimi öncelikli, sonra malzeme grubu,
        -- boşsa tip varsayılanı.
        CASE
          WHEN UPPER(ISNULL(d.hesap_birimi, '')) IN (N'ADET', N'MT', N'KG') THEN UPPER(d.hesap_birimi)
          WHEN UPPER(ISNULL(d.hesap_birimi, '')) = N'BRUTMT' THEN N'MT'
          WHEN UPPER(ISNULL(d.hesap_birimi, '')) = N'BRUTKG' THEN N'KG'
          WHEN UPPER(ISNULL(d.grup_hesap_birimi, '')) IN (N'ADET', N'MT', N'KG') THEN UPPER(d.grup_hesap_birimi)
          WHEN UPPER(ISNULL(d.grup_hesap_birimi, '')) = N'BRUTMT' THEN N'MT'
          WHEN UPPER(ISNULL(d.grup_hesap_birimi, '')) = N'BRUTKG' THEN N'KG'
          WHEN d.miktar_bolen = 1 THEN N'ADET'
          ELSE N'MT'
        END AS birim,
        CAST(d.brut AS FLOAT) AS brutMiktar,
        -- Miktar Bölen: kesim fazlası uygulanmaz, kürat yukarı yuvarlanır.
        CASE WHEN d.miktar_bolen = 1
             THEN CAST(CEILING(d.brut) AS FLOAT)
             WHEN UPPER(ISNULL(d.hesap_birimi, '')) = N'ADET'
             THEN CAST(CEILING(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0)) AS FLOAT)
             ELSE CAST(ROUND(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0), 6) AS FLOAT) END AS netMiktar,
        CASE WHEN d.miktar_bolen = 1
             THEN CAST(CEILING(SUM(d.brut) OVER (PARTITION BY d.malzeme_id)) AS FLOAT)
             WHEN UPPER(ISNULL(d.hesap_birimi, '')) = N'ADET'
             THEN CAST(CEILING(SUM(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0)) OVER (PARTITION BY d.malzeme_id)) AS FLOAT)
             ELSE CAST(ROUND(SUM(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0)) OVER (PARTITION BY d.malzeme_id), 6) AS FLOAT) END AS kumasNetToplam
      FROM detay d
      JOIN siparis s ON s.id = ${siparisId}
      ORDER BY d.malzeme_kod, d.renk_kod
    `

    const toplamNet = Math.round(
      rows.reduce((acc, r) => acc + (Number(r.netMiktar) || 0), 0) * 1e6,
    ) / 1e6

    return { satirlar: rows, toplamNet }
  }

  private async hesaplaMalzeme(params: HesaplaParamsDto): Promise<HesaplaSonuc> {
    const siparisId = Number(params.siparisId)
    const kalemId = params.kalemId ? Number(params.kalemId) : null
    const tip = params.tip ?? 'aksesuar'
    const receteTip = tip === 'iplik' ? 3 : 4

    const rows = await this.prisma.$queryRaw<TedarikHesaplaSatir[]>`
      WITH detay AS (
        SELECT
          m.id           AS malzeme_id,
          m.kod          AS malzeme_kod,
          m.ad           AS malzeme_ad,
          m.hesap_birimi AS hesap_birimi,
          gr.hesap_birimi AS grup_hesap_birimi,
          rk.tip         AS recete_tip,
          rk.miktar_bolen AS miktar_bolen,
          kg.id          AS kumas_grup_id,
          kg.kod         AS kumas_grup_kod,
          g.renk_id      AS renk_id,
          rn.kod         AS renk_kod,
          rn.ad          AS renk_ad,
          rk.id          AS recete_kalem_id,
          sk.id          AS siparis_kalem_id,
          -- Miktar Bölen: 1/ölçü × sipariş adedi (örn. ölçü 200, sipariş 400 → 2).
          -- Normal satır: ölçü miktarı × sipariş beden miktarı.
          CASE WHEN rk.miktar_bolen = 1
               THEN ISNULL(SUM(ISNULL(srb.miktar, 0) / NULLIF(ro.miktar, 0)), 0)
               ELSE SUM(ISNULL(ro.miktar, 0) * ISNULL(srb.miktar, 0)) END AS brut
        FROM siparis s
        JOIN siparis_kalem sk        ON sk.siparis_id   = s.id
        JOIN model_recete mr         ON mr.malzeme_id   = sk.malzeme_id
        JOIN recete_kalem rk         ON rk.recete_id  = mr.id
          AND rk.tip = ${receteTip}
          AND ISNULL(rk.tedarik_hesaplanmayacak, 0) = 0
        JOIN malzeme m               ON m.id          = rk.malzeme_id
        LEFT JOIN grup gr            ON gr.id         = m.grup_id
        JOIN recete_olcu ro          ON ro.kalem_id  = rk.id
        JOIN siparis_renk sr         ON sr.siparis_kalem_id = sk.id
        -- Erişim kaleminin kendi varyant_1'i yoksa (ör. koli, etiket, paket) modelin
        -- ana kumaş kalemi devralınır: metrajı en büyük tip=2 kalemi.
        OUTER APPLY (
          SELECT TOP 1 rk2.variant_1 AS variant_1
          FROM recete_kalem rk2
          JOIN recete_olcu ro2 ON ro2.kalem_id = rk2.id
          JOIN siparis_renk_beden srb2 ON srb2.siparis_renk_id = sr.id
            AND srb2.beden_id = ro2.beden_id
          WHERE rk2.recete_id = rk.recete_id
            AND rk2.tip = 2
            AND ISNULL(rk2.tedarik_hesaplanmayacak, 0) = 0
            AND rk2.variant_1 IS NOT NULL
          GROUP BY rk2.variant_1
          ORDER BY SUM(ISNULL(ro2.miktar, 0) * ISNULL(srb2.miktar, 0)) DESC, rk2.variant_1
        ) ana_kumas
        -- Reçete varyantı (kumaş grup kodu) LEFT: varyantsız satır renksiz hesaba girer.
        LEFT JOIN kumas_grup kg      ON kg.kod        = CASE
          WHEN rk.tip = 4 THEN COALESCE(rk.variant_1, ana_kumas.variant_1)
          ELSE rk.variant_1 END
        -- Sipariş rengi -> kumaş grup eşleşmesi (kumaş hesabındaki zincirin aynısı).
        -- Renk seçilmemiş grup bu renk satırında kullanılmıyor kabul edilir.
        LEFT JOIN siparis_renk_kumas_grup g ON g.siparis_renk_id = sr.id
          AND g.kumas_grup_id = kg.id
          AND g.renk_id IS NOT NULL
        LEFT JOIN renk rn            ON rn.id         = g.renk_id
        JOIN siparis_renk_beden srb  ON srb.siparis_renk_id = sr.id
          AND srb.beden_id = ro.beden_id
        WHERE s.id = ${siparisId}
          AND (${kalemId} IS NULL OR sk.id = ${kalemId})
          -- Kumaş grubu olan kalemlerde eşleme yoksa satır üretilmez; grupsuz
          -- (varyantsız) erişim kalemleri bugünkü gibi renksiz hesaplanır.
          AND (kg.id IS NULL OR g.id IS NOT NULL)
        GROUP BY
          m.id, m.kod, m.ad, m.hesap_birimi, gr.hesap_birimi, rk.tip, rk.miktar_bolen,
          kg.id, kg.kod,
          g.renk_id, rn.kod, rn.ad,
          rk.id, sk.id
      )
      SELECT
        d.malzeme_id          AS malzemeId,
        d.malzeme_kod         AS malzemeKod,
        d.malzeme_ad          AS malzemeAd,
        d.kumas_grup_id       AS kumasGrupId,
        d.kumas_grup_kod      AS kumasGrupKod,
        d.renk_id             AS renkId,
        d.renk_kod            AS renkKod,
        d.renk_ad             AS renkAd,
        d.recete_kalem_id     AS receteKalemId,
        d.siparis_kalem_id    AS siparisKalemId,
        -- Birim: malzeme kartındaki hesap birimi öncelikli, sonra malzeme grubu,
        -- boşsa tip varsayılanı (iplik → KG, aksesuar → ADET).
        CASE
          WHEN UPPER(ISNULL(d.hesap_birimi, '')) IN (N'ADET', N'MT', N'KG') THEN UPPER(d.hesap_birimi)
          WHEN UPPER(ISNULL(d.hesap_birimi, '')) = N'BRUTMT' THEN N'MT'
          WHEN UPPER(ISNULL(d.hesap_birimi, '')) = N'BRUTKG' THEN N'KG'
          WHEN UPPER(ISNULL(d.grup_hesap_birimi, '')) IN (N'ADET', N'MT', N'KG') THEN UPPER(d.grup_hesap_birimi)
          WHEN UPPER(ISNULL(d.grup_hesap_birimi, '')) = N'BRUTMT' THEN N'MT'
          WHEN UPPER(ISNULL(d.grup_hesap_birimi, '')) = N'BRUTKG' THEN N'KG'
          WHEN d.miktar_bolen = 1 THEN N'ADET'
          WHEN d.recete_tip = 4 THEN N'ADET'
          ELSE N'KG'
        END AS birim,
        CAST(d.brut AS FLOAT) AS brutMiktar,
        -- Miktar Bölen: kesim fazlası uygulanmaz, kürat yukarı yuvarlanır.
        CASE WHEN d.miktar_bolen = 1
             THEN CAST(CEILING(d.brut) AS FLOAT)
             WHEN UPPER(ISNULL(d.hesap_birimi, '')) = N'ADET'
             THEN CAST(CEILING(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0)) AS FLOAT)
             ELSE CAST(ROUND(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0), 6) AS FLOAT) END AS netMiktar,
        CASE WHEN d.miktar_bolen = 1
             THEN CAST(CEILING(SUM(d.brut) OVER (PARTITION BY d.malzeme_id)) AS FLOAT)
             WHEN UPPER(ISNULL(d.hesap_birimi, '')) = N'ADET'
             THEN CAST(CEILING(SUM(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0)) OVER (PARTITION BY d.malzeme_id)) AS FLOAT)
             ELSE CAST(ROUND(SUM(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0)) OVER (PARTITION BY d.malzeme_id), 6) AS FLOAT) END AS kumasNetToplam
      FROM detay d
      JOIN siparis s ON s.id = ${siparisId}
      ORDER BY d.malzeme_kod
    `

    const toplamNet = Math.round(
      rows.reduce((acc, r) => acc + (Number(r.netMiktar) || 0) * 1e6, 0) / 1e6,
    )

    return { satirlar: rows, toplamNet }
  }

  // Kumaş planlaması + stok karşılaması.
  // Her ihtiyaç satırına iki stok toplamı eklenir (brüt üzerinden — fason brütle çalışır,
  // satın alınan kumaşta brüt≈net kabul edilir):
  // - renkliStok: aynı malzeme + aynı renk (varyant1_renk_id = ti.renk_id, ID ile eşleşir).
  //   İhtiyaç renksizse (ham isteniyorsa) renksiz stok buraya düşer.
  // - hamStok: yalnızca BU siparişe bağlı ham (renksiz) girişler: planlamadan doğan
  //   kalemler (siparis_kalem_id) + stok_tahsis kayıtları. Free stok ayrı kolondur.
  // - freeStok: malzemenin hiçbir siparişe bağlı olmayan ham bakiyesi (tahsis kaynağı).
  // Giriş/çıkış listeleri depoStokDetay ile aynıdır; yalnızca tamamlandi=1 sayılır.
  async planlamaKumas() {
    const GIRIS = STOK_GIRIS_TIPLERI
    const CIKIS = STOK_CIKIS_TIPLERI
    const rows = await this.prisma.$queryRawUnsafe<
      {
        siparisNo: string
        siparisId: number | null
        siparisKalemId: number | null
        modelKod: string | null
        modelAd: string | null
        siparisMiktar: unknown
        musteriAd: string | null
        malzemeKod: string
        malzemeAd: string
        malzemeId: number | null
        islem: string | null
        varyant1: string
        varyant1Aciklama: string
        varyant1RenkId: number | null
        brutMiktar: unknown
        gerekenMiktar: unknown
        bayat: unknown
        birim: string
        renkliStokKg: unknown
        renkliStokMt: unknown
        renkliStokAdet: unknown
        hamStokKg: unknown
        hamStokMt: unknown
        hamStokAdet: unknown
      }[]
    >(`
      SELECT
        s.siparis_no        AS siparisNo,
        MIN(s.id)           AS siparisId,
        MIN(ti.siparis_kalem_id) AS siparisKalemId,
        mm.kod              AS modelKod,
        mm.ad               AS modelAd,
        sk.miktar           AS siparisMiktar,
        ch.ad               AS musteriAd,
        ti.malzeme_kod      AS malzemeKod,
        ti.malzeme_ad       AS malzemeAd,
        ti.malzeme_id       AS malzemeId,
        rk.islem            AS islem,
        ti.renk_kod         AS varyant1,
        ti.renk_ad          AS varyant1Aciklama,
        ti.renk_id          AS varyant1RenkId,
        SUM(ti.brut_miktar) AS brutMiktar,
        SUM(ti.net_miktar)  AS gerekenMiktar,
        MIN(CASE WHEN ti.durum = N'guncel-degil' THEN 1 ELSE 0 END) AS bayat,
        MIN(ti.birim)       AS birim,
        ISNULL(rs.kg, 0)   AS renkliStokKg,
        ISNULL(rs.mt, 0)   AS renkliStokMt,
        ISNULL(rs.adet, 0) AS renkliStokAdet,
        ISNULL(hs.kg, 0)   AS hamStokKg,
        ISNULL(hs.mt, 0)   AS hamStokMt,
        ISNULL(hs.adet, 0) AS hamStokAdet
      FROM tedarik_ihtiyac ti
      JOIN siparis s          ON s.id = ti.siparis_id
      LEFT JOIN cari_hesap ch ON ch.id = s.cari_hesap_id
      JOIN siparis_kalem sk   ON sk.id = ti.siparis_kalem_id
      LEFT JOIN malzeme mm    ON mm.id = sk.malzeme_id
      LEFT JOIN recete_kalem rk ON rk.id = ti.recete_kalem_id
      OUTER APPLY (
        SELECT
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(NULLIF(ik2.brut_agirlik, 0), ik2.net_agirlik, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -COALESCE(NULLIF(ik2.brut_agirlik, 0), ik2.net_agirlik, 0)
                   ELSE 0 END) AS kg,
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(NULLIF(ik2.brut_metre, 0), ik2.net_metre, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -COALESCE(NULLIF(ik2.brut_metre, 0), ik2.net_metre, 0)
                   ELSE 0 END) AS mt,
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN ISNULL(ik2.adet, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -ISNULL(ik2.adet, 0)
                   ELSE 0 END) AS adet
        FROM irsaliye_kalem ik2
        JOIN irsaliye i2 ON i2.id = ik2.irsaliye_id
        JOIN malzeme m2  ON m2.id = ik2.malzeme_id
        LEFT JOIN renk r2 ON r2.id = ik2.varyant1_renk_id
        WHERE i2.tamamlandi = 1
          AND (m2.id = ti.malzeme_id OR (ti.malzeme_id IS NULL AND m2.kod = ti.malzeme_kod))
          AND (r2.kod = ti.renk_kod OR (ti.renk_kod IS NULL AND ik2.varyant1_renk_id IS NULL))
      ) rs
      OUTER APPLY (
        SELECT
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(NULLIF(ik2.brut_agirlik, 0), ik2.net_agirlik, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -COALESCE(NULLIF(ik2.brut_agirlik, 0), ik2.net_agirlik, 0)
                   ELSE 0 END) AS kg,
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(NULLIF(ik2.brut_metre, 0), ik2.net_metre, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -COALESCE(NULLIF(ik2.brut_metre, 0), ik2.net_metre, 0)
                   ELSE 0 END) AS mt,
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN ISNULL(ik2.adet, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -ISNULL(ik2.adet, 0)
                   ELSE 0 END) AS adet
        FROM irsaliye_kalem ik2
        JOIN irsaliye i2 ON i2.id = ik2.irsaliye_id
        JOIN malzeme m2  ON m2.id = ik2.malzeme_id
        WHERE i2.tamamlandi = 1
          AND (m2.id = ti.malzeme_id OR (ti.malzeme_id IS NULL AND m2.kod = ti.malzeme_kod))
          AND ti.renk_id IS NOT NULL
          AND ik2.varyant1_renk_id IS NULL
      ) hs
      WHERE ti.tip = N'kumas'
      GROUP BY
        s.siparis_no, mm.kod, mm.ad, sk.miktar, ch.ad,
        ti.malzeme_kod,         ti.malzeme_ad,
        ti.malzeme_id,
        rk.islem,
        ti.renk_id, ti.renk_kod, ti.renk_ad,
        rs.kg, rs.mt, rs.adet, hs.kg, hs.mt, hs.adet
      ORDER BY s.siparis_no, mm.kod, ti.malzeme_kod, ti.renk_kod
    `)

    // 134-Fasona Çıkış kalemleri: boyaya gönderilen miktar + sipariş kalemi tahsisi.
    // Çıkış miktarı brütten okunur (giden fişte brüt = depodan çıkan fiziksel miktar).
    const cikisKalemleri = await this.prisma.$queryRawUnsafe<
      {
        kalemId: number
        malzemeId: number
        varyant1RenkId: number | null
        miktar: unknown
        tahsisSiparisKalemId: number | null
        tahsisMiktar: unknown
      }[]
    >(
      `
      SELECT
        ik.id       AS kalemId,
        ik.malzeme_id AS malzemeId,
        ik.varyant1_renk_id AS varyant1RenkId,
        COALESCE(NULLIF(ik.brut_metre, 0), NULLIF(ik.net_metre, 0), ik.miktar, 0) AS miktar,
        t.siparis_kalem_id AS tahsisSiparisKalemId,
        t.miktar   AS tahsisMiktar
      FROM irsaliye_kalem ik
      JOIN irsaliye i ON i.id = ik.irsaliye_id
      LEFT JOIN irsaliye_kalem_tahsis t ON t.irsaliye_kalem_id = ik.id
      WHERE i.irsaliye_tipi = '134' AND i.tamamlandi = 1
    `,
    )

    const yuvarla = (v: number) => Math.round(v * 1e4) / 1e4
    const sayi = (v: unknown) => Number(v) || 0

    type PlanSatir = {
      siparisNo: string
      siparisId: number | null
      siparisKalemId: number | null
      modelKod: string | null
      modelAd: string | null
      siparisMiktar: number
      musteriAd: string | null
      malzemeKod: string
      malzemeAd: string
      malzemeId: number | null
      islem: string | null
      varyant1: string
      varyant1Aciklama: string
      varyant1RenkId: number | null
      brutMiktar: number
      gereken: number
      guncelMi: boolean
      birim: string
      renkliStok: number
      hamStok: number
      bagliHam: number
      tahsisEdilen: number
    }

    const satirlar: PlanSatir[] = rows.map((r) => {
      const birim = (r.birim || '').toLowerCase()
      const birimeGore = (kg: unknown, mt: unknown, adet: unknown) =>
        birim.includes('kg')
          ? Number(kg) || 0
          : birim.includes('adet')
            ? Number(adet) || 0
            : Number(mt) || 0
      return {
        siparisNo: r.siparisNo,
        siparisId: r.siparisId ?? null,
        siparisKalemId: r.siparisKalemId ?? null,
        modelKod: r.modelKod,
        modelAd: r.modelAd,
        siparisMiktar: Number(r.siparisMiktar) || 0,
        musteriAd: r.musteriAd,
        malzemeKod: r.malzemeKod,
        malzemeAd: r.malzemeAd,
        malzemeId: r.malzemeId ?? null,
        islem: r.islem,
        varyant1: r.varyant1,
        varyant1Aciklama: r.varyant1Aciklama,
        varyant1RenkId: r.varyant1RenkId,
        brutMiktar: Number(r.brutMiktar) || 0,
        gereken: yuvarla(Number(r.gerekenMiktar) || 0),
        guncelMi: Number(r.bayat ?? 0) === 0,
        birim: r.birim,
        renkliStok: yuvarla(birimeGore(r.renkliStokKg, r.renkliStokMt, r.renkliStokAdet)),
        hamStok: yuvarla(birimeGore(r.hamStokKg, r.hamStokMt, r.hamStokAdet)),
        // Aşağıda (doğrudan bağ + tahsis) doldurulur; renksiz ihtiyaçta 0 kalır.
        bagliHam: 0,
        tahsisEdilen: 0,
      }
    })

    // Malzeme bazlı gruplama (boya dağıtımında yedek hedef listesi).
    const malzemeSatirlari = new Map<number, PlanSatir[]>()
    for (const s of satirlar) {
      if (s.malzemeId == null) continue
      const list = malzemeSatirlari.get(s.malzemeId) ?? []
      list.push(s)
      malzemeSatirlari.set(s.malzemeId, list)
    }

    // --- Serbest (free) stok: malzemenin toplam ham stoğundan doğrudan siparişe bağlı
    // girişler ve elle yapılan tahsisler düşülür. Tahsis zorunludur: free stok Açık
    // hesabına kendiliğinden yansımaz, yalnızca tahsis kaynağıdır.
    const hamToplamMap = new Map<number, { kg: number; mt: number; adet: number }>()
    for (const r of rows) {
      if (r.malzemeId == null) continue
      hamToplamMap.set(r.malzemeId, {
        kg: sayi(r.hamStokKg),
        mt: sayi(r.hamStokMt),
        adet: sayi(r.hamStokAdet),
      })
    }
    const dogrudanBagli = await this.prisma.$queryRawUnsafe<
      { siparisKalemId: number; malzemeId: number; kg: unknown; mt: unknown; adet: unknown }[]
    >(`
      SELECT ik2.siparis_kalem_id AS siparisKalemId, m2.id AS malzemeId,
        SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(NULLIF(ik2.brut_agirlik, 0), ik2.net_agirlik, 0) ELSE 0 END) AS kg,
        SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(NULLIF(ik2.brut_metre, 0), ik2.net_metre, 0) ELSE 0 END) AS mt,
        SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN ISNULL(ik2.adet, 0) ELSE 0 END) AS adet
      FROM irsaliye_kalem ik2
      JOIN irsaliye i2 ON i2.id = ik2.irsaliye_id
      JOIN malzeme m2  ON m2.id = ik2.malzeme_id
      WHERE i2.tamamlandi = 1
        AND ik2.siparis_kalem_id IS NOT NULL
        AND ik2.varyant1_renk_id IS NULL
      GROUP BY ik2.siparis_kalem_id, m2.id
    `)
    const tahsisToplam = await this.prisma.$queryRawUnsafe<
      { siparisKalemId: number; malzemeId: number; renkId: number | null; miktar: unknown }[]
    >(`
      SELECT siparis_kalem_id AS siparisKalemId, malzeme_id AS malzemeId, renk_id AS renkId, SUM(miktar) AS miktar
      FROM stok_tahsis
      GROUP BY siparis_kalem_id, malzeme_id, renk_id
    `)
    const bagliMap = new Map<number, { kg: number; mt: number; adet: number }>()
    const dogrudanMap = new Map<string, { kg: number; mt: number; adet: number }>()
    for (const d of dogrudanBagli) {
      const m = bagliMap.get(d.malzemeId) ?? { kg: 0, mt: 0, adet: 0 }
      m.kg += sayi(d.kg)
      m.mt += sayi(d.mt)
      m.adet += sayi(d.adet)
      bagliMap.set(d.malzemeId, m)
      dogrudanMap.set(`${d.siparisKalemId}:${d.malzemeId}`, { kg: sayi(d.kg), mt: sayi(d.mt), adet: sayi(d.adet) })
    }
    const tahsisMap = new Map<number, number>()
    const tahsisRenkMap = new Map<string, number>()
    for (const t of tahsisToplam) {
      tahsisMap.set(t.malzemeId, (tahsisMap.get(t.malzemeId) ?? 0) + sayi(t.miktar))
      tahsisRenkMap.set(`${t.siparisKalemId}:${t.malzemeId}:${t.renkId ?? 0}`, sayi(t.miktar))
    }

    const birimSec = (birim: string, kg: number, mt: number, adet: number) => {
      const b = birim.toLowerCase()
      return b.includes('kg') ? kg : b.includes('adet') ? adet : mt
    }
    const freeByMalzeme = new Map<number, number>()
    const freeStok = new Map<PlanSatir, number>()
    for (const s of satirlar) {
      if (s.malzemeId == null) {
        freeStok.set(s, 0)
        continue
      }
      let free = freeByMalzeme.get(s.malzemeId)
      if (free == null) {
        const toplam = hamToplamMap.get(s.malzemeId) ?? { kg: 0, mt: 0, adet: 0 }
        const bagli = bagliMap.get(s.malzemeId) ?? { kg: 0, mt: 0, adet: 0 }
        free = yuvarla(
          Math.max(
            0,
            birimSec(s.birim, toplam.kg - bagli.kg, toplam.mt - bagli.mt, toplam.adet - bagli.adet) -
              (tahsisMap.get(s.malzemeId) ?? 0),
          ),
        )
        freeByMalzeme.set(s.malzemeId, free)
      }
      freeStok.set(s, free)
    }

    // --- Satıra bağlı ham: doğrudan (planlama kaynaklı giriş) + elle tahsis.
    //     Doğrudan bağ sipariş kalemi + malzeme düzeyinde; aynı kalemin renk
    //     satırlarına gereken oranıyla dağıtılır. Renksiz ihtiyaç satırında 0
    //     kalır (renkli havuz zaten renksiz stoğu düşüyor).
    const kalemGereken = new Map<string, number>()
    for (const s of satirlar) {
      if (s.siparisKalemId == null || s.malzemeId == null || s.varyant1RenkId == null) continue
      const key = `${s.siparisKalemId}:${s.malzemeId}`
      kalemGereken.set(key, yuvarla((kalemGereken.get(key) ?? 0) + s.gereken))
    }
    for (const s of satirlar) {
      if (s.siparisKalemId == null || s.malzemeId == null || s.varyant1RenkId == null) continue
      const key = `${s.siparisKalemId}:${s.malzemeId}`
      const d = dogrudanMap.get(key)
      const dagitilan =
        d && (kalemGereken.get(key) ?? 0) > 0
          ? yuvarla((birimSec(s.birim, d.kg, d.mt, d.adet) * s.gereken) / (kalemGereken.get(key) ?? 1))
          : 0
      const tahsis = tahsisRenkMap.get(`${key}:${s.varyant1RenkId}`) ?? 0
      s.bagliHam = yuvarla(Math.max(0, dagitilan + tahsis))
      // Satıra elle yapılmış free stok tahsisi (doğrudan bağ hariç).
      s.tahsisEdilen = yuvarla(tahsis)
    }

    // --- Boyaya giden miktar: 134 çıkışları kalem bazında toplanır, tahsis (sipariş
    // kalemi) ağırlıklarına göre satıra dağıtılır. Tahsis yoksa (elle oluşturulmuş
    // 134) aynı malzeme/renk grubunda gereken oranı kullanılır.
    const cikisMap = new Map<
      number,
      { malzemeId: number; varyant1RenkId: number | null; miktar: number; tahsis: { siparisKalemId: number; miktar: number }[] }
    >()
    for (const c of cikisKalemleri) {
      let g = cikisMap.get(c.kalemId)
      if (!g) {
        g = { malzemeId: c.malzemeId, varyant1RenkId: c.varyant1RenkId, miktar: 0, tahsis: [] }
        cikisMap.set(c.kalemId, g)
      }
      g.miktar = sayi(c.miktar)
      if (c.tahsisSiparisKalemId != null && sayi(c.tahsisMiktar) > 0) {
        g.tahsis.push({ siparisKalemId: c.tahsisSiparisKalemId, miktar: sayi(c.tahsisMiktar) })
      }
    }
    const siparisKalemIndex = new Map<number, PlanSatir[]>()
    for (const s of satirlar) {
      if (s.siparisKalemId == null) continue
      const list = siparisKalemIndex.get(s.siparisKalemId) ?? []
      list.push(s)
      siparisKalemIndex.set(s.siparisKalemId, list)
    }
    const boyaGiden = new Map<PlanSatir, number>()
    for (const g of cikisMap.values()) {
      if (g.miktar <= 0) continue
      const hedefler: { satir: PlanSatir; agirlik: number }[] = []
      for (const t of g.tahsis) {
        const ilgili = (siparisKalemIndex.get(t.siparisKalemId) ?? []).filter(
          (s) => s.malzemeId == null || s.malzemeId === g.malzemeId,
        )
        if (ilgili.length === 0) continue
        const ilgiliGereken = ilgili.reduce((s, r) => s + r.gereken, 0)
        for (const r of ilgili) {
          const agirlik = ilgiliGereken > 0 ? t.miktar * (r.gereken / ilgiliGereken) : t.miktar / ilgili.length
          hedefler.push({ satir: r, agirlik })
        }
      }
      if (hedefler.length === 0) {
        for (const r of malzemeSatirlari.get(g.malzemeId) ?? []) {
          if (r.varyant1RenkId == null) continue
          if (g.varyant1RenkId != null && r.varyant1RenkId !== g.varyant1RenkId) continue
          hedefler.push({ satir: r, agirlik: r.gereken })
        }
      }
      if (hedefler.length === 0) continue
      const toplamAgirlik = hedefler.reduce((s, h) => s + h.agirlik, 0)
      if (toplamAgirlik <= 0) continue
      let kalan = g.miktar
      hedefler.forEach((h, idx) => {
        const pay = idx === hedefler.length - 1 ? kalan : yuvarla((g.miktar * h.agirlik) / toplamAgirlik)
        boyaGiden.set(h.satir, yuvarla((boyaGiden.get(h.satir) ?? 0) + pay))
        kalan = yuvarla(kalan - pay)
      })
    }

    return satirlar.map((s) => {
      const boyaGidenMiktar = boyaGiden.get(s) ?? 0
      const freeMiktar = freeStok.get(s) ?? 0
      const acikMiktar = yuvarla(Math.max(0, s.gereken - s.renkliStok - boyaGidenMiktar - s.bagliHam))
      const oneri: 'STOK' | 'BOYADA' | 'HAM_BOYA' | 'FREE_TAHSIS' | 'TEMIN' =
        s.renkliStok >= s.gereken
          ? 'STOK'
          : acikMiktar > 0
            ? freeMiktar > 0
              ? 'FREE_TAHSIS'
              : 'TEMIN'
            : boyaGidenMiktar > 0
              ? 'BOYADA'
              : 'HAM_BOYA'
      return {
        siparisNo: s.siparisNo,
        siparisId: s.siparisId,
        siparisKalemId: s.siparisKalemId,
        modelKod: s.modelKod,
        modelAd: s.modelAd,
        siparisMiktar: s.siparisMiktar,
        musteriAd: s.musteriAd,
        malzemeKod: s.malzemeKod,
        malzemeAd: s.malzemeAd,
        malzemeId: s.malzemeId,
        islem: s.islem,
        varyant1: s.varyant1,
        varyant1Aciklama: s.varyant1Aciklama,
        varyant1RenkId: s.varyant1RenkId,
        brutMiktar: s.brutMiktar,
        gerekenMiktar: s.gereken,
        guncelMi: s.guncelMi,
        birim: s.birim,
        renkliStok: s.renkliStok,
        // Bu siparişe bağlı ham (doğrudan bağ + elle tahsis). Fason aktarımı bunu kullanır.
        hamStok: s.bagliHam,
        // Malzemenin hiçbir siparişe bağlı olmayan ham stoğu (tahsis kaynağı).
        freeStok: freeMiktar,
        // Bu satıra elle tahsis edilen free stok (bağlı hamın tahsis kısmı).
        tahsisEdilen: s.tahsisEdilen,
        hamPay: s.bagliHam,
        // Boyaya gönderilmiş miktar (134 çıkışından tahsis oranıyla paylaştırılmış).
        boyaGiden: boyaGidenMiktar,
        acikMiktar,
        oneri,
      }
    })
  }

  async planlamaIplik() {
    const rows = await this.prisma.$queryRaw<
      {
        siparisNo: string
        siparisId: number | null
        siparisKalemId: number | null
        modelKod: string | null
        modelAd: string | null
        siparisMiktar: unknown
        musteriAd: string | null
        malzemeKod: string
        malzemeAd: string
        malzemeId: number | null
        islem: string | null
        varyant1: string
        varyant1Aciklama: string
        varyant1RenkId: number | null
        gerekenMiktar: unknown
        bayat: unknown
        birim: string
      }[]
    >`
      SELECT
        s.siparis_no        AS siparisNo,
        MIN(s.id)           AS siparisId,
        MIN(ti.siparis_kalem_id) AS siparisKalemId,
        mm.kod              AS modelKod,
        mm.ad               AS modelAd,
        sk.miktar           AS siparisMiktar,
        ch.ad               AS musteriAd,
        ti.malzeme_kod      AS malzemeKod,
        ti.malzeme_ad       AS malzemeAd,
        ti.malzeme_id       AS malzemeId,
        rk.islem            AS islem,
        ti.renk_kod         AS varyant1,
        ti.renk_ad          AS varyant1Aciklama,
        ti.renk_id          AS varyant1RenkId,
        SUM(ti.net_miktar)  AS gerekenMiktar,
        MIN(CASE WHEN ti.durum = N'guncel-degil' THEN 1 ELSE 0 END) AS bayat,
        MIN(ti.birim)       AS birim
      FROM tedarik_ihtiyac ti
      JOIN siparis s          ON s.id = ti.siparis_id
      LEFT JOIN cari_hesap ch ON ch.id = s.cari_hesap_id
      JOIN siparis_kalem sk   ON sk.id = ti.siparis_kalem_id
      LEFT JOIN malzeme mm    ON mm.id = sk.malzeme_id
      LEFT JOIN recete_kalem rk ON rk.id = ti.recete_kalem_id
      WHERE ti.tip = N'iplik'
      GROUP BY
        s.siparis_no, mm.kod, mm.ad, sk.miktar, ch.ad,
        ti.malzeme_kod,         ti.malzeme_ad,
        ti.malzeme_id,
        rk.islem,
        ti.renk_id, ti.renk_kod, ti.renk_ad
      ORDER BY s.siparis_no, mm.kod, ti.malzeme_kod, ti.renk_kod
    `

    return rows.map((r) => ({
      siparisNo: r.siparisNo,
      siparisId: r.siparisId ?? null,
      siparisKalemId: r.siparisKalemId ?? null,
      modelKod: r.modelKod,
      modelAd: r.modelAd,
      siparisMiktar: Number(r.siparisMiktar) || 0,
      musteriAd: r.musteriAd,
      malzemeKod: r.malzemeKod,
      malzemeAd: r.malzemeAd,
      islem: r.islem,
      varyant1: r.varyant1,
      varyant1Aciklama: r.varyant1Aciklama,
      varyant1RenkId: r.varyant1RenkId,
      gerekenMiktar: Number(r.gerekenMiktar) || 0,
      guncelMi: Number(r.bayat ?? 0) === 0,
      birim: r.birim,
    }))
  }

  async planlamaIplikHareketler(siparisNo: string, malzemeKod: string) {
    const rows = await this.prisma.$queryRaw<
      {
        irsaliyeId: number
        fisNo: string
        fisTipi: string
        fisTarihi: Date
        miktar: unknown
        birim: string | null
        depoAd: string | null
        cariAd: string | null
        aciklama: string | null
      }[]
    >`
      SELECT
        i.id                AS irsaliyeId,
        i.irsaliye_no       AS fisNo,
        i.irsaliye_tipi     AS fisTipi,
        i.irsaliye_tarihi   AS fisTarihi,
        ik.miktar           AS miktar,
        ik.olcu_birimi      AS birim,
        d.ad                AS depoAd,
        ch.ad               AS cariAd,
        ik.aciklama         AS aciklama
      FROM irsaliye_kalem ik
      JOIN irsaliye i          ON i.id = ik.irsaliye_id
      LEFT JOIN malzeme m      ON m.id = ik.malzeme_id
      LEFT JOIN depo d         ON d.id = i.depo_id
      LEFT JOIN cari_hesap ch  ON ch.id = i.cari_hesap_id
      WHERE m.kod = ${malzemeKod}
      ORDER BY i.irsaliye_tarihi DESC, i.irsaliye_no DESC
    `

    return rows.map((r) => ({
      irsaliyeId: r.irsaliyeId,
      fisNo: r.fisNo,
      fisTipi: r.fisTipi,
      fisTarihi: r.fisTarihi,
      miktar: Number(r.miktar) || 0,
      birim: r.birim,
      depoAd: r.depoAd,
      cariAd: r.cariAd,
      aciklama: r.aciklama,
    }))
  }

  async planlamaKumasHareketler(
    siparisNo: string,
    malzemeKod: string,
    siparisKalemId?: number,
    renkId?: number,
  ) {
    // Sadece bu siparişe (ve verilmişse renge) bağlı hareketler: kalem doğrudan sipariş
    // kalemine bağlıysa ya da bu sipariş kalemi + renge stok tahsisi yapılmışsa.
    // Renksiz girişler renk satırlarında görünür (kaleme bağlıysa pro-rata dağıtılır).
    const renkFiltresi = Prisma.sql`AND (
      (${renkId ?? null} IS NULL AND st.renk_id IS NULL)
      OR st.renk_id = ${renkId ?? null}
    )`
    const kalemFiltresi =
      siparisKalemId != null
        ? Prisma.sql`AND (
            (ik.siparis_kalem_id = ${siparisKalemId}
              AND (${renkId ?? null} IS NULL OR ik.varyant1_renk_id IS NULL
                   OR ik.varyant1_renk_id = ${renkId ?? null}))
            OR EXISTS (
              SELECT 1 FROM stok_tahsis st
              WHERE st.irsaliye_kalem_id = ik.id
                AND st.siparis_kalem_id = ${siparisKalemId}
                ${renkFiltresi}
            )
          )`
        : Prisma.empty
    const rows = await this.prisma.$queryRaw<
      {
        kalemId: number
        irsaliyeId: number
        fisNo: string
        fisTipi: string
        fisTarihi: Date
        miktar: unknown
        birim: string | null
        brutKg: unknown
        kg: unknown
        brutMt: unknown
        mt: unknown
        adet: number | null
        tahsisMiktar: unknown
        depoAd: string | null
        cariAd: string | null
        aciklama: string | null
      }[]
    >`
      SELECT
        ik.id                AS kalemId,
        i.id                 AS irsaliyeId,
        i.irsaliye_no       AS fisNo,
        i.irsaliye_tipi     AS fisTipi,
        i.irsaliye_tarihi   AS fisTarihi,
        ik.miktar           AS miktar,
        ik.olcu_birimi      AS birim,
        ik.brut_agirlik     AS brutKg,
        ik.net_agirlik      AS kg,
        ik.brut_metre       AS brutMt,
        ik.net_metre        AS mt,
        ik.adet             AS adet,
        ISNULL((
          SELECT SUM(st.miktar) FROM stok_tahsis st
          WHERE st.irsaliye_kalem_id = ik.id
            AND st.siparis_kalem_id = ${siparisKalemId ?? null}
            ${renkFiltresi}
        ), 0)               AS tahsisMiktar,
        d.ad                AS depoAd,
        ch.ad               AS cariAd,
        ik.aciklama         AS aciklama
      FROM irsaliye_kalem ik
      JOIN irsaliye i          ON i.id = ik.irsaliye_id
      LEFT JOIN malzeme m      ON m.id = ik.malzeme_id
      LEFT JOIN depo d         ON d.id = i.depo_id
      LEFT JOIN cari_hesap ch  ON ch.id = i.cari_hesap_id
      WHERE m.kod = ${malzemeKod}
        ${kalemFiltresi}
      ORDER BY i.irsaliye_tarihi DESC, i.irsaliye_no DESC
    `

    return rows.map((r) => ({
      kalemId: r.kalemId,
      irsaliyeId: r.irsaliyeId,
      fisNo: r.fisNo,
      fisTipi: r.fisTipi,
      fisTarihi: r.fisTarihi,
      miktar: Number(r.miktar) || 0,
      birim: r.birim,
      brutKg: r.brutKg == null ? null : Number(r.brutKg),
      kg: r.kg == null ? null : Number(r.kg),
      brutMt: r.brutMt == null ? null : Number(r.brutMt),
      mt: r.mt == null ? null : Number(r.mt),
      adet: r.adet == null ? null : Number(r.adet),
      tahsisMiktar: Number(r.tahsisMiktar) || 0,
      depoAd: r.depoAd,
      cariAd: r.cariAd,
      aciklama: r.aciklama,
    }))
  }

  // Planlama satırının depo kırılımlı serbest stoku: aynı malzeme için her depoda
  // renkli (tam eşleşme) + ham (renksiz) miktar. renkId null ise ihtiyaç hamdır:
  // renksiz stok "renkli" kolona düşer, ham kolon boş gelir.
  async karsilamaDepo(malzemeKod: string, renkKod?: string, malzemeId?: number) {
    // renkId yerine renk_kod eşleştirilir: iki taraf farklı Renk kaydı (id) kullanabilir,
    // kod üzerinden eşleşme tek doğru kaynak olur (RULES.md: tek kaynak Renk tablosu).
    const rows = await this.prisma.$queryRaw<
      {
        depoKod: string
        depoAd: string
        renkliKg: unknown
        renkliMt: unknown
        renkliAdet: unknown
        hamKg: unknown
        hamMt: unknown
        hamAdet: unknown
      }[]
    >`
      SELECT
        d.kod AS depoKod,
        d.ad  AS depoAd,
        SUM(CASE WHEN (r.kod = ${renkKod ?? null}
                       OR (${renkKod ?? null} IS NULL AND ik.varyant1_renk_id IS NULL))
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN COALESCE(NULLIF(ik.brut_agirlik, 0), ik.net_agirlik, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -COALESCE(NULLIF(ik.brut_agirlik, 0), ik.net_agirlik, 0)
                           ELSE 0 END
                 ELSE 0 END) AS renkliKg,
        SUM(CASE WHEN (r.kod = ${renkKod ?? null}
                       OR (${renkKod ?? null} IS NULL AND ik.varyant1_renk_id IS NULL))
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN COALESCE(NULLIF(ik.brut_metre, 0), ik.net_metre, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -COALESCE(NULLIF(ik.brut_metre, 0), ik.net_metre, 0)
                           ELSE 0 END
                 ELSE 0 END) AS renkliMt,
        SUM(CASE WHEN (r.kod = ${renkKod ?? null}
                       OR (${renkKod ?? null} IS NULL AND ik.varyant1_renk_id IS NULL))
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik.adet, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik.adet, 0)
                           ELSE 0 END
                 ELSE 0 END) AS renkliAdet,
        SUM(CASE WHEN ${renkKod ?? null} IS NOT NULL AND ik.varyant1_renk_id IS NULL
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN COALESCE(NULLIF(ik.brut_agirlik, 0), ik.net_agirlik, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -COALESCE(NULLIF(ik.brut_agirlik, 0), ik.net_agirlik, 0)
                           ELSE 0 END
                 ELSE 0 END) AS hamKg,
        SUM(CASE WHEN ${renkKod ?? null} IS NOT NULL AND ik.varyant1_renk_id IS NULL
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN COALESCE(NULLIF(ik.brut_metre, 0), ik.net_metre, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -COALESCE(NULLIF(ik.brut_metre, 0), ik.net_metre, 0)
                           ELSE 0 END
                 ELSE 0 END) AS hamMt,
        SUM(CASE WHEN ${renkKod ?? null} IS NOT NULL AND ik.varyant1_renk_id IS NULL
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik.adet, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik.adet, 0)
                           ELSE 0 END
                 ELSE 0 END) AS hamAdet
      FROM irsaliye_kalem ik
      JOIN irsaliye i ON i.id = ik.irsaliye_id
      JOIN malzeme m  ON m.id = ik.malzeme_id
      LEFT JOIN renk r ON r.id = ik.varyant1_renk_id
      LEFT JOIN depo d ON d.id = i.depo_id
      WHERE i.tamamlandi = 1
        AND (m.id = ${malzemeId ?? null} OR (${malzemeId ?? null} IS NULL AND m.kod = ${malzemeKod}))
        AND (
          (${renkKod ?? null} IS NULL AND ik.varyant1_renk_id IS NULL)
          OR (${renkKod ?? null} IS NOT NULL AND (r.kod = ${renkKod ?? null} OR ik.varyant1_renk_id IS NULL))
        )
        AND d.kod IS NOT NULL
      GROUP BY d.kod, d.ad
      ORDER BY d.kod
    `

    return rows
      .map((r) => ({
        depoKod: r.depoKod,
        depoAd: r.depoAd,
        renkliKg: Number(r.renkliKg) || 0,
        renkliMt: Number(r.renkliMt) || 0,
        renkliAdet: Number(r.renkliAdet) || 0,
        hamKg: Number(r.hamKg) || 0,
        hamMt: Number(r.hamMt) || 0,
        hamAdet: Number(r.hamAdet) || 0,
      }))
      .filter(
        (r) => r.renkliKg !== 0 || r.renkliMt !== 0 || r.renkliAdet !== 0 || r.hamKg !== 0 || r.hamMt !== 0 || r.hamAdet !== 0,
      )
  }

  // Serbest ham stoktan sipariş kalemine elle tahsis. Kaynak: tamamlanmış, renksiz,
  // hiçbir siparişe bağlı olmayan giriş kalemleri (en eski fiş önce).
  async tahsisEt(satirlar: TahsisSatirDto[]) {
    if (!Array.isArray(satirlar) || satirlar.length === 0) {
      throw new BadRequestException('Tahsis edilecek satır yok')
    }
    return this.prisma.$transaction(async (tx) => {
      const kalanFree = new Map<number, number>()
      const sonuc: {
        siparisKalemId: number
        malzemeId: number
        renkId: number | null
        tahsisEdilen: number
        kalan: number
      }[] = []

      for (const s of satirlar) {
        const istenen = this.yuvarla(Number(s.miktar) || 0)
        // Renksiz ihtiyaçta ham stok zaten renkli havuzda sayıldığı için tahsis tutulmaz.
        if (!s.siparisKalemId || !s.malzemeId || s.renkId == null || istenen <= 0) continue

        if (kalanFree.get(s.malzemeId) == null) {
          kalanFree.set(s.malzemeId, await this.serbestHam(tx, s.malzemeId, s.birim ?? ''))
        }
        const hedef = this.yuvarla(Math.min(istenen, kalanFree.get(s.malzemeId) ?? 0))
        if (hedef <= 0) {
          sonuc.push({
            siparisKalemId: s.siparisKalemId,
            malzemeId: s.malzemeId,
            renkId: s.renkId ?? null,
            tahsisEdilen: 0,
            kalan: istenen,
          })
          continue
        }

        const kaynaklar = await this.tahsisKaynaklari(tx, s.malzemeId, s.birim ?? '')
        let kalanHedef = hedef
        for (const k of kaynaklar) {
          if (kalanHedef <= 0.00005) break
          const kalanKaynak = this.yuvarla(Number(k.miktar) - Number(k.tahsisli))
          if (kalanKaynak <= 0) continue
          const pay = this.yuvarla(Math.min(kalanHedef, kalanKaynak))
          await tx.stokTahsis.create({
            data: {
              irsaliyeKalemId: k.kalemId,
              siparisKalemId: s.siparisKalemId,
              malzemeId: s.malzemeId,
              renkId: s.renkId ?? null,
              siparisNo: s.siparisNo ?? null,
              modelKod: s.modelKod ?? null,
              miktar: new Prisma.Decimal(pay),
            },
          })
          kalanHedef = this.yuvarla(kalanHedef - pay)
        }

        const tahsisEdilen = this.yuvarla(hedef - kalanHedef)
        kalanFree.set(s.malzemeId, this.yuvarla((kalanFree.get(s.malzemeId) ?? 0) - tahsisEdilen))
        sonuc.push({
          siparisKalemId: s.siparisKalemId,
          malzemeId: s.malzemeId,
          renkId: s.renkId ?? null,
          tahsisEdilen,
          kalan: this.yuvarla(istenen - tahsisEdilen),
        })
      }

      return { satirlar: sonuc }
    })
  }

  // Tahsis edilmiş serbest stoğu geri bırakır (satır: sipariş kalemi + malzeme + renk).
  async tahsisKaldir(siparisKalemId: number, malzemeId: number, renkId?: number | null) {
    const res = await this.prisma.stokTahsis.deleteMany({
      where: { siparisKalemId, malzemeId, renkId: renkId ?? null },
    })
    return { silinen: res.count }
  }

  private yuvarla(v: number) {
    return Math.round(v * 1e4) / 1e4
  }

  // Tahsis miktarı hedef satırın biriminden okunur (brüt varsa brüt, yoksa net).
  private stokMiktarIfadesi(birim: string, alias: string) {
    const b = (birim || '').toLowerCase()
    if (b.includes('kg')) return `COALESCE(NULLIF(${alias}.brut_agirlik, 0), ${alias}.net_agirlik, 0)`
    if (b.includes('adet')) return `ISNULL(${alias}.adet, 0)`
    return `COALESCE(NULLIF(${alias}.brut_metre, 0), ${alias}.net_metre, 0)`
  }

  // Malzemenin serbest ham bakiyesi: toplam ham − siparişe bağlı girişler − tahsisler.
  private async serbestHam(tx: Prisma.TransactionClient, malzemeId: number, birim: string) {
    const qty = this.stokMiktarIfadesi(birim, 'ik2')
    const rows = await tx.$queryRawUnsafe<{ toplam: unknown; bagli: unknown }[]>(`
      SELECT
        SUM(CASE WHEN i2.irsaliye_tipi IN ${STOK_GIRIS_TIPLERI} THEN ${qty}
                 WHEN i2.irsaliye_tipi IN ${STOK_CIKIS_TIPLERI} THEN -${qty}
                 ELSE 0 END) AS toplam,
        SUM(CASE WHEN i2.irsaliye_tipi IN ${STOK_GIRIS_TIPLERI} AND ik2.siparis_kalem_id IS NOT NULL THEN ${qty} ELSE 0 END) AS bagli
      FROM irsaliye_kalem ik2
      JOIN irsaliye i2 ON i2.id = ik2.irsaliye_id
      WHERE i2.tamamlandi = 1
        AND ik2.malzeme_id = ${malzemeId}
        AND ik2.varyant1_renk_id IS NULL
    `)
    const tahsis = await tx.stokTahsis.aggregate({
      where: { malzemeId },
      _sum: { miktar: true },
    })
    const toplam = Number(rows[0]?.toplam) || 0
    const bagli = Number(rows[0]?.bagli) || 0
    const tahsisli = Number(tahsis._sum.miktar ?? 0)
    return this.yuvarla(Math.max(0, toplam - bagli - tahsisli))
  }

  // FIFO kaynaklar: en eski tamamlanmış, renksiz, siparişe bağlı olmayan giriş kalemleri.
  private async tahsisKaynaklari(tx: Prisma.TransactionClient, malzemeId: number, birim: string) {
    const qty = this.stokMiktarIfadesi(birim, 'ik')
    return tx.$queryRawUnsafe<{ kalemId: number; miktar: unknown; tahsisli: unknown }[]>(`
      SELECT
        ik.id AS kalemId,
        ${qty} AS miktar,
        ISNULL((SELECT SUM(st.miktar) FROM stok_tahsis st WHERE st.irsaliye_kalem_id = ik.id), 0) AS tahsisli
      FROM irsaliye_kalem ik
      JOIN irsaliye i ON i.id = ik.irsaliye_id
      WHERE i.tamamlandi = 1
        AND i.irsaliye_tipi IN ${STOK_GIRIS_TIPLERI}
        AND ik.malzeme_id = ${malzemeId}
        AND ik.varyant1_renk_id IS NULL
        AND ik.siparis_kalem_id IS NULL
      ORDER BY i.irsaliye_tarihi ASC, i.id ASC
    `)
  }

  async findBySiparis(siparisId: number, tip?: string, siparisKalemId?: number) {
    return this.prisma.tedarikIhtiyac.findMany({
      where: {
        siparisId,
        ...(tip ? { tip } : {}),
        ...(siparisKalemId ? { siparisKalemId } : {}),
      },
      orderBy: [{ malzemeKod: 'asc' }, { renkKod: 'asc' }],
    })
  }

  async findOne(id: number) {
    return this.prisma.tedarikIhtiyac.findUnique({ where: { id } })
  }

  async create(dto: TedarikIhtiyacCreateDto) {
    return this.prisma.tedarikIhtiyac.create({
      data: {
        siparisId: dto.siparisId,
        siparisKalemId: dto.siparisKalemId,
        receteKalemId: dto.receteKalemId ?? null,
        malzemeId: dto.malzemeId,
        malzemeKod: dto.malzemeKod,
        malzemeAd: dto.malzemeAd,
        kumasGrupId: dto.kumasGrupId,
        kumasGrupKod: dto.kumasGrupKod,
        renkId: dto.renkId,
        renkKod: dto.renkKod,
        renkAd: dto.renkAd,
        brutMiktar: dto.brutMiktar,
        netMiktar: dto.netMiktar,
        birim: dto.birim ?? 'mt',
        tip: dto.tip ?? 'kumas',
        durum: dto.durum ?? 'hesaplandi',
        aciklama: dto.aciklama ?? null,
        kayitYapan: dto.kayitYapan ?? null,
      },
    })
  }

  async update(id: number, dto: TedarikIhtiyacUpdateDto) {
    return this.prisma.tedarikIhtiyac.update({
      where: { id },
      data: {
        netMiktar: dto.netMiktar,
        brutMiktar: dto.brutMiktar,
        birim: dto.birim,
        tip: dto.tip,
        durum: dto.durum,
        aciklama: dto.aciklama,
        guncelleyen: dto.guncelleyen ?? null,
      },
    })
  }

  async remove(id: number) {
    return this.prisma.tedarikIhtiyac.delete({ where: { id } })
  }

  async removeAll(siparisId: number, tip?: string, siparisKalemId?: number) {
    const sonuc = await this.prisma.tedarikIhtiyac.deleteMany({
      where: {
        siparisId,
        ...(tip ? { tip } : {}),
        ...(siparisKalemId ? { siparisKalemId } : {}),
      },
    })
    return { silinen: sonuc.count }
  }
}
