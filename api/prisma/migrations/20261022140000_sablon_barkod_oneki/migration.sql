BEGIN TRY

BEGIN TRAN;

-- Etiket şablonunu barkod ön ekine bağlar (ör. YM / HM). NULL = genel şablon.
ALTER TABLE [dbo].[sablon] ADD [barkod_oneki] NVARCHAR(20);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
