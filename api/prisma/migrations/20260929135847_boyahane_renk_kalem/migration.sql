BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- AlterTable
ALTER TABLE [dbo].[irsaliye_kalem] ADD [boyahane_renk_ad] NVARCHAR(200),
[boyahane_renk_id] INT,
[boyahane_renk_kod] NVARCHAR(50);

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye_kalem] ADD CONSTRAINT [irsaliye_kalem_boyahane_renk_id_fkey] FOREIGN KEY ([boyahane_renk_id]) REFERENCES [dbo].[renk]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
