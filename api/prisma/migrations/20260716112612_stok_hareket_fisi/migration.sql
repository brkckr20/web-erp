BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[stok_hareket_fisi] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fis_no] VARCHAR(50) NOT NULL,
    [fis_tipi] VARCHAR(20) NOT NULL,
    [fis_tarihi] DATETIME2 NOT NULL,
    [aciklama] VARCHAR(1000),
    [fatura_no] VARCHAR(50),
    [fatura_tarihi] DATETIME2,
    [sevk_no] VARCHAR(50),
    [sevk_tarihi] DATETIME2,
    [vade_tarihi] DATETIME2,
    [yetkili] VARCHAR(200),
    [onaylandi] BIT NOT NULL CONSTRAINT [stok_hareket_fisi_onaylandi_df] DEFAULT 0,
    [tamamlandi] BIT NOT NULL CONSTRAINT [stok_hareket_fisi_tamamlandi_df] DEFAULT 0,
    [musteri_siparis_no] VARCHAR(50),
    [siparis_no] VARCHAR(50),
    [vade] INT,
    [odeme_tipi] VARCHAR(50),
    [kayit_yapan] VARCHAR(100),
    [kayit_tarihi] DATETIME2,
    [guncelleyen] VARCHAR(100),
    [guncelleme_tarihi] DATETIME2,
    [tasiyici_id] INT,
    [nakliyeci_id] INT,
    [belge_adi] VARCHAR(200),
    [cari_hesap_id] INT,
    [depo_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [stok_hareket_fisi_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [stok_hareket_fisi_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[stok_hareket_fisi_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fis_id] INT NOT NULL,
    [islem_tipi] VARCHAR(20),
    [malzeme_id] INT,
    [gr_m2] DECIMAL(18,6),
    [brut_agirlik] DECIMAL(18,6),
    [net_agirlik] DECIMAL(18,6),
    [brut_metre] DECIMAL(18,6),
    [net_metre] DECIMAL(18,6),
    [adet] INT,
    [doviz_fiyati] DECIMAL(18,6),
    [doviz] VARCHAR(10),
    [birim_fiyat] DECIMAL(18,6),
    [variant_id] INT,
    [renk_id] INT,
    [aciklama] VARCHAR(1000),
    [uuid] VARCHAR(100),
    [takip_no] VARCHAR(100),
    [desen_id] INT,
    [islem_id] INT,
    [satir_tutari] DECIMAL(18,6),
    [kdv] DECIMAL(18,6),
    [alici] VARCHAR(200),
    [olcu_birimi] VARCHAR(20),
    [fis_no] VARCHAR(50),
    [marka] VARCHAR(100),
    [fire] DECIMAL(18,6),
    [miktar] DECIMAL(18,6),
    [variant] VARCHAR(100),
    [pesin_odeme] BIT NOT NULL CONSTRAINT [stok_hareket_fisi_kalem_pesin_odeme_df] DEFAULT 0,
    [vadeli_odeme] BIT NOT NULL CONSTRAINT [stok_hareket_fisi_kalem_vadeli_odeme_df] DEFAULT 0,
    [satir_aciklama] VARCHAR(1000),
    [parti_no] VARCHAR(100),
    [siparis_no] VARCHAR(50),
    [musteri_siparis_no] VARCHAR(50),
    [maliyet_hesaplandi] BIT NOT NULL CONSTRAINT [stok_hareket_fisi_kalem_maliyet_hesaplandi_df] DEFAULT 0,
    [cip_li] BIT NOT NULL CONSTRAINT [stok_hareket_fisi_kalem_cip_li_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [stok_hareket_fisi_kalem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [stok_hareket_fisi_kalem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [stok_hareket_fisi_kalem_fis_id_uuid_key] UNIQUE NONCLUSTERED ([fis_id],[uuid])
);

-- AddForeignKey
ALTER TABLE [dbo].[stok_hareket_fisi] ADD CONSTRAINT [stok_hareket_fisi_cari_hesap_id_fkey] FOREIGN KEY ([cari_hesap_id]) REFERENCES [dbo].[cari_hesap]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[stok_hareket_fisi] ADD CONSTRAINT [stok_hareket_fisi_depo_id_fkey] FOREIGN KEY ([depo_id]) REFERENCES [dbo].[depo]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[stok_hareket_fisi_kalem] ADD CONSTRAINT [stok_hareket_fisi_kalem_fis_id_fkey] FOREIGN KEY ([fis_id]) REFERENCES [dbo].[stok_hareket_fisi]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[stok_hareket_fisi_kalem] ADD CONSTRAINT [stok_hareket_fisi_kalem_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
