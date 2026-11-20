BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[kasa_banka_hesap] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [tip] VARCHAR(10) NOT NULL,
    [doviz_kodu] VARCHAR(10),
    [acilis_bakiye] DECIMAL(18,2) NOT NULL CONSTRAINT [kasa_banka_hesap_acilis_bakiye_df] DEFAULT 0,
    [banka_adi] VARCHAR(200),
    [sube] VARCHAR(200),
    [iban] VARCHAR(34),
    [hesap_no] VARCHAR(50),
    [kullanimda] BIT NOT NULL CONSTRAINT [kasa_banka_hesap_kullanimda_df] DEFAULT 1,
    [aciklama] VARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kasa_banka_hesap_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kasa_banka_hesap_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [kasa_banka_hesap_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [kasa_banka_hesap_tip_idx] ON [dbo].[kasa_banka_hesap]([tip]);

COMMIT TRAN;

END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
