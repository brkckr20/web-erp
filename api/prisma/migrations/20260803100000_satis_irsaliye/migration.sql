BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[satis_irsaliye] (
    [id] INT NOT NULL IDENTITY(1,1),
    [irsaliye_no] VARCHAR(50) NOT NULL,
    [irsaliye_tipi] VARCHAR(20) NOT NULL,
    [irsaliye_tarihi] DATETIME2 NOT NULL,
    [aciklama] VARCHAR(1000),
    [fatura_no] VARCHAR(50),
    [fatura_tarihi] DATETIME2,
    [sevk_no] VARCHAR(50),
    [sevk_tarihi] DATETIME2,
    [onaylandi] BIT NOT NULL CONSTRAINT [satis_irsaliye_onaylandi_df] DEFAULT 0,
    [tamamlandi] BIT NOT NULL CONSTRAINT [satis_irsaliye_tamamlandi_df] DEFAULT 0,
    [kayit_yapan] VARCHAR(100),
    [kayit_tarihi] DATETIME2,
    [guncelleyen] VARCHAR(100),
    [guncelleme_tarihi] DATETIME2,
    [cari_hesap_id] INT,
    [depo_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [satis_irsaliye_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [satis_irsaliye_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[satis_irsaliye_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [irsaliye_id] INT NOT NULL,
    [malzeme_id] INT,
    [miktar] DECIMAL(18,6),
    [birim_fiyat] DECIMAL(18,6),
    [doviz] VARCHAR(10),
    [kdv] DECIMAL(18,6),
    [satir_tutari] DECIMAL(18,6),
    [aciklama] VARCHAR(1000),
    [uuid] VARCHAR(100),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [satis_irsaliye_kalem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [satis_irsaliye_kalem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE UNIQUE INDEX [satis_irsaliye_irsaliye_tipi_irsaliye_no_key] ON [dbo].[satis_irsaliye]([irsaliye_tipi], [irsaliye_no]);

-- AddForeignKey
ALTER TABLE [dbo].[satis_irsaliye] ADD CONSTRAINT [satis_irsaliye_cari_hesap_id_fkey] FOREIGN KEY ([cari_hesap_id]) REFERENCES [dbo].[cari_hesap]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[satis_irsaliye] ADD CONSTRAINT [satis_irsaliye_depo_id_fkey] FOREIGN KEY ([depo_id]) REFERENCES [dbo].[depo]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD CONSTRAINT [satis_irsaliye_kalem_irsaliye_id_fkey] FOREIGN KEY ([irsaliye_id]) REFERENCES [dbo].[satis_irsaliye]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[satis_irsaliye_kalem] ADD CONSTRAINT [satis_irsaliye_kalem_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
