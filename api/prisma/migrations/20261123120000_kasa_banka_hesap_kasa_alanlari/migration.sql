BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[kasa_banka_hesap] ADD
    [doviz_kodu] VARCHAR(10),
    [is_yeri_kodu] VARCHAR(50),
    [masraf_yeri_kodu] VARCHAR(50);

COMMIT TRAN;

END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
