BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[depo_raf] DROP CONSTRAINT [depo_raf_depo_id_fkey];

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- AlterTable
ALTER TABLE [dbo].[irsaliye] ADD [termin_tarihi] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[irsaliye_kalem] ADD [fire] DECIMAL(18,4),
[siparis_kalem_id] INT;

-- AddForeignKey
ALTER TABLE [dbo].[depo_raf] ADD CONSTRAINT [depo_raf_depo_id_fkey] FOREIGN KEY ([depo_id]) REFERENCES [dbo].[depo]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
