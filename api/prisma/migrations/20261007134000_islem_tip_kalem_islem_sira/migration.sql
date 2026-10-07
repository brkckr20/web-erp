BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[irsaliye_kalem_islem] ADD [sira] INT NOT NULL CONSTRAINT [irsaliye_kalem_islem_sira_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[islem] DROP COLUMN [fason_tipi_id];
ALTER TABLE [dbo].[islem] ADD [tip] INT NOT NULL CONSTRAINT [islem_tip_df] DEFAULT 1;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
