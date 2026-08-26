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
    // İrsaliye tipleri: giriş (+1), çıkış (-1). Sadece tamamlandı olanlar stoğa yansır.
    const irsaliyeYon = `
      CASE
        WHEN i.irsaliye_tipi IN ('1','2','3','4','5','9','10','11','12','16','17','18','20','40','101') THEN 1
        WHEN i.irsaliye_tipi IN ('8','99','120','121','122','123','124','130','131','132','134','135','136','137','140') THEN -1
        ELSE 0
      END
    `

    const rows = await this.prisma.$queryRawUnsafe<DepoBazliStokSatir[]>(`
      SELECT
        d.kod  AS depoKod,
        d.ad   AS depoAd,
        m.kod  AS malzemeKod,
        m.ad   AS malzemeAd,
        CAST(COALESCE(SUM(CASE WHEN t.brut_agirlik IS NOT NULL THEN t.brut_agirlik * t.yon ELSE 0 END), 0) AS FLOAT) AS brutKg,
        CAST(COALESCE(SUM(CASE WHEN t.net_agirlik  IS NOT NULL THEN t.net_agirlik  * t.yon ELSE 0 END), 0) AS FLOAT) AS kg,
        CAST(COALESCE(SUM(CASE WHEN t.brut_metre   IS NOT NULL THEN t.brut_metre   * t.yon ELSE 0 END), 0) AS FLOAT) AS brutMt,
        CAST(COALESCE(SUM(CASE WHEN t.net_metre    IS NOT NULL THEN t.net_metre    * t.yon ELSE 0 END), 0) AS FLOAT) AS mt,
        CAST(COALESCE(SUM(CASE WHEN t.adet         IS NOT NULL THEN t.adet         * t.yon ELSE 0 END), 0) AS INT)    AS adet
      FROM (
        SELECT i.depo_id AS depo_id, k.malzeme_id AS malzeme_id,
          ${irsaliyeYon} AS yon,
          k.brut_agirlik, k.net_agirlik, k.brut_metre, k.net_metre, k.adet
        FROM irsaliye i
        JOIN irsaliye_kalem k ON k.irsaliye_id = i.id
        WHERE i.tamamlandi = 1
          AND k.malzeme_id IS NOT NULL
      ) t
      LEFT JOIN depo d ON d.id = t.depo_id
      LEFT JOIN malzeme m ON m.id = t.malzeme_id
      WHERE t.yon <> 0
      GROUP BY d.kod, d.ad, m.kod, m.ad
      HAVING
        COALESCE(SUM(t.brut_agirlik * t.yon), 0) <> 0 OR
        COALESCE(SUM(t.net_agirlik  * t.yon), 0) <> 0 OR
        COALESCE(SUM(t.brut_metre   * t.yon), 0) <> 0 OR
        COALESCE(SUM(t.net_metre    * t.yon), 0) <> 0 OR
        COALESCE(SUM(t.adet         * t.yon), 0) <> 0
      ORDER BY d.kod, m.kod
    `)

    return rows
  }
}
