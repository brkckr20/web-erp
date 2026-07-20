BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[makina] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [makina_kullanimda_df] DEFAULT 1,
    [makina_turu] VARCHAR(100),
    [marka] VARCHAR(100),
    [model] VARCHAR(100),
    [seri_no] VARCHAR(100),
    [envanter_no] VARCHAR(100),
    [kategori] VARCHAR(100),
    [lokasyon] VARCHAR(200),
    [departman] VARCHAR(100),
    [sorumlu] VARCHAR(200),
    [uretici_firma] VARCHAR(200),
    [tedarikci] VARCHAR(200),
    [alim_tarihi] DATETIME2,
    [garanti_bitis] DATETIME2,
    [alim_bedeli] DECIMAL(18,2),
    [guc_kw] DECIMAL(18,2),
    [kapasite] VARCHAR(100),
    [kapasite_birim] VARCHAR(50),
    [voltaj] VARCHAR(50),
    [bakim_periyodu] INT,
    [bakim_periyodu_birim] VARCHAR(20),
    [son_bakim_tarihi] DATETIME2,
    [durumu] VARCHAR(50),
    [aciklama] VARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [makina_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [makina_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [makina_kod_key] UNIQUE NONCLUSTERED ([kod])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
