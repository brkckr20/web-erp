-- Rota operasyonlarına bağlı üretim hareketleri (giden/gelen) kalıcı hale gelir.

BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[uretim_hareket] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_no] VARCHAR(50) NOT NULL,
    [model_kod] VARCHAR(50) NOT NULL,
    [model_ad] VARCHAR(200) NULL,
    [renk_ad] VARCHAR(100) NOT NULL,
    [beden] VARCHAR(20) NOT NULL,
    [rota_kod] NVARCHAR(50) NULL,
    [rota_operasyon_id] INT NULL,
    [islem_kod] NVARCHAR(50) NOT NULL,
    [islem_ad] NVARCHAR(200) NOT NULL,
    [yon] VARCHAR(10) NOT NULL CONSTRAINT [uretim_hareket_yon_df] DEFAULT 'gidis',
    [miktar] INT NOT NULL CONSTRAINT [uretim_hareket_miktar_df] DEFAULT 0,
    [kalite] NVARCHAR(30) NOT NULL CONSTRAINT [uretim_hareket_kalite_df] DEFAULT N'Sağlam',
    [birim_fiyat] DECIMAL(18,4) NULL,
    [doviz_cinsi] VARCHAR(10) NOT NULL CONSTRAINT [uretim_hareket_doviz_cinsi_df] DEFAULT 'TL',
    [doviz_kuru] DECIMAL(18,6) NULL,
    [cari_kod] VARCHAR(50) NULL,
    [cari_ad] VARCHAR(200) NULL,
    [tarih] DATETIME2 NOT NULL,
    [aciklama] NVARCHAR(500) NULL,
    [barkod] VARCHAR(100) NULL,
    [kayit_yapan] VARCHAR(100) NULL,
    [olusturan_kullanici] INT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [uretim_hareket_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [uretim_hareket_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE INDEX [uretim_hareket_siparis_no_idx] ON [dbo].[uretim_hareket]([siparis_no]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
