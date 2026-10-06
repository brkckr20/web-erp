BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- CreateTable
CREATE TABLE [dbo].[irsaliye_kalem_tahsis] (
    [id] INT NOT NULL IDENTITY(1,1),
    [irsaliye_kalem_id] INT NOT NULL,
    [siparis_kalem_id] INT,
    [siparis_no] VARCHAR(50),
    [model_kod] VARCHAR(100),
    [miktar] DECIMAL(18,4) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [irsaliye_kalem_tahsis_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [irsaliye_kalem_tahsis_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [irsaliye_kalem_tahsis_irsaliye_kalem_id_idx] ON [dbo].[irsaliye_kalem_tahsis]([irsaliye_kalem_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [irsaliye_kalem_tahsis_siparis_kalem_id_idx] ON [dbo].[irsaliye_kalem_tahsis]([siparis_kalem_id]);

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye_kalem_tahsis] ADD CONSTRAINT [irsaliye_kalem_tahsis_irsaliye_kalem_id_fkey] FOREIGN KEY ([irsaliye_kalem_id]) REFERENCES [dbo].[irsaliye_kalem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
