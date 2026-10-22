BEGIN TRY

BEGIN TRAN;

-- Partiye bağlı kaçıncı top? (grup: irsaliye + partiNo + boyahane rengi + malzeme)
-- NULL: 11 kalemine bağlı olmayan (elle girilen) KK satırı.
ALTER TABLE [dbo].[kalite_kontrol_kalem] ADD [top_no] INT;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
