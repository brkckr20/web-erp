-- Varsayılan "Boyahanede Bekleyenler" raporu (fason hareket ekranı > Raporlar).
-- Kalan = fasona çıkış (134) − fasondan giriş (11), cari + kumaş + renk bazında.

BEGIN TRY

BEGIN TRAN;

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[sablon]
    WHERE [ekran_adi] = N'boyahane-bekleyenler' AND [ad] = N'Boyahanede Bekleyenler'
)
BEGIN
    INSERT INTO [dbo].[sablon] (
        [ad], [ekran_adi], [html_icerik], [sayfa_en], [sayfa_boy], [yon],
        [ust_bosluk], [alt_bosluk], [sol_bosluk], [sag_bosluk], [alt_bilgi], [aktif],
        [filigran_kosul], [olusturma_tarihi]
    )
    VALUES (
        N'Boyahanede Bekleyenler',
        N'boyahane-bekleyenler',
        N'<div style="font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#111;">
  <div style="font-size:16px; font-weight:bold; margin-bottom:2px;">Boyahanede Bekleyen Kumaşlar</div>
  <div style="font-size:10px; color:#555; margin-bottom:10px;">Fasona çıkış (134) − fasondan giriş (11) farkı; cari / kumaş / renk bazında.</div>
  <table style="border-collapse:collapse; width:100%;">
    <thead>
      <tr style="background:#f1f5f9;">
        <th style="border:1px solid #d1d5db; padding:4px 6px; text-align:left; width:110px;">Cari Kod</th>
        <th style="border:1px solid #d1d5db; padding:4px 6px; text-align:left;">Cari</th>
        <th style="border:1px solid #d1d5db; padding:4px 6px; text-align:left; width:90px;">Kumaş Kodu</th>
        <th style="border:1px solid #d1d5db; padding:4px 6px; text-align:left;">Kumaş</th>
        <th style="border:1px solid #d1d5db; padding:4px 6px; text-align:left; width:90px;">Renk</th>
        <th style="border:1px solid #d1d5db; padding:4px 6px; text-align:right; width:70px;">Çıkan MT</th>
        <th style="border:1px solid #d1d5db; padding:4px 6px; text-align:right; width:70px;">Gelen MT</th>
        <th style="border:1px solid #d1d5db; padding:4px 6px; text-align:right; width:80px;">Bekleyen MT</th>
      </tr>
    </thead>
    <tbody>
      {{#each bekleyenler}}
      <tr>
        <td style="border:1px solid #e5e7eb; padding:4px 6px;">{{cariKod}}</td>
        <td style="border:1px solid #e5e7eb; padding:4px 6px;">{{cariAd}}</td>
        <td style="border:1px solid #e5e7eb; padding:4px 6px;">{{malzemeKod}}</td>
        <td style="border:1px solid #e5e7eb; padding:4px 6px;">{{malzemeAd}}</td>
        <td style="border:1px solid #e5e7eb; padding:4px 6px;">{{renkAd}}</td>
        <td style="border:1px solid #e5e7eb; padding:4px 6px; text-align:right;">{{cikanMT}}</td>
        <td style="border:1px solid #e5e7eb; padding:4px 6px; text-align:right;">{{gelenMT}}</td>
        <td style="border:1px solid #e5e7eb; padding:4px 6px; text-align:right; font-weight:bold;">{{bekleyenMT}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>',
        210, 297, N'dikey', 10, 10, 15, 15, 1, 1, N'kapali', SYSDATETIME()
    );

    DECLARE @sablonId INT = SCOPE_IDENTITY();

    INSERT INTO [dbo].[sablon_sorgu] ([sablon_id], [ad], [sql_icerik], [sira])
    VALUES (
        @sablonId,
        N'bekleyenler',
        N'SELECT
  ISNULL(ch.kod, ''-'') AS cariKod,
  ISNULL(ch.ad, ''-'') AS cariAd,
  m.kod AS malzemeKod,
  m.ad AS malzemeAd,
  ISNULL(r.kod, ''-'') AS renkKod,
  ISNULL(r.ad, ''-'') AS renkAd,
  CAST(SUM(CASE WHEN i.irsaliye_tipi = ''134'' THEN ISNULL(ik.net_metre, 0) ELSE 0 END) AS DECIMAL(18,2)) AS cikanMT,
  CAST(SUM(CASE WHEN i.irsaliye_tipi = ''11'' THEN ISNULL(ik.net_metre, 0) ELSE 0 END) AS DECIMAL(18,2)) AS gelenMT,
  CAST(SUM(
    CASE
      WHEN i.irsaliye_tipi = ''134'' THEN ISNULL(ik.net_metre, 0)
      WHEN i.irsaliye_tipi = ''11'' THEN -ISNULL(ik.net_metre, 0)
      ELSE 0
    END
  ) AS DECIMAL(18,2)) AS bekleyenMT
FROM irsaliye_kalem ik
JOIN irsaliye i ON i.id = ik.irsaliye_id
JOIN malzeme m ON m.id = ik.malzeme_id
LEFT JOIN cari_hesap ch ON ch.id = i.cari_hesap_id
LEFT JOIN renk r ON r.id = ik.varyant1_renk_id
WHERE i.tamamlandi = 1
  AND i.irsaliye_tipi IN (''134'', ''11'')
GROUP BY ch.kod, ch.ad, m.kod, m.ad, r.kod, r.ad
HAVING SUM(
  CASE
    WHEN i.irsaliye_tipi = ''134'' THEN ISNULL(ik.net_metre, 0)
    WHEN i.irsaliye_tipi = ''11'' THEN -ISNULL(ik.net_metre, 0)
    ELSE 0
  END
) <> 0
ORDER BY cariKod, malzemeKod, renkKod',
        0
    );
END

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
