-- Serbest (siparişe bağlı olmayan) ham stoktan sipariş kalemine elle tahsis.
-- irsaliye_kalem_tahsis'ten ayrı tablo: fiş kaydı onu silip yeniden yazıyor.

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[stok_tahsis] (
    [id] INT NOT NULL IDENTITY(1,1),
    [irsaliye_kalem_id] INT NOT NULL,
    [siparis_kalem_id] INT NOT NULL,
    [malzeme_id] INT NOT NULL,
    [renk_id] INT,
    [siparis_no] VARCHAR(50),
    [model_kod] VARCHAR(100),
    [miktar] DECIMAL(18,4) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [stok_tahsis_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [stok_tahsis_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stok_tahsis_irsaliye_kalem_id_idx] ON [dbo].[stok_tahsis]([irsaliye_kalem_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stok_tahsis_siparis_kalem_id_malzeme_id_idx] ON [dbo].[stok_tahsis]([siparis_kalem_id], [malzeme_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stok_tahsis_malzeme_id_idx] ON [dbo].[stok_tahsis]([malzeme_id]);

-- AddForeignKey
ALTER TABLE [dbo].[stok_tahsis] ADD CONSTRAINT [stok_tahsis_irsaliye_kalem_id_fkey] FOREIGN KEY ([irsaliye_kalem_id]) REFERENCES [dbo].[irsaliye_kalem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
