BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- AlterTable
ALTER TABLE [dbo].[makina] ADD [ozel_kod] VARCHAR(50);

-- AlterTable
ALTER TABLE [dbo].[malzeme] ADD [aciklama] NVARCHAR(500),
[ozel_kod] VARCHAR(50);

-- CreateIndex
CREATE NONCLUSTERED INDEX [malzeme_ozel_kod_idx] ON [dbo].[malzeme]([ozel_kod]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
