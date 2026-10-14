import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RaporService {
  constructor(private prisma: PrismaService) {}

  async depoBazliStok() {
    const rows = await this.prisma.$queryRaw<
      {
        depoKod: string;
        depoAd: string;
        malzemeKod: string;
        malzemeAd: string;
        brutKg: unknown;
        kg: unknown;
        brutMt: unknown;
        mt: unknown;
        adet: unknown;
      }[]
    >`
      SELECT
        d.kod AS depoKod,
        d.ad  AS depoAd,
        m.kod AS malzemeKod,
        m.ad  AS malzemeAd,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101')
              THEN ISNULL(ik.brut_agirlik, 0)
            WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140')
              THEN -ISNULL(ik.brut_agirlik, 0)
            ELSE 0
          END
        ) AS brutKg,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101')
              THEN ISNULL(ik.net_agirlik, 0)
            WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140')
              THEN -ISNULL(ik.net_agirlik, 0)
            ELSE 0
          END
        ) AS kg,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101')
              THEN ISNULL(ik.brut_metre, 0)
            WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140')
              THEN -ISNULL(ik.brut_metre, 0)
            ELSE 0
          END
        ) AS brutMt,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101')
              THEN ISNULL(ik.net_metre, 0)
            WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140')
              THEN -ISNULL(ik.net_metre, 0)
            ELSE 0
          END
        ) AS mt,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101')
              THEN ISNULL(ik.adet, 0)
            WHEN i.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140')
              THEN -ISNULL(ik.adet, 0)
            ELSE 0
          END
        ) AS adet
      FROM irsaliye_kalem ik
      JOIN irsaliye i   ON i.id = ik.irsaliye_id
      JOIN malzeme m    ON m.id = ik.malzeme_id
      LEFT JOIN depo d  ON d.id = i.depo_id
      WHERE i.tamamlandi = 1
        AND d.kod IS NOT NULL
      GROUP BY d.kod, d.ad, m.kod, m.ad
      ORDER BY d.kod, m.kod
    `;

    return rows.map((r) => ({
      depoKod: r.depoKod,
      depoAd: r.depoAd,
      malzemeKod: r.malzemeKod,
      malzemeAd: r.malzemeAd,
      brutKg: Number(r.brutKg) || 0,
      kg: Number(r.kg) || 0,
      brutMt: Number(r.brutMt) || 0,
      mt: Number(r.mt) || 0,
      adet: Number(r.adet) || 0,
    }));
  }

  // Depo × Malzeme × Renk (varyant1) × Sipariş × Parti × Takip kırılımlı stok.
  // Giriş/çıkış mantığı depoBazliStok ile aynıdır; yalnızca GROUP BY detaylıdır.
  // Renk/sipariş/parti girilmemiş satırlar ilgili kolonda NULL gelir (ekranda '-').
  async depoStokDetay() {
    const GIRIS = `('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101')`
    const CIKIS = `('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140')`
    const rows = await this.prisma.$queryRawUnsafe<
      {
        depoKod: string;
        depoAd: string;
        malzemeKod: string;
        malzemeAd: string;
        renkKod: string | null;
        renkAd: string | null;
        siparisNo: string | null;
        partiNo: string | null;
        takipNo: string | null;
        brutKg: unknown;
        kg: unknown;
        brutMt: unknown;
        mt: unknown;
        adet: unknown;
      }[]
    >(`
      SELECT
        d.kod AS depoKod,
        d.ad  AS depoAd,
        m.kod AS malzemeKod,
        m.ad  AS malzemeAd,
        r.kod AS renkKod,
        r.ad  AS renkAd,
        -- Sipariş: önce kalemin direkt bağı, yoksa gruptaki satırların tahsislerindeki
        -- sipariş noları (tekse o, çoksa virgüllü liste). İkisi de yoksa NULL.
        (
          SELECT STRING_AGG(x.no, ', ') WITHIN GROUP (ORDER BY x.no)
          FROM (
            SELECT s2.siparis_no AS no
            FROM irsaliye_kalem ik2
            JOIN irsaliye i2 ON i2.id = ik2.irsaliye_id
            JOIN depo d2 ON d2.id = i2.depo_id
            JOIN malzeme m2 ON m2.id = ik2.malzeme_id
            LEFT JOIN renk r2 ON r2.id = ik2.varyant1_renk_id
            LEFT JOIN siparis_kalem sk2 ON sk2.id = ik2.siparis_kalem_id
            LEFT JOIN siparis s2 ON s2.id = sk2.siparis_id
            WHERE i2.tamamlandi = 1
              AND d2.kod = d.kod
              AND m2.kod = m.kod
              AND ISNULL(r2.kod, '') = ISNULL(r.kod, '')
              AND ISNULL(ik2.parti_no, '') = ISNULL(ik.parti_no, '')
              AND ISNULL(ik2.takip_no, '') = ISNULL(ik.takip_no, '')
              AND s2.siparis_no IS NOT NULL
            UNION
            SELECT t.siparis_no AS no
            FROM irsaliye_kalem_tahsis t
            JOIN irsaliye_kalem ik2 ON ik2.id = t.irsaliye_kalem_id
            JOIN irsaliye i2 ON i2.id = ik2.irsaliye_id
            JOIN depo d2 ON d2.id = i2.depo_id
            JOIN malzeme m2 ON m2.id = ik2.malzeme_id
            LEFT JOIN renk r2 ON r2.id = ik2.varyant1_renk_id
            WHERE i2.tamamlandi = 1
              AND d2.kod = d.kod
              AND m2.kod = m.kod
              AND ISNULL(r2.kod, '') = ISNULL(r.kod, '')
              AND ISNULL(ik2.parti_no, '') = ISNULL(ik.parti_no, '')
              AND ISNULL(ik2.takip_no, '') = ISNULL(ik.takip_no, '')
              AND t.siparis_no IS NOT NULL
          ) x
        ) AS siparisNo,
        ik.parti_no AS partiNo,
        ik.takip_no AS takipNo,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ${GIRIS}
              THEN ISNULL(ik.brut_agirlik, 0)
            WHEN i.irsaliye_tipi IN ${CIKIS}
              THEN -ISNULL(ik.brut_agirlik, 0)
            ELSE 0
          END
        ) AS brutKg,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ${GIRIS}
              THEN ISNULL(ik.net_agirlik, 0)
            WHEN i.irsaliye_tipi IN ${CIKIS}
              THEN -ISNULL(ik.net_agirlik, 0)
            ELSE 0
          END
        ) AS kg,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ${GIRIS}
              THEN ISNULL(ik.brut_metre, 0)
            WHEN i.irsaliye_tipi IN ${CIKIS}
              THEN -ISNULL(ik.brut_metre, 0)
            ELSE 0
          END
        ) AS brutMt,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ${GIRIS}
              THEN ISNULL(ik.net_metre, 0)
            WHEN i.irsaliye_tipi IN ${CIKIS}
              THEN -ISNULL(ik.net_metre, 0)
            ELSE 0
          END
        ) AS mt,
        SUM(
          CASE
            WHEN i.irsaliye_tipi IN ${GIRIS}
              THEN ISNULL(ik.adet, 0)
            WHEN i.irsaliye_tipi IN ${CIKIS}
              THEN -ISNULL(ik.adet, 0)
            ELSE 0
          END
        ) AS adet
      FROM irsaliye_kalem ik
      JOIN irsaliye i   ON i.id = ik.irsaliye_id
      JOIN malzeme m    ON m.id = ik.malzeme_id
      LEFT JOIN depo d  ON d.id = i.depo_id
      LEFT JOIN renk r  ON r.id = ik.varyant1_renk_id
      WHERE i.tamamlandi = 1
        AND d.kod IS NOT NULL
      GROUP BY d.kod, d.ad, m.kod, m.ad, r.kod, r.ad, ik.parti_no, ik.takip_no
      ORDER BY d.kod, m.kod, r.kod, ik.parti_no
    `)

    return rows.map((r) => ({
      depoKod: r.depoKod,
      depoAd: r.depoAd,
      malzemeKod: r.malzemeKod,
      malzemeAd: r.malzemeAd,
      renkKod: r.renkKod,
      renkAd: r.renkAd,
      siparisNo: r.siparisNo,
      partiNo: r.partiNo,
      takipNo: r.takipNo,
      brutKg: Number(r.brutKg) || 0,
      kg: Number(r.kg) || 0,
      brutMt: Number(r.brutMt) || 0,
      mt: Number(r.mt) || 0,
      adet: Number(r.adet) || 0,
    }))
  }

  async malzemeStokEkstresi(malzemeKod: string) {
    const rows = await this.prisma.$queryRaw<
      {
        tarih: Date;
        irsaliyeTipi: string;
        irsaliyeNo: string;
        depoKod: string | null;
        depoAd: string | null;
        brutAgirlik: unknown;
        netAgirlik: unknown;
        brutMetre: unknown;
        netMetre: unknown;
        adet: unknown;
        olcuBirimi: string | null;
        birimFiyat: unknown;
        satirTutari: unknown;
        aciklama: string | null;
        cariAd: string | null;
      }[]
    >`
      SELECT
        i.irsaliye_tarihi    AS tarih,
        i.irsaliye_tipi      AS irsaliyeTipi,
        i.irsaliye_no        AS irsaliyeNo,
        d.kod                AS depoKod,
        d.ad                 AS depoAd,
        ik.brut_agirlik      AS brutAgirlik,
        ik.net_agirlik       AS netAgirlik,
        ik.brut_metre        AS brutMetre,
        ik.net_metre         AS netMetre,
        ik.adet              AS adet,
        ik.olcu_birimi       AS olcuBirimi,
        ik.birim_fiyat       AS birimFiyat,
        ik.satir_tutari      AS satirTutari,
        ik.aciklama          AS aciklama,
        ch.ad                AS cariAd
      FROM irsaliye_kalem ik
      JOIN irsaliye i          ON i.id = ik.irsaliye_id
      JOIN malzeme m           ON m.id = ik.malzeme_id
      LEFT JOIN depo d         ON d.id = i.depo_id
      LEFT JOIN cari_hesap ch  ON ch.id = i.cari_hesap_id
      WHERE m.kod = ${malzemeKod}
        AND i.tamamlandi = 1
      ORDER BY i.irsaliye_tarihi DESC, i.irsaliye_no DESC
    `;

    const girisTipleri = ['1', '5', '6', '9', '11', '22', '122', '124', '125', '133', '139', '10', '16', '17', '18', '20', '21', '40', '101'];

    return rows.map((r) => {
      const birim = (r.olcuBirimi || '').toUpperCase();
      let miktar = 0;
      if (birim.includes('KG')) {
        miktar = Number(r.netAgirlik) || Number(r.brutAgirlik) || 0;
      } else if (birim.includes('MT') || birim.includes('M ')) {
        miktar = Number(r.netMetre) || Number(r.brutMetre) || 0;
      } else {
        miktar = Number(r.adet) || 0;
      }

      return {
        tarih: r.tarih,
        irsaliyeTipi: r.irsaliyeTipi,
        irsaliyeNo: r.irsaliyeNo,
        depoKod: r.depoKod,
        depoAd: r.depoAd,
        brutKg: Number(r.brutAgirlik) || 0,
        kg: Number(r.netAgirlik) || 0,
        brutMt: Number(r.brutMetre) || 0,
        mt: Number(r.netMetre) || 0,
        adet: Number(r.adet) || 0,
        olcuBirimi: r.olcuBirimi,
        birimFiyat: Number(r.birimFiyat) || 0,
        satirTutari: Number(r.satirTutari) || 0,
        aciklama: r.aciklama,
        cariAd: r.cariAd,
        yon: girisTipleri.includes(r.irsaliyeTipi) ? 'Giriş' : 'Çıkış',
        miktar,
      };
    });
  }
}
