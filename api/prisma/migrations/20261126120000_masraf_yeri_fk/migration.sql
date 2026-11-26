-- Masraf Yeri FK normalizasyonu (TODO 29)

ALTER TABLE [dbo].[kullanici] ADD [masraf_yeri_id] INT NULL;
ALTER TABLE [dbo].[kasa_banka_hesap] ADD [masraf_yeri_id] INT NULL;
ALTER TABLE [dbo].[muhasebe_fis] ADD [masraf_yeri_id] INT NULL;
ALTER TABLE [dbo].[cari_hesap_fis] ADD [masraf_yeri_id] INT NULL;
ALTER TABLE [dbo].[fatura] ADD [masraf_yeri_id] INT NULL;

EXEC(N'
UPDATE k SET k.[masraf_yeri_id] = m.[id]
FROM [dbo].[kullanici] k
JOIN [dbo].[masraf_yeri] m ON m.[kod] = k.[masraf_yeri]
WHERE k.[masraf_yeri] IS NOT NULL AND LTRIM(RTRIM(k.[masraf_yeri])) <> '''';

UPDATE k SET k.[masraf_yeri_id] = m.[id]
FROM [dbo].[kasa_banka_hesap] k
JOIN [dbo].[masraf_yeri] m ON m.[kod] = k.[masraf_yeri_kodu]
WHERE k.[masraf_yeri_kodu] IS NOT NULL AND LTRIM(RTRIM(k.[masraf_yeri_kodu])) <> '''';

UPDATE f SET f.[masraf_yeri_id] = m.[id]
FROM [dbo].[muhasebe_fis] f
JOIN [dbo].[masraf_yeri] m ON m.[kod] = f.[masraf_yeri]
WHERE f.[masraf_yeri] IS NOT NULL AND LTRIM(RTRIM(f.[masraf_yeri])) <> '''';

UPDATE c SET c.[masraf_yeri_id] = m.[id]
FROM [dbo].[cari_hesap_fis] c
JOIN [dbo].[masraf_yeri] m ON m.[kod] = c.[masraf_yeri]
WHERE c.[masraf_yeri] IS NOT NULL AND LTRIM(RTRIM(c.[masraf_yeri])) <> '''';

UPDATE f SET f.[masraf_yeri_id] = m.[id]
FROM [dbo].[fatura] f
JOIN [dbo].[masraf_yeri] m ON m.[kod] = f.[masraf_yeri]
WHERE f.[masraf_yeri] IS NOT NULL AND LTRIM(RTRIM(f.[masraf_yeri])) <> '''';

ALTER TABLE [dbo].[kullanici] ADD CONSTRAINT [kullanici_masraf_yeri_id_fkey] FOREIGN KEY ([masraf_yeri_id]) REFERENCES [dbo].[masraf_yeri]([id]) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE [dbo].[kasa_banka_hesap] ADD CONSTRAINT [kasa_banka_hesap_masraf_yeri_id_fkey] FOREIGN KEY ([masraf_yeri_id]) REFERENCES [dbo].[masraf_yeri]([id]) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE [dbo].[muhasebe_fis] ADD CONSTRAINT [muhasebe_fis_masraf_yeri_id_fkey] FOREIGN KEY ([masraf_yeri_id]) REFERENCES [dbo].[masraf_yeri]([id]) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE [dbo].[cari_hesap_fis] ADD CONSTRAINT [cari_hesap_fis_masraf_yeri_id_fkey] FOREIGN KEY ([masraf_yeri_id]) REFERENCES [dbo].[masraf_yeri]([id]) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE [dbo].[fatura] ADD CONSTRAINT [fatura_masraf_yeri_id_fkey] FOREIGN KEY ([masraf_yeri_id]) REFERENCES [dbo].[masraf_yeri]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX [kullanici_masraf_yeri_id_idx] ON [dbo].[kullanici]([masraf_yeri_id]);
CREATE INDEX [kasa_banka_hesap_masraf_yeri_id_idx] ON [dbo].[kasa_banka_hesap]([masraf_yeri_id]);
CREATE INDEX [muhasebe_fis_masraf_yeri_id_idx] ON [dbo].[muhasebe_fis]([masraf_yeri_id]);
CREATE INDEX [cari_hesap_fis_masraf_yeri_id_idx] ON [dbo].[cari_hesap_fis]([masraf_yeri_id]);
CREATE INDEX [fatura_masraf_yeri_id_idx] ON [dbo].[fatura]([masraf_yeri_id]);
');

-- Cari risk limiti (TODO 37)
ALTER TABLE [dbo].[cari_hesap] ADD [risk_limiti] DECIMAL(18,2) NULL;
