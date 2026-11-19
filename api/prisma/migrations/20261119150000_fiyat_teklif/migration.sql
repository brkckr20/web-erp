-- Satın alma fiyat teklifleri: teklif başlığı, malzeme kalemleri ve ekler.

BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[fiyat_teklif] (
    [id] INT NOT NULL IDENTITY(1,1),
    [teklif_no] VARCHAR(20) NOT NULL,
    [tarih] DATETIME2 NOT NULL,
    [gecerlilik_tarihi] DATETIME2 NULL,
    [cari_kod] VARCHAR(50) NOT NULL,
    [cari_ad] NVARCHAR(200) NULL,
    [aciklama] NVARCHAR(500) NULL,
    [olusturan_kullanici] INT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [fiyat_teklif_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [fiyat_teklif_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE UNIQUE INDEX [fiyat_teklif_teklif_no_key] ON [dbo].[fiyat_teklif]([teklif_no]);
CREATE INDEX [fiyat_teklif_cari_kod_idx] ON [dbo].[fiyat_teklif]([cari_kod]);

CREATE TABLE [dbo].[fiyat_teklif_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fiyat_teklif_id] INT NOT NULL,
    [malzeme_kod] VARCHAR(50) NOT NULL,
    [malzeme_ad] NVARCHAR(200) NULL,
    [miktar] DECIMAL(18,4) NOT NULL,
    [birim] NVARCHAR(20) NOT NULL CONSTRAINT [fiyat_teklif_kalem_birim_df] DEFAULT N'ADET',
    [birim_fiyat] DECIMAL(18,4) NOT NULL CONSTRAINT [fiyat_teklif_kalem_birim_fiyat_df] DEFAULT 0,
    [doviz_cinsi] VARCHAR(10) NOT NULL CONSTRAINT [fiyat_teklif_kalem_doviz_cinsi_df] DEFAULT 'TL',
    [doviz_kuru] DECIMAL(18,6) NULL,
    [aciklama] NVARCHAR(500) NULL,
    [sira] INT NOT NULL CONSTRAINT [fiyat_teklif_kalem_sira_df] DEFAULT 0,
    CONSTRAINT [fiyat_teklif_kalem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [fiyat_teklif_kalem_fiyat_teklif_id_fkey] FOREIGN KEY ([fiyat_teklif_id]) REFERENCES [dbo].[fiyat_teklif]([id]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX [fiyat_teklif_kalem_fiyat_teklif_id_idx] ON [dbo].[fiyat_teklif_kalem]([fiyat_teklif_id]);

CREATE TABLE [dbo].[fiyat_teklif_dosya] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fiyat_teklif_id] INT NOT NULL,
    [dosya_adi] NVARCHAR(255) NOT NULL,
    [mimetype] NVARCHAR(100) NULL,
    [boyut] INT NULL,
    [dosya] VARBINARY(MAX) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [fiyat_teklif_dosya_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [fiyat_teklif_dosya_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [fiyat_teklif_dosya_fiyat_teklif_id_fkey] FOREIGN KEY ([fiyat_teklif_id]) REFERENCES [dbo].[fiyat_teklif]([id]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX [fiyat_teklif_dosya_fiyat_teklif_id_idx] ON [dbo].[fiyat_teklif_dosya]([fiyat_teklif_id]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
