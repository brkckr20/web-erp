BEGIN TRY

BEGIN TRAN;

-- AlterTable: kod tekilliği tipli hale gelir (aynı kod genel ve proseste ayrı ayrı olabilir).
ALTER TABLE [dbo].[islem] DROP CONSTRAINT [islem_kod_key];
ALTER TABLE [dbo].[islem] ADD CONSTRAINT [islem_kod_tip_key] UNIQUE ([kod], [tip]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
