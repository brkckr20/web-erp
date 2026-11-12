-- Model bazlı beden sırası (Ölçü tablosundaki yukarı/aşağı okları ile yönetilir).
-- SQL Server batch'i tek seferde derlediği için yeni kolona başvuran kısımlar dinamik SQL ile çalıştırılır.
IF COL_LENGTH('malzeme_beden', 'sira') IS NULL
BEGIN
  ALTER TABLE malzeme_beden ADD sira INT NULL;
END

EXEC(N'
;WITH sirali AS (
  SELECT mb.id AS id,
         ROW_NUMBER() OVER (PARTITION BY mb.malzeme_id ORDER BY b.sira ASC, mb.id ASC) AS rn
  FROM malzeme_beden mb
  INNER JOIN beden b ON b.id = mb.beden_id
)
UPDATE mb
SET sira = sirali.rn
FROM malzeme_beden mb
INNER JOIN sirali ON sirali.id = mb.id;
');

EXEC(N'ALTER TABLE malzeme_beden ALTER COLUMN sira INT NOT NULL;');

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_malzeme_beden_sira')
BEGIN
  ALTER TABLE malzeme_beden ADD CONSTRAINT DF_malzeme_beden_sira DEFAULT 0 FOR sira;
END
