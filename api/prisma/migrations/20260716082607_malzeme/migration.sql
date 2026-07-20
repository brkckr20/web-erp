BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[malzeme] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [malzeme_kullanimda_df] DEFAULT 1,
    [malzeme_turu] VARCHAR(100),
    [tipi] VARCHAR(100),
    [kategori] VARCHAR(100),
    [plu_kodu] VARCHAR(50),
    [raf_omru] INT,
    [raf_omru_birim] VARCHAR(20),
    [sezon] VARCHAR(100),
    [marka] VARCHAR(100),
    [model] VARCHAR(100),
    [kdv_genel] VARCHAR(50),
    [kdv_perakende] VARCHAR(50),
    [kdv_toptan] VARCHAR(50),
    [kdv_p_satis_iade] VARCHAR(50),
    [kdv_t_satis_iade] VARCHAR(50),
    [ek_vergi_tanimi] VARCHAR(100),
    [tevkifat_satin_alma_pay] INT,
    [tevkifat_satin_alma_payda] INT,
    [tevkifat_satis_pay] INT,
    [tevkifat_satis_payda] INT,
    [kullanim_yeri] VARCHAR(200),
    [takip_sekli] VARCHAR(200),
    [uretici_firma_kodu] VARCHAR(50),
    [uretici_urun_kodu] VARCHAR(100),
    [iso_dokuman_no] VARCHAR(100),
    [gtip_no] VARCHAR(50),
    [web_sayfasi] VARCHAR(500),
    [kampanya_grubu] VARCHAR(100),
    [fiyat_grubu] VARCHAR(100),
    [operasyon_kodu] VARCHAR(50),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [malzeme_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [malzeme_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [malzeme_kod_key] UNIQUE NONCLUSTERED ([kod])
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
