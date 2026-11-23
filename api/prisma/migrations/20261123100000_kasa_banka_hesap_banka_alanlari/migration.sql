BEGIN TRY

BEGIN TRAN;

-- Şube adı kolonu yeniden adlandırılıyor
EXEC sp_rename 'dbo.kasa_banka_hesap.sube', 'sube_adi', 'COLUMN';

ALTER TABLE [dbo].[kasa_banka_hesap] ADD
    [ana_banka_kodu] VARCHAR(5),
    [sube_kodu] VARCHAR(20),
    [swift_kodu] VARCHAR(20),
    [ilgili_kisi] VARCHAR(200),
    [erisim_kodu] VARCHAR(50),
    [ozel_kod] VARCHAR(50);

COMMIT TRAN;

END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
