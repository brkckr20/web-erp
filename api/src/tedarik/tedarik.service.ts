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
          })),
        })
      }
    })

    return { satirlar, toplamNet, kaydedildi: true }
  }

  private async hesaplaRaw(params: HesaplaParamsDto): Promise<HesaplaSonuc> {
    const siparisId = Number(params.siparisId)
    const kalemId = params.kalemId ? Number(params.kalemId) : null

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
