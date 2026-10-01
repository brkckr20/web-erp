BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- AlterTable
ALTER TABLE [dbo].[irsaliye] ALTER COLUMN [irsaliye_no] VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE [dbo].[fatura] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fatura_no] VARCHAR(50) NOT NULL,
    [fatura_tipi] VARCHAR(20) NOT NULL,
    [fatura_tarihi] DATETIME2 NOT NULL,
    [aciklama] VARCHAR(1000),
    [kayit_yapan] VARCHAR(100),
    [kayit_tarihi] DATETIME2,
    [guncelleyen] VARCHAR(100),
    [guncelleme_tarihi] DATETIME2,
    [cari_hesap_id] INT,
    [depo_id] INT,
    [fason_tipi_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [fatura_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [fatura_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [fatura_fatura_tipi_fatura_no_key] UNIQUE NONCLUSTERED ([fatura_tipi],[fatura_no])
);

-- CreateTable
CREATE TABLE [dbo].[fatura_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fatura_id] INT NOT NULL,
    [irsaliye_kalem_id] INT,
    [malzeme_id] INT,
    [tip] VARCHAR(20),
    [takip_no] VARCHAR(100),
    [brut_agirlik] DECIMAL(18,4),
    [net_agirlik] DECIMAL(18,4),
    [brut_metre] DECIMAL(18,4),
    [net_metre] DECIMAL(18,4),
    [adet] INT,
    [olcu_birimi] VARCHAR(20),
    [miktar] DECIMAL(18,4),
    [birim_fiyat] DECIMAL(18,4),
    [doviz] VARCHAR(10),
    [kdv] DECIMAL(18,2),
    [satir_tutari] DECIMAL(18,2),
    [aciklama] VARCHAR(1000),
    [uuid] VARCHAR(100),
    [varyant1_renk_id] INT,
    [varyant2_renk_id] INT,
    [boyahane_renk_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [fatura_kalem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [fatura_kalem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [fatura_cari_hesap_id_idx] ON [dbo].[fatura]([cari_hesap_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [fatura_created_at_idx] ON [dbo].[fatura]([created_at]);

-- AddForeignKey
ALTER TABLE [dbo].[fatura] ADD CONSTRAINT [fatura_cari_hesap_id_fkey] FOREIGN KEY ([cari_hesap_id]) REFERENCES [dbo].[cari_hesap]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[fatura] ADD CONSTRAINT [fatura_depo_id_fkey] FOREIGN KEY ([depo_id]) REFERENCES [dbo].[depo]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[fatura] ADD CONSTRAINT [fatura_fason_tipi_id_fkey] FOREIGN KEY ([fason_tipi_id]) REFERENCES [dbo].[fason_tipi]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[fatura_kalem] ADD CONSTRAINT [fatura_kalem_fatura_id_fkey] FOREIGN KEY ([fatura_id]) REFERENCES [dbo].[fatura]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[fatura_kalem] ADD CONSTRAINT [fatura_kalem_irsaliye_kalem_id_fkey] FOREIGN KEY ([irsaliye_kalem_id]) REFERENCES [dbo].[irsaliye_kalem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[fatura_kalem] ADD CONSTRAINT [fatura_kalem_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[fatura_kalem] ADD CONSTRAINT [fatura_kalem_varyant1_renk_id_fkey] FOREIGN KEY ([varyant1_renk_id]) REFERENCES [dbo].[renk]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[fatura_kalem] ADD CONSTRAINT [fatura_kalem_varyant2_renk_id_fkey] FOREIGN KEY ([varyant2_renk_id]) REFERENCES [dbo].[renk]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[fatura_kalem] ADD CONSTRAINT [fatura_kalem_boyahane_renk_id_fkey] FOREIGN KEY ([boyahane_renk_id]) REFERENCES [dbo].[renk]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
