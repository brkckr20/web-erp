import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { HesaplaParamsDto, HesaplaSonuc, TedarikHesaplaSatir } from './dto/hesapla.dto'
import { TedarikIhtiyacCreateDto } from './dto/create.dto'
import { TedarikIhtiyacUpdateDto } from './dto/update.dto'

@Injectable()
export class TedarikService {
  constructor(private prisma: PrismaService) {}

  async hesapla(params: HesaplaParamsDto): Promise<HesaplaSonuc> {
    const { satirlar, toplamNet } = await this.hesaplaRaw(params)

    await this.prisma.$transaction(async (tx) => {
      const where: { siparisId: number; siparisKalemId?: number } = {
        siparisId: params.siparisId,
      }
      if (params.kalemId) where.siparisKalemId = params.kalemId

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
          })),
        })
      }
    })

    return { satirlar, toplamNet, kaydedildi: true }
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
        JOIN siparis_renk_kumas_grup g ON g.siparis_renk_id = sr.id
          AND g.kumas_grup_id = kg.id
        JOIN renk rn                 ON rn.id         = g.renk_id
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
        JOIN recete_olcu ro          ON ro.kalem_id  = rk.id
        JOIN siparis_renk sr         ON sr.siparis_kalem_id = sk.id
        JOIN siparis_renk_beden srb  ON srb.siparis_renk_id = sr.id
          AND srb.beden_id = ro.beden_id
        WHERE s.id = ${siparisId}
          AND (${kalemId} IS NULL OR sk.id = ${kalemId})
        GROUP BY
          m.id, m.kod, m.ad,
          rk.id, sk.id
      )
      SELECT
        d.malzeme_id          AS malzemeId,
        d.malzeme_kod         AS malzemeKod,
        d.malzeme_ad          AS malzemeAd,
        NULL                  AS kumasGrupId,
        NULL                  AS kumasGrupKod,
        NULL                  AS renkId,
        NULL                  AS renkKod,
        NULL                  AS renkAd,
        d.recete_kalem_id     AS receteKalemId,
        d.siparis_kalem_id    AS siparisKalemId,
        N'ADET'               AS birim,
        CAST(CEILING(d.brut) AS FLOAT) AS brutMiktar,
        CAST(CEILING(d.brut) AS FLOAT) AS netMiktar,
        CAST(CEILING(SUM(d.brut) OVER (PARTITION BY d.malzeme_id)) AS FLOAT) AS kumasNetToplam
      FROM detay d
      ORDER BY d.malzeme_kod
    `

    const toplamNet = Math.round(
      rows.reduce((acc, r) => acc + (Number(r.netMiktar) || 0) * 1e6, 0) / 1e6,
    )

    return { satirlar: rows, toplamNet }
  }

  async planlamaKumas() {
    const rows = await this.prisma.$queryRaw<
      {
        siparisNo: string
        modelKod: string | null
        modelAd: string | null
        siparisMiktar: unknown
        musteriAd: string | null
        malzemeKod: string
        malzemeAd: string
        islem: string | null
        varyant1: string
        varyant1Aciklama: string
        gerekenMiktar: unknown
        birim: string
      }[]
    >`
      SELECT
        s.siparis_no        AS siparisNo,
        mm.kod              AS modelKod,
        mm.ad               AS modelAd,
        sk.miktar           AS siparisMiktar,
        ch.ad               AS musteriAd,
        ti.malzeme_kod      AS malzemeKod,
        ti.malzeme_ad       AS malzemeAd,
        rk.islem            AS islem,
        ti.renk_kod         AS varyant1,
        ti.renk_ad          AS varyant1Aciklama,
        SUM(ti.net_miktar)  AS gerekenMiktar,
        MIN(ti.birim)       AS birim
      FROM tedarik_ihtiyac ti
      JOIN siparis s          ON s.id = ti.siparis_id
      LEFT JOIN cari_hesap ch ON ch.id = s.cari_hesap_id
      JOIN siparis_kalem sk   ON sk.id = ti.siparis_kalem_id
      LEFT JOIN malzeme mm    ON mm.id = sk.malzeme_id
      LEFT JOIN recete_kalem rk ON rk.id = ti.recete_kalem_id
      WHERE ti.tip = N'kumas'
      GROUP BY
        s.siparis_no, mm.kod, mm.ad, sk.miktar, ch.ad,
        ti.malzeme_kod, ti.malzeme_ad, rk.islem,
        ti.renk_kod, ti.renk_ad
      ORDER BY s.siparis_no, mm.kod, ti.malzeme_kod, ti.renk_kod
    `

    return rows.map((r) => ({
      siparisNo: r.siparisNo,
      modelKod: r.modelKod,
      modelAd: r.modelAd,
      siparisMiktar: Number(r.siparisMiktar) || 0,
      musteriAd: r.musteriAd,
      malzemeKod: r.malzemeKod,
      malzemeAd: r.malzemeAd,
      islem: r.islem,
      varyant1: r.varyant1,
      varyant1Aciklama: r.varyant1Aciklama,
      gerekenMiktar: Number(r.gerekenMiktar) || 0,
      birim: r.birim,
    }))
  }

  async findBySiparis(siparisId: number) {
    return this.prisma.tedarikIhtiyac.findMany({
      where: { siparisId },
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
}
