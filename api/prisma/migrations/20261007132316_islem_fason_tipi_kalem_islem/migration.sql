BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- AlterTable
ALTER TABLE [dbo].[islem] ADD [fason_tipi_id] INT;

-- CreateTable
CREATE TABLE [dbo].[irsaliye_kalem_islem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [irsaliye_kalem_id] INT NOT NULL,
    [islem_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [irsaliye_kalem_islem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [irsaliye_kalem_islem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [irsaliye_kalem_islem_irsaliye_kalem_id_islem_id_key] UNIQUE NONCLUSTERED ([irsaliye_kalem_id],[islem_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [irsaliye_kalem_islem_irsaliye_kalem_id_idx] ON [dbo].[irsaliye_kalem_islem]([irsaliye_kalem_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [irsaliye_kalem_islem_islem_id_idx] ON [dbo].[irsaliye_kalem_islem]([islem_id]);

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye_kalem_islem] ADD CONSTRAINT [irsaliye_kalem_islem_irsaliye_kalem_id_fkey] FOREIGN KEY ([irsaliye_kalem_id]) REFERENCES [dbo].[irsaliye_kalem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye_kalem_islem] ADD CONSTRAINT [irsaliye_kalem_islem_islem_id_fkey] FOREIGN KEY ([islem_id]) REFERENCES [dbo].[islem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
