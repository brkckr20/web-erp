import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface DepoBazliStokSatir {
  depoKod: string
  depoAd: string
  malzemeKod: string
  malzemeAd: string
  brutKg: number
  kg: number
  brutMt: number
  mt: number
  adet: number
}

@Injectable()
export class RaporService {
  constructor(private prisma: PrismaService) {}

  async depoBazliStok(): Promise<DepoBazliStokSatir[]> {
    // Giriş fiş tipleri (+1), çıkış fiş tipleri (-1). Diğerleri hariç.
    const yon = `
      CASE
        WHEN f.fis_tipi IN ('10','16','18','40','101','135','20') THEN 1
        WHEN f.fis_tipi IN ('130','131','132','136','137','140','99') THEN -1
        ELSE 0
      END
    `

    const rows = await this.prisma.$queryRawUnsafe<DepoBazliStokSatir[]>(`
      SELECT
        d.kod  AS depoKod,
        d.ad   AS depoAd,
        m.kod  AS malzemeKod,
        m.ad   AS malzemeAd,
        CAST(COALESCE(SUM(CASE WHEN k.brut_agirlik IS NOT NULL THEN k.brut_agirlik * ${yon} ELSE 0 END), 0) AS FLOAT) AS brutKg,
        CAST(COALESCE(SUM(CASE WHEN k.net_agirlik  IS NOT NULL THEN k.net_agirlik  * ${yon} ELSE 0 END), 0) AS FLOAT) AS kg,
        CAST(COALESCE(SUM(CASE WHEN k.brut_metre   IS NOT NULL THEN k.brut_metre   * ${yon} ELSE 0 END), 0) AS FLOAT) AS brutMt,
        CAST(COALESCE(SUM(CASE WHEN k.net_metre    IS NOT NULL THEN k.net_metre    * ${yon} ELSE 0 END), 0) AS FLOAT) AS mt,
        CAST(COALESCE(SUM(CASE WHEN k.adet         IS NOT NULL THEN k.adet         * ${yon} ELSE 0 END), 0) AS INT)    AS adet
      FROM stok_hareket_fisi f
      JOIN stok_hareket_fisi_kalem k ON k.fis_id = f.id
      LEFT JOIN depo d ON d.id = f.depo_id
      LEFT JOIN malzeme m ON m.id = k.malzeme_id
      WHERE (${yon}) <> 0
        AND k.malzeme_id IS NOT NULL
      GROUP BY d.kod, d.ad, m.kod, m.ad
      HAVING
        COALESCE(SUM(k.brut_agirlik * ${yon}), 0) <> 0 OR
        COALESCE(SUM(k.net_agirlik  * ${yon}), 0) <> 0 OR
        COALESCE(SUM(k.brut_metre   * ${yon}), 0) <> 0 OR
        COALESCE(SUM(k.net_metre    * ${yon}), 0) <> 0 OR
        COALESCE(SUM(k.adet         * ${yon}), 0) <> 0
      ORDER BY d.kod, m.kod
    `)

    return rows
  }
}
