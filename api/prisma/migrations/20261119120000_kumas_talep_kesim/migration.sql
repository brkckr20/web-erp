-- Pastal kesim kayıtları kalıcı hale gelir; sipariş bazlı kumaş talebi formu eklenir.

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[kumas_talep] (
    [id] INT NOT NULL IDENTITY(1,1),
    [talep_no] VARCHAR(20) NOT NULL,
    [siparis_id] INT NULL,
    [siparis_no] VARCHAR(50) NOT NULL,
    [tarih] DATETIME2 NOT NULL,
    [talep_eden] NVARCHAR(100) NULL,
    [aciklama] NVARCHAR(500) NULL,
    [durum] VARCHAR(20) NOT NULL CONSTRAINT [kumas_talep_durum_df] DEFAULT 'BEKLEMEDE',
    [olusturan_kullanici] INT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kumas_talep_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kumas_talep_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE UNIQUE INDEX [kumas_talep_talep_no_key] ON [dbo].[kumas_talep]([talep_no]);
CREATE INDEX [kumas_talep_siparis_no_idx] ON [dbo].[kumas_talep]([siparis_no]);

-- CreateTable
CREATE TABLE [dbo].[kumas_talep_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kumas_talep_id] INT NOT NULL,
    [kumas_kod] VARCHAR(50) NOT NULL,
    [kumas_ad] VARCHAR(200) NULL,
    [renk] VARCHAR(100) NULL,
    [miktar] DECIMAL(18,4) NOT NULL,
    [birim] VARCHAR(10) NOT NULL CONSTRAINT [kumas_talep_kalem_birim_df] DEFAULT 'MT',
    [aciklama] NVARCHAR(500) NULL,
    [sira] INT NOT NULL CONSTRAINT [kumas_talep_kalem_sira_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kumas_talep_kalem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [kumas_talep_kalem_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE INDEX [kumas_talep_kalem_kumas_talep_id_idx] ON [dbo].[kumas_talep_kalem]([kumas_talep_id]);

-- AddForeignKey
ALTER TABLE [dbo].[kumas_talep_kalem] ADD CONSTRAINT [kumas_talep_kalem_kumas_talep_id_fkey] FOREIGN KEY ([kumas_talep_id]) REFERENCES [dbo].[kumas_talep]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable
CREATE TABLE [dbo].[kesim] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_no] VARCHAR(50) NOT NULL,
    [model_kod] VARCHAR(50) NOT NULL,
    [model_ad] VARCHAR(200) NULL,
    [renk_ad] VARCHAR(100) NOT NULL,
    [beden] VARCHAR(20) NOT NULL,
    [planlanan_miktar] INT NOT NULL CONSTRAINT [kesim_planlanan_miktar_df] DEFAULT 0,
    [kesilen_miktar] INT NOT NULL CONSTRAINT [kesim_kesilen_miktar_df] DEFAULT 0,
    [fire_miktar] DECIMAL(18,4) NOT NULL CONSTRAINT [kesim_fire_miktar_df] DEFAULT 0,
    [kumas_ad] VARCHAR(200) NULL,
    [kumas_renk] VARCHAR(100) NULL,
    [gerekli_miktar] DECIMAL(18,4) NOT NULL CONSTRAINT [kesim_gerekli_miktar_df] DEFAULT 0,
    [brut_miktar] DECIMAL(18,4) NOT NULL CONSTRAINT [kesim_brut_miktar_df] DEFAULT 0,
    [kumas_miktar] DECIMAL(18,4) NOT NULL CONSTRAINT [kesim_kumas_miktar_df] DEFAULT 0,
    [birim_tuketim] DECIMAL(18,6) NOT NULL CONSTRAINT [kesim_birim_tuketim_df] DEFAULT 0,
    [beklenen_adet] INT NOT NULL CONSTRAINT [kesim_beklenen_adet_df] DEFAULT 0,
    [kalan_mt] DECIMAL(18,4) NOT NULL CONSTRAINT [kesim_kalan_mt_df] DEFAULT 0,
    [fire_orani] DECIMAL(9,4) NOT NULL CONSTRAINT [kesim_fire_orani_df] DEFAULT 0,
    [iade_talep] BIT NOT NULL CONSTRAINT [kesim_iade_talep_df] DEFAULT 0,
    [tarih] DATETIME2 NOT NULL,
    [durum] VARCHAR(20) NOT NULL CONSTRAINT [kesim_durum_df] DEFAULT 'KESILDI',
    [kaynak_fis_id] INT NULL,
    [kaynak_fis_no] VARCHAR(50) NULL,
    [kaynak_kalem_id] INT NULL,
    [manuel_fire] BIT NOT NULL CONSTRAINT [kesim_manuel_fire_df] DEFAULT 0,
    [olusturan_kullanici] INT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kesim_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kesim_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE INDEX [kesim_siparis_no_idx] ON [dbo].[kesim]([siparis_no]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
