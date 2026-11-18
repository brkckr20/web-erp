-- e-İrsaliye durum adı "Onaylandı" -> "Dosya Gönderildi".
-- Simülasyon akışında GİB onayı olmadığı için durum adı gönderimle hizalandı.

BEGIN TRY

BEGIN TRAN;

UPDATE [dbo].[irsaliye] SET [e_irsaliye_durum] = 'Dosya Gönderildi' WHERE [e_irsaliye_durum] = 'Onaylandı';
UPDATE [dbo].[e_irsaliye_log] SET [durum] = 'Dosya Gönderildi' WHERE [durum] = 'Onaylandı';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
