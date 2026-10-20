SELECT TOP 10 * FROM (
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
          SUM(CASE WHEN i2.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik2.brut_agirlik, 0)
                   WHEN i2.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik2.brut_agirlik, 0)
                   ELSE 0 END) AS kg,
          SUM(CASE WHEN i2.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik2.brut_metre, 0)
                   WHEN i2.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik2.brut_metre, 0)
                   ELSE 0 END) AS mt,
          SUM(CASE WHEN i2.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik2.adet, 0)
                   WHEN i2.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik2.adet, 0)
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
          SUM(CASE WHEN i2.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik2.brut_agirlik, 0)
                   WHEN i2.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik2.brut_agirlik, 0)
                   ELSE 0 END) AS kg,
          SUM(CASE WHEN i2.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik2.brut_metre, 0)
                   WHEN i2.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik2.brut_metre, 0)
                   ELSE 0 END) AS mt,
          SUM(CASE WHEN i2.irsaliye_tipi IN ('1','5','6','9','11','22','122','124','125','133','139','10','16','17','18','20','21','40','101') THEN ISNULL(ik2.adet, 0)
                   WHEN i2.irsaliye_tipi IN ('2','3','4','8','12','23','120','121','123','126','134','138','192','99','130','131','132','135','136','137','140') THEN -ISNULL(ik2.adet, 0)
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
      GROUP BY s.siparis_no, mm.kod, mm.ad, sk.miktar, ch.ad, ti.malzeme_kod, ti.malzeme_ad, ti.malzeme_id, rk.islem, ti.renk_id, ti.renk_kod, ti.renk_ad, rs.kg, rs.mt, rs.adet, hs.kg, hs.mt, hs.adet
) t;
