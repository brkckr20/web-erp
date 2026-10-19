import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { HesaplaParamsDto, HesaplaSonuc, TedarikHesaplaSatir } from './dto/hesapla.dto'
import { TedarikIhtiyacCreateDto } from './dto/create.dto'
import { TedarikIhtiyacUpdateDto } from './dto/update.dto'
import { BAYAT, GUNCEL } from './tedarik.constants'

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
          n.grup_kodu    AS grup_kodu,
          kg.id          AS kumas_grup_id,
          kg.kod         AS kumas_grup_kod,
          g.renk_id      AS renk_id,
          rn.kod         AS renk_kod,
          rn.ad          AS renk_ad,
          rk.id          AS recete_kalem_id,
          sk.id          AS siparis_kalem_id,
          SUM(ISNULL(ro.miktar, 0) * ISNULL(srb.miktar, 0)) AS brut
        FROM siparis s
        JOIN siparis_kalem sk        ON sk.siparis_id   = s.id
        JOIN model_recete mr         ON mr.malzeme_id   = sk.malzeme_id
        JOIN recete_kalem rk         ON rk.recete_id  = mr.id
          AND rk.tip IN (2, 3, 4)
          AND ISNULL(rk.tedarik_hesaplanmayacak, 0) = 0
        JOIN kumas_grup kg           ON kg.kod        = rk.variant_1
        JOIN malzeme m               ON m.id          = rk.malzeme_id
        LEFT JOIN numarator n        ON n.id          = m.numarator_id
        JOIN recete_olcu ro          ON ro.kalem_id  = rk.id
        JOIN siparis_renk sr         ON sr.siparis_kalem_id = sk.id
        LEFT JOIN siparis_renk_kumas_grup g ON g.siparis_renk_id = sr.id
          AND g.kumas_grup_id = kg.id
        LEFT JOIN renk rn                 ON rn.id         = g.renk_id
        JOIN siparis_renk_beden srb  ON srb.siparis_renk_id = sr.id
          AND srb.beden_id = ro.beden_id
        WHERE s.id = ${siparisId}
          AND (${kalemId} IS NULL OR sk.id = ${kalemId})
        GROUP BY
          m.id, m.kod, m.ad, n.grup_kodu,
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
        CASE WHEN UPPER(ISNULL(d.grup_kodu, '')) = N'KH' THEN N'ADET' ELSE N'MT' END AS birim,
        CASE WHEN UPPER(ISNULL(d.grup_kodu, '')) = N'KH'
             THEN CAST(CEILING(d.brut) AS FLOAT)
             ELSE CAST(d.brut AS FLOAT) END AS brutMiktar,
        CASE WHEN UPPER(ISNULL(d.grup_kodu, '')) = N'KH'
             THEN CAST(CEILING(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0)) AS FLOAT)
             ELSE CAST(ROUND(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0), 6) AS FLOAT) END AS netMiktar,
        CASE WHEN UPPER(ISNULL(d.grup_kodu, '')) = N'KH'
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
          kg.id          AS kumas_grup_id,
          kg.kod         AS kumas_grup_kod,
          g.renk_id      AS renk_id,
          rn.kod         AS renk_kod,
          rn.ad          AS renk_ad,
          rk.id          AS recete_kalem_id,
          sk.id          AS siparis_kalem_id,
          SUM(ISNULL(ro.miktar, 0) * ISNULL(srb.miktar, 0)) AS brut
        FROM siparis s
        JOIN siparis_kalem sk        ON sk.siparis_id   = s.id
        JOIN model_recete mr         ON mr.malzeme_id   = sk.malzeme_id
        JOIN recete_kalem rk         ON rk.recete_id  = mr.id
          AND rk.tip = ${receteTip}
          AND ISNULL(rk.tedarik_hesaplanmayacak, 0) = 0
        JOIN malzeme m               ON m.id          = rk.malzeme_id
        -- Reçete varyantı (kumaş grup kodu) LEFT: varyantsız satır renksiz hesaba girer.
        LEFT JOIN kumas_grup kg      ON kg.kod        = rk.variant_1
        JOIN recete_olcu ro          ON ro.kalem_id  = rk.id
        JOIN siparis_renk sr         ON sr.siparis_kalem_id = sk.id
        -- Sipariş rengi -> kumaş grup eşleşmesi (kumaş hesabındaki zincirin aynısı).
        LEFT JOIN siparis_renk_kumas_grup g ON g.siparis_renk_id = sr.id
          AND g.kumas_grup_id = kg.id
        LEFT JOIN renk rn            ON rn.id         = g.renk_id
        JOIN siparis_renk_beden srb  ON srb.siparis_renk_id = sr.id
          AND srb.beden_id = ro.beden_id
        WHERE s.id = ${siparisId}
          AND (${kalemId} IS NULL OR sk.id = ${kalemId})
        GROUP BY
          m.id, m.kod, m.ad,
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
        N'KG'                AS birim,
        CAST(d.brut AS FLOAT) AS brutMiktar,
        CAST(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0) AS FLOAT) AS netMiktar,
        CAST(SUM(d.brut * (1 + ISNULL(TRY_CAST(REPLACE(s.kesim_fazlasi, ',', '.') AS FLOAT), 0) / 100.0)) OVER (PARTITION BY d.malzeme_id) AS FLOAT) AS kumasNetToplam
      FROM detay d
      JOIN siparis s ON s.id = ${siparisId}
      ORDER BY d.malzeme_kod
    `

    const toplamNet = Math.round(
      rows.reduce((acc, r) => acc + (Number(r.netMiktar) || 0) * 1e6, 0) / 1e6,
    )

    return { satirlar: rows, toplamNet }
  }

  // Kumaş planlaması + serbest stok karşılaması.
  // Her ihtiyaç satırına iki stok toplamı eklenir (brüt üzerinden — fason brütle çalışır,
  // satın alınan kumaşta brüt≈net kabul edilir):
  // - renkliStok: aynı malzeme + aynı renk (varyant1_renk_id = ti.renk_id, ID ile eşleşir).
  //   İhtiyaç renksizse (ham isteniyorsa) renksiz stok buraya düşer.
  // - hamStok: aynı malzeme + renksiz (varyant1 NULL) = boyanabilir ham; yalnızca renkli
  //   ihtiyaçta dolar (ham ihtiyaca ham yazmak çift sayım olurdu).
  // Serbest = siparis_kalem_id boş + tahsis kaydı yok (başkasına rezerve düşmez).
  // Giriş/çıkış listeleri depoStokDetay ile aynıdır; yalnızca tamamlandi=1 sayılır.
  async planlamaKumas() {
    const GIRIS = `('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101')`
    const CIKIS = `('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140')`
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
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(ik2.brut_agirlik, ik2.net_agirlik, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -COALESCE(ik2.brut_agirlik, ik2.net_agirlik, 0)
                   ELSE 0 END) AS kg,
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(ik2.brut_metre, ik2.net_metre, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -COALESCE(ik2.brut_metre, ik2.net_metre, 0)
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
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(ik2.brut_agirlik, ik2.net_agirlik, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -COALESCE(ik2.brut_agirlik, ik2.net_agirlik, 0)
                   ELSE 0 END) AS kg,
          SUM(CASE WHEN i2.irsaliye_tipi IN ${GIRIS} THEN COALESCE(ik2.brut_metre, ik2.net_metre, 0)
                   WHEN i2.irsaliye_tipi IN ${CIKIS} THEN -COALESCE(ik2.brut_metre, ik2.net_metre, 0)
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

    const yuvarla = (v: number) => Math.round(v * 1e4) / 1e4
    return rows.map((r) => {
      const birim = (r.birim || '').toLowerCase()
      const birimeGore = (kg: unknown, mt: unknown, adet: unknown) =>
        birim.includes('kg')
          ? Number(kg) || 0
          : birim.includes('adet')
            ? Number(adet) || 0
            : Number(mt) || 0
      const renkliStok = yuvarla(birimeGore(r.renkliStokKg, r.renkliStokMt, r.renkliStokAdet))
      const hamStok = yuvarla(birimeGore(r.hamStokKg, r.hamStokMt, r.hamStokAdet))
      const gereken = yuvarla(Number(r.gerekenMiktar) || 0)
      const acikMiktar = yuvarla(Math.max(0, gereken - renkliStok - hamStok))
      const oneri: 'STOK' | 'HAM_BOYA' | 'TEMIN' =
        renkliStok >= gereken ? 'STOK' : renkliStok + hamStok >= gereken ? 'HAM_BOYA' : 'TEMIN'
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
        islem: r.islem,
        varyant1: r.varyant1,
        varyant1Aciklama: r.varyant1Aciklama,
        varyant1RenkId: r.varyant1RenkId,
        brutMiktar: Number(r.brutMiktar) || 0,
        gerekenMiktar: gereken,
        guncelMi: Number(r.bayat ?? 0) === 0,
        birim: r.birim,
        renkliStok,
        hamStok,
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

  async planlamaKumasHareketler(siparisNo: string, malzemeKod: string) {
    const rows = await this.prisma.$queryRaw<
      {
        kalemId: number
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
        ik.id                AS kalemId,
        i.id                 AS irsaliyeId,
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
      kalemId: r.kalemId,
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
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik.brut_agirlik, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik.brut_agirlik, 0)
                           ELSE 0 END
                 ELSE 0 END) AS renkliKg,
        SUM(CASE WHEN (r.kod = ${renkKod ?? null}
                       OR (${renkKod ?? null} IS NULL AND ik.varyant1_renk_id IS NULL))
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik.brut_metre, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik.brut_metre, 0)
                           ELSE 0 END
                 ELSE 0 END) AS renkliMt,
        SUM(CASE WHEN (r.kod = ${renkKod ?? null}
                       OR (${renkKod ?? null} IS NULL AND ik.varyant1_renk_id IS NULL))
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik.adet, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik.adet, 0)
                           ELSE 0 END
                 ELSE 0 END) AS renkliAdet,
        SUM(CASE WHEN ${renkKod ?? null} IS NOT NULL AND ik.varyant1_renk_id IS NULL
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik.brut_agirlik, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik.brut_agirlik, 0)
                           ELSE 0 END
                 ELSE 0 END) AS hamKg,
        SUM(CASE WHEN ${renkKod ?? null} IS NOT NULL AND ik.varyant1_renk_id IS NULL
                 THEN CASE WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik.brut_metre, 0)
                           WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik.brut_metre, 0)
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
        AND (r.kod = ${renkKod ?? null} OR (${renkKod ?? null} IS NULL AND ik.varyant1_renk_id IS NULL))
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
