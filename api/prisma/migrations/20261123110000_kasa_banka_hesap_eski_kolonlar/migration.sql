BEGIN TRY

BEGIN TRAN;

-- Açılış bakiyesi kolonunun default kısıtı kolonla birlikte kaldırılmalı
ALTER TABLE [dbo].[kasa_banka_hesap] DROP CONSTRAINT [kasa_banka_hesap_acilis_bakiye_df];

ALTER TABLE [dbo].[kasa_banka_hesap] DROP COLUMN [doviz_kodu], [acilis_bakiye], [iban], [hesap_no];

COMMIT TRAN;

END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
