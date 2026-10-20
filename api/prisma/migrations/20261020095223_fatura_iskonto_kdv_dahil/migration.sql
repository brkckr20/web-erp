BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[fatura_kalem] ADD [iskonto_orani] DECIMAL(18,4),
[iskonto_tutari] DECIMAL(18,2),
[kdv_dahil] BIT;

-- AlterTable
ALTER TABLE [dbo].[hizmet_talep] DROP CONSTRAINT [hizmet_talep_kapanis_tarihi_df];
ALTER TABLE [dbo].[hizmet_talep] ADD CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01' FOR [kapanis_tarihi];

-- AlterTable
ALTER TABLE [dbo].[irsaliye_kalem] ADD [iskonto_orani] DECIMAL(18,4),
[iskonto_tutari] DECIMAL(18,2),
[kdv_dahil] BIT;

-- AlterTable
ALTER TABLE [dbo].[malzeme] ADD [kdv_dahil] BIT;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
